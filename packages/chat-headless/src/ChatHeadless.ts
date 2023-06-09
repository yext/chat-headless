import {
  ChatCore,
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

/**
 * Provides the functionality for interacting with a Chat Bot
 * and the relevant application state.
 *
 * @public
 */
export class ChatHeadless {
  private config: HeadlessConfig;
  private chatCore: ChatCore;
  private stateManager: ReduxStateManager;
  private chatAnalyticsService: ChatAnalyticsService;

  private isImpressionAnalyticEventSent = false;

  /**
   * Constructs a new instance of the {@link ChatHeadless} class.
   *
   * @public
   *
   * @param config - The configuration for the {@link ChatHeadless} instance
   */
  constructor(config: HeadlessConfig) {
    const defaultConfig: Partial<HeadlessConfig> = {
      saveToSessionStorage: true,
    };
    this.config = { ...defaultConfig, ...config };
    this.chatCore = new ChatCore(this.config);
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

  /**
   * Gets the current state of the ChatHeadless instance.
   *
   * @public
   */
  get state(): State {
    return this.stateManager.getState();
  }

  /**
   * Sets the {@link State} to the specified state.
   *
   * @public
   *
   * @param state - The state to set
   */
  setState(state: State): void {
    this.stateManager.dispatch({
      type: "set-state",
      payload: state,
    });
  }

  /**
   * Gets the store that holds the application's state tree.
   *
   * @remarks
   * This is intended for internal usage in the binding packages only.
   *
   * @internal
   */
  get store(): Store {
    return this.stateManager.getStore();
  }

  /**
   * Adds additional client SDKs to the base event payload for Yext Analytics API.
   *
   * @remarks
   * This is intended for internal usage in the Yext Chat related packages only.
   *
   * @internal
   */
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

  /**
   * Loads the {@link ConversationState} from session storage, if present,
   * and adds a listener to keep the conversation state in sync with the stored
   * state
   *
   * @remarks
   * This is called by default if {@link HeadlessConfig.saveToSessionStorage} is
   * true.
   *
   * @public
   */
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

  /**
   * Send Chat related analytics event to Yext Analytics API.
   *
   * @remarks
   * once a CHAT_IMPRESSION analytics event is reported, subsequent
   * CHAT_IMPRESSION reports will not be send.
   *
   * @public
   */
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
        pageUrl: window?.location.href,
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

  /**
   * Sets {@link MetaState.context} to the specified context.
   *
   * @public
   *
   * @param context - The context to set
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setContext(context: any) {
    this.stateManager.dispatch(setContext(context));
  }

  /**
   * Sets {@link ConversationState.messages} to the specified messages
   *
   * @public
   *
   * @param messages - the messages to set
   */
  setMessages(messages: Message[]) {
    this.stateManager.dispatch(setMessages(messages));
  }

  /**
   * Adds a new message to {@link ConversationState.messages}
   *
   * @public
   *
   * @param message - the message to add to state
   */
  addMessage(message: Message) {
    this.stateManager.dispatch(addMessage(message));
  }

  /**
   * Sets {@link ConversationState.notes} to the specified notes
   *
   * @public
   *
   * @param notes - the notes to set
   */
  setMessageNotes(notes: MessageNotes) {
    this.stateManager.dispatch(setMessageNotes(notes));
  }

  /**
   * Sets {@link ConversationState.isLoading} to the specified loading state
   *
   * @public
   *
   * @param isLoading - the loading state to set
   */
  setChatLoadingStatus(isLoading: boolean) {
    this.stateManager.dispatch(setIsLoading(isLoading));
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

  /**
   * Sets {@link ConversationState.canSendMessage} to the specified state
   *
   * @internal
   *
   * @param canSendMessage - the state to set
   */
  private setCanSendMessage(canSendMessage: boolean) {
    this.stateManager.dispatch(setCanSendMessage(canSendMessage));
  }

  /**
   * Resets all fields within {@link ConversationState}
   *
   * @public
   */
  restartConversation() {
    this.setConversationId(undefined);
    this.setChatLoadingStatus(false);
    this.setCanSendMessage(true);
    this.setMessageNotes({});
    this.setMessages([]);
  }

  /**
   * Adds a listener for a specific state value of type T.
   *
   * @public
   *
   * @param listener - The state listener to add
   * @returns The function for removing the added listener
   */
  addListener<T>(listener: StateListener<T>): Unsubscribe {
    return this.stateManager.addListener<T>(listener);
  }

  /**
   * Performs a Chat API request for the next message generated by chat bot
   * using the conversation state (e.g. message history and notes). Update
   * the state with the response data.
   *
   * @public
   *
   * @remarks
   * If rejected, an Error is returned.
   *
   * @param text - the text of the next message
   * @param source - the source of the message
   * @returns a Promise of a response from the Chat API
   */
  async getNextMessage(
    text?: string,
    source: MessageSource = MessageSource.USER
  ): Promise<MessageResponse | undefined> {
    return this.nextMessageHandler(
      async () => {
        const { messages, conversationId, notes } = this.state.conversation;
        const nextMessage = await this.chatCore.getNextMessage({
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

  /**
   * Performs a Chat Stream API request for the next message generated
   * by chat bot using the conversation state (e.g. message history and notes).
   * The new message's "text" field is continously updated as tokens from the
   * stream are consumed. Remaining conversation state are updated once the
   * final event from the stream is recieved.
   *
   * @public
   *
   * @experimental
   *
   * @remarks
   * If rejected, an Error is returned.
   *
   * @param text - the text of the next message
   * @param source - the source of the message
   * @returns a Promise of the full response from the Chat Stream API
   */
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
        const stream = await this.chatCore.streamNextMessage({
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
