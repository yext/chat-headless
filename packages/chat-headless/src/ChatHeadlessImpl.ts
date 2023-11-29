import {
  provideChatCore,
  Message,
  MessageNotes,
  MessageResponse,
  MessageSource,
  StreamEventName,
} from "@yext/chat-core";
import { State } from "./models/state";
import { ReduxStateManager } from "./ReduxStateManager";
import {
  loadSessionState,
  setCanSendMessage,
  setConversationId,
  setIsLoading,
  setMessageNotes,
  setMessages,
  setMessageSuggestions,
  addMessage,
  STATE_SESSION_STORAGE_KEY,
} from "./slices/conversation";
import { DeepPartial, Store, Unsubscribe } from "@reduxjs/toolkit";
import { StateListener } from "./models";
import { setContext } from "./slices/meta";
import { HeadlessConfig } from "./models/HeadlessConfig";
import {
  provideChatAnalytics,
  ChatAnalyticsService,
  ChatEventPayLoad,
} from "@yext/analytics";
import { getClientSdk } from "./utils/clientSdk";
import { ChatClient } from "./models/ChatClient";
import { ChatHeadless } from "./models";

/**
 * Concrete implementation of {@link ChatHeadless}
 *
 * @internal
 */
export class ChatHeadlessImpl implements ChatHeadless {
  private config: HeadlessConfig;
  private chatClient: ChatClient;
  private stateManager: ReduxStateManager;
  private chatAnalyticsService: ChatAnalyticsService;

  private isImpressionAnalyticEventSent = false;

  /**
   * Constructs a new instance of the {@link ChatHeadlessImpl} class.
   *
   * @internal
   *
   * @param config - The configuration for the {@link ChatHeadlessImpl} instance
   * @param chatClient - An optional override for the default {@link ChatClient} instance
   */
  constructor(config: HeadlessConfig, chatClient?: ChatClient) {
    const defaultConfig: Partial<HeadlessConfig> = {
      saveToSessionStorage: true,
    };
    this.config = { ...defaultConfig, ...config };
    this.chatClient = chatClient ?? provideChatCore(this.config);
    this.stateManager = new ReduxStateManager();
    this.chatAnalyticsService = provideChatAnalytics({
      apiKey: this.config.apiKey,
      env: this.config.env,
      region: this.config.region,
      ...this.config.analyticsConfig,
    });
    if (this.config.saveToSessionStorage) {
      this.initSessionStorage();
    }
  }

  get state(): State {
    return this.stateManager.getState();
  }

  setState(state: State): void {
    this.stateManager.dispatch({
      type: "set-state",
      payload: state,
    });
  }

  get store(): Store {
    return this.stateManager.getStore();
  }

  addClientSdk(additionalClientSdk: Record<string, string>) {
    const { analyticsConfig } = this.config;
    this.config.analyticsConfig = {
      ...analyticsConfig,
      baseEventPayload: {
        ...analyticsConfig?.baseEventPayload,
        clientSdk: {
          ...analyticsConfig?.baseEventPayload?.clientSdk,
          ...additionalClientSdk,
        },
      },
    };
  }

  initSessionStorage() {
    this.setState({
      ...this.state,
      conversation: loadSessionState(),
    });
    this.addListener({
      valueAccessor: (s) => s.conversation,
      callback: () =>
        sessionStorage.setItem(
          STATE_SESSION_STORAGE_KEY,
          JSON.stringify(this.state.conversation)
        ),
    });
  }

  async report(
    eventPayload: Omit<ChatEventPayLoad, "chat"> &
      DeepPartial<Pick<ChatEventPayLoad, "chat">>
  ) {
    if (eventPayload.action === "CHAT_IMPRESSION") {
      if (this.isImpressionAnalyticEventSent) {
        return;
      }
      this.isImpressionAnalyticEventSent = true;
    }
    const chatProps: ChatEventPayLoad["chat"] = {
      botId: this.config.botId,
      conversationId: this.state.conversation.conversationId,
    };
    const baseEventPayload = this.config.analyticsConfig?.baseEventPayload;
    try {
      await this.chatAnalyticsService.report({
        timestamp: new Date().toISOString(),
        pageUrl: window?.location.href || undefined,
        referrerUrl: window?.document.referrer || undefined,
        ...baseEventPayload,
        ...eventPayload,
        clientSdk: getClientSdk({
          ...baseEventPayload?.clientSdk,
          ...eventPayload.clientSdk,
        }),
        chat: {
          ...chatProps,
          ...baseEventPayload?.chat,
          ...eventPayload.chat,
        },
      });
    } catch (e) {
      console.error("Error occured on request to Analytics API:", e);
    }
  }

  setContext(context: unknown) {
    this.stateManager.dispatch(setContext(context));
  }

  setMessages(messages: Message[]) {
    this.stateManager.dispatch(setMessages(messages));
  }

  addMessage(message: Message) {
    this.stateManager.dispatch(addMessage(message));
  }

  setMessageNotes(notes: MessageNotes) {
    this.stateManager.dispatch(setMessageNotes(notes));
  }

  setChatLoadingStatus(isLoading: boolean) {
    this.stateManager.dispatch(setIsLoading(isLoading));
  }

  setCanSendMessage(canSendMessage: boolean) {
    this.stateManager.dispatch(setCanSendMessage(canSendMessage));
  }

  setMessageSuggestions(messageSuggestions: string[] | undefined) {
    this.stateManager.dispatch(setMessageSuggestions(messageSuggestions));
  }

  /**
   * Sets {@link ConversationState.conversationId} to the specified id
   *
   * @internal
   *
   * @param id - the id to set
   */
  private setConversationId(id: string | undefined) {
    this.stateManager.dispatch(setConversationId(id));
  }

  restartConversation() {
    this.setConversationId(undefined);
    this.setChatLoadingStatus(false);
    this.setCanSendMessage(true);
    this.setMessageNotes({});
    this.setMessages([]);
  }

  addListener<T>(listener: StateListener<T>): Unsubscribe {
    return this.stateManager.addListener<T>(listener);
  }

  async getNextMessage(
    text?: string,
    source: MessageSource = MessageSource.USER
  ): Promise<MessageResponse | undefined> {
    return this.nextMessageHandler(
      async () => {
        const { messages, conversationId, notes } = this.state.conversation;
        const nextMessage = await this.chatClient.getNextMessage({
          conversationId,
          messages,
          notes,
          context: this.state.meta.context,
        });
        this.setConversationId(nextMessage.conversationId);
        this.setMessages([...messages, nextMessage.message]);
        this.setMessageNotes(nextMessage.notes);
        return nextMessage;
      },
      text,
      source
    );
  }

  async streamNextMessage(
    text?: string,
    source: MessageSource = MessageSource.USER
  ): Promise<MessageResponse | undefined> {
    return this.nextMessageHandler(
      async () => {
        let messageResponse: MessageResponse | undefined = undefined;
        let nextMessage: Message = {
          source: MessageSource.BOT,
          text: "",
        };
        const { messages, conversationId, notes } = this.state.conversation;
        const stream = await this.chatClient.streamNextMessage({
          conversationId,
          messages,
          notes,
          context: this.state.meta.context,
        });
        stream.addEventListener(StreamEventName.StartEvent, ({ data }) => {
          this.setChatLoadingStatus(false);
          this.setMessageNotes(data);
        });
        stream.addEventListener(
          StreamEventName.TokenStreamEvent,
          ({ data }) => {
            nextMessage = {
              ...nextMessage,
              text: nextMessage.text + data.token,
            };
            this.setMessages([...messages, nextMessage]);
          }
        );
        stream.addEventListener(StreamEventName.EndEvent, ({ data }) => {
          this.setConversationId(data.conversationId);
          this.setMessages([...messages, data.message]);
          messageResponse = data;
        });
        await stream.consume();
        if (!messageResponse) {
          return Promise.reject(
            "Stream Error: Missing full message response at the end of stream."
          );
        }
        return messageResponse;
      },
      text,
      source
    );
  }

  /**
   * Setup relevant state before hitting Chat API endpoint for next message, such as
   * setting loading status, "canSendMessage" status, and appending new user's message
   * in conversation state.
   *
   * @internal
   *
   * @param nextMessageFn - function to invoke to get next message
   * @param text - the text of the next message
   * @param source - the source of the message
   * @returns a Promise of a response from the Chat API
   */
  private async nextMessageHandler(
    nextMessageFn: () => Promise<MessageResponse>,
    text?: string,
    source: MessageSource = MessageSource.USER
  ): Promise<MessageResponse | undefined> {
    if (!this.state.conversation.canSendMessage) {
      console.warn(
        "Unable to process new message at the moment. Another message is still being processed."
      );
      return;
    }
    this.setCanSendMessage(false);
    this.setChatLoadingStatus(true);
    let messages: Message[] = this.state.conversation.messages;
    if (text && text.length > 0) {
      messages = [
        ...messages,
        {
          timestamp: new Date().toISOString(),
          source,
          text,
        },
      ];
      this.setMessages(messages);
    }
    let messageResponse;
    try {
      messageResponse = await nextMessageFn();
    } catch (e) {
      this.setCanSendMessage(true);
      this.setChatLoadingStatus(false);
      return Promise.reject(e as Error);
    }
    this.report({
      action: "CHAT_RESPONSE",
      timestamp: messageResponse.message.timestamp,
      chat: {
        conversationId: messageResponse.conversationId,
        responseId: messageResponse.message.responseId,
      },
    });
    this.setCanSendMessage(true);
    this.setChatLoadingStatus(false);
    return messageResponse;
  }
}
