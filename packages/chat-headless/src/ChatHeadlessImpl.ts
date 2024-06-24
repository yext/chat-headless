import {
  provideChatCore,
  Message,
  MessageNotes,
  MessageResponse,
  MessageSource,
  StreamEventName,
  ApiError,
} from "@yext/chat-core";
import { State } from "./models/state";
import { ReduxStateManager } from "./ReduxStateManager";
import {
  loadSessionState,
  saveSessionState,
  setCanSendMessage,
  setConversationId,
  setIsLoading,
  setMessageNotes,
  setMessages,
  addMessage,
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
import { ChatClient, isChatEventClient } from "./models/ChatClient";
import { ChatHeadless } from "./models";

// ChatClient | ChatEventClient
// ChatClient
// - getNextMessage
// - streamNextMessage

// ChatEventClient
// - processMesage
// - on
// - emit
// - getSession
// - init
// - close


/**
 * Concrete implementation of {@link ChatHeadless}
 *
 * @internal
 */
export class ChatHeadlessImpl implements ChatHeadless {
  private config: HeadlessConfig;
  private chatClient: ChatClient;
  private botClient: ChatClient;
  private agentClient?: ChatClient;
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
  constructor(config: HeadlessConfig, botClient?: ChatClient, agentClient?: ChatClient) {
    const defaultConfig: Partial<HeadlessConfig> = {
      saveToLocalStorage: true,
    };
    this.config = { ...defaultConfig, ...config };
    this.botClient = botClient ?? provideChatCore(this.config);
    this.agentClient = agentClient;
    this.setClientEventListeners();

    //by default we start with botClient
    this.chatClient = this.botClient
    
    this.stateManager = new ReduxStateManager();
    this.chatAnalyticsService = provideChatAnalytics({
      apiKey: this.config.apiKey,
      env: this.config.env,
      region: this.config.region,
      ...this.config.analyticsConfig,
    });
    if (this.config.saveToLocalStorage) {
      this.initLocalStorage();
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

  private setClientEventListeners() {
    [this.botClient, this.agentClient].forEach((client) => {
      if (!client || !isChatEventClient(client)) {
        return;
      }

      client.on("message", (data: any) => {
        const { messages } = this.state.conversation;
        this.setMessages([...messages, {
          source: MessageSource.BOT,
          text: data,
          timestamp: new Date().toISOString(),
        }]);
      });
      //over in UI, we may also need a way to emit user typing event
      client.on("typing", (data: any) => {
        this.setChatLoadingStatus(data);
      });
      client.on("close/handoff", (_data: any) => {
        this.chatClient = this.botClient;
        //resume
        console.log("Handoff closed")
        this.getNextMessage('');
      });
    });
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

  initLocalStorage() {
    this.setState({
      ...this.state,
      conversation: loadSessionState(this.config.botId),
    });
    this.addListener({
      valueAccessor: (s) => s.conversation,
      callback: () =>
        saveSessionState(this.config.botId, this.state.conversation),
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
    const client = this.chatClient;
    if (isChatEventClient(client)) {
      console.log('1')
      const { conversationId, notes } = this.state.conversation;
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
      return client.processMessage({
        conversationId,
        messages,
        notes,
        context: this.state.meta.context,
      });
    }
    console.log('2')
    return this.nextMessageHandler(
      async () => {
        const { messages, conversationId, notes } = this.state.conversation;
        const nextMessage = await client.getNextMessage({
          conversationId,
          messages,
          notes,
          context: this.state.meta.context,
        });
        console.log("MESSAGE", nextMessage)
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
    const client = this.chatClient;
    if (isChatEventClient(client)) {
      const { messages, conversationId, notes } = this.state.conversation;
      return client.processMessage({
        conversationId,
        messages,
        notes,
        context: this.state.meta.context,
      });
    }
    return this.nextMessageHandler(
      async () => {
        let messageResponse: MessageResponse | undefined = undefined;
        let nextMessage: Message = {
          source: MessageSource.BOT,
          text: "",
        };
        const { messages, conversationId, notes } = this.state.conversation;
        const stream = await client.streamNextMessage({
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
            new ApiError(
              "Stream Error: Missing full message response at the end of stream."
            )
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
    let messageResponse: MessageResponse;
    try {
      messageResponse = await nextMessageFn();
    } catch (e) {
      this.setCanSendMessage(true);
      this.setChatLoadingStatus(false);
      return Promise.reject(e);
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

    //if response contains integrationDetails, swap to agentClient
    if (!!messageResponse.integrationDetails && this.agentClient) {
      console.log('3')
      this.chatClient = this.agentClient
      if (isChatEventClient(this.chatClient)) {
        try {
          await this.chatClient.init(messageResponse);
        } catch(e) {
          console.error("Error occured on request to AWS Connect:", e);
          //if init fails, revert back to botClient. Also inform the user that the handoff failed
          this.chatClient = this.botClient
          this.addMessage({
            text: "Sorry, I'm unable to connect you to an agent at the moment. Please try again later!",
            source: MessageSource.BOT,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
    return messageResponse;
  }
}
