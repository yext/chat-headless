import {
  provideChatCore,
  Message,
  MessageNotes,
  MessageResponse,
  MessageSource,
  StreamEventName,
  ApiError,
  IntegrationDetails,
} from "@yext/chat-core";
import {
  ChatClient,
  ChatHeadless,
  HeadlessConfig,
  State,
  StateListener,
} from "./models";
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
import { setContext } from "./slices/meta";
import {
  provideChatAnalytics,
  ChatAnalyticsService,
  ChatEventPayLoad,
} from "@yext/analytics";
import { getClientSdk } from "./utils/clientSdk";
import { isChatEventClient } from "./models/clients/ChatEventClient";

/**
 * Concrete implementation of {@link ChatHeadless}
 *
 * @internal
 */
export class ChatHeadlessImpl implements ChatHeadless {
  private config: HeadlessConfig;
  private chatClient: ChatClient;
  private clients: ChatClient[];
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
  constructor(
    config: HeadlessConfig,
    botClient?: ChatClient,
    agentClient?: ChatClient
  ) {
    const defaultConfig: Partial<HeadlessConfig> = {
      saveToLocalStorage: true,
    };
    this.config = { ...defaultConfig, ...config };

    // bot client is the default client.
    // If agent client is provided, it will be used as the second client on handoff
    this.chatClient = botClient ?? provideChatCore(this.config);
    this.clients = [this.chatClient];
    if (agentClient) {
      this.clients.push(agentClient);
    }
    this.setClientEventListeners();

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

  /**
   * Sets up event listeners to update state for event-driven clients.
   */
  private setClientEventListeners() {
    this.clients.forEach((client) => {
      if (!client || !isChatEventClient(client)) {
        return;
      }

      client.on("message", (data: string) => {
        this.addMessage({
          source: MessageSource.BOT,
          text: data,
          timestamp: new Date().toISOString(),
        });
      });

      client.on("typing", (data: boolean) => {
        this.setChatLoadingStatus(data);
      });

      client.on("close", async (_data: unknown) => {
        this.handoff();
      });
    });
  }

  /**
   * Switches the current chat client with the next client, if available.
   */
  private async handoff(integrationDetails?: IntegrationDetails) {
    let nextClient: ChatClient | undefined = undefined;
    for (const client of this.clients) {
      if (this.chatClient !== client) {
        nextClient = client;
      }
    }
    if (!nextClient) {
      console.warn("No next client available for handoff.");
      return;
    }

    if (isChatEventClient(nextClient)) {
      try {
        await nextClient.init({
          conversationId: this.state.conversation.conversationId,
          message: this.state.conversation.messages.at(-1) || {
            source: MessageSource.BOT,
            text: "",
          },
          notes: this.state.conversation.notes || {},
          integrationDetails,
        });
      } catch (e) {
        console.error("Error occurred while initializing next client:", e);
        return;
      }
    }
    this.chatClient = nextClient;
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
      const { conversationId, notes } = this.state.conversation;
      if (text && text.length > 0) {
        this.addMessage({
          timestamp: new Date().toISOString(),
          source,
          text,
        });
      }
      client.processMessage({
        conversationId,
        notes,
        messages: this.state.conversation.messages,
        context: this.state.meta.context,
      });
      return;
    }
    return this.nextMessageHandler(
      async () => {
        const { messages, conversationId, notes } = this.state.conversation;
        const nextMessage = await client.getNextMessage({
          conversationId,
          messages,
          notes,
          context: this.state.meta.context,
        });
        this.setConversationId(nextMessage.conversationId);
        this.addMessage(nextMessage.message);
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
      throw new Error("streamNextMessage is not supported by this client.");
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
   * @remarks
   * If the response contains integration details, it will trigger a handoff to the next client.
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
    if (!!messageResponse.integrationDetails) {
      this.handoff(messageResponse.integrationDetails);
    }
    return messageResponse;
  }
}
