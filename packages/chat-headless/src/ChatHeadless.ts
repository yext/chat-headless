import {
  ChatConfig,
  ChatCore,
  Message,
  MessageNotes,
  MessageResponse,
  MessageSource,
} from "@yext/chat-core";
import { State } from "./models/state";
import { ReduxStateManager } from "./ReduxStateManager";
import {
  setConversationId,
  setIsLoading,
  setMessageNotes,
  setMessages,
} from "./slices/conversation";
import { Store, Unsubscribe } from "@reduxjs/toolkit";
import { StateListener } from "./models";
import { setContext } from "./slices/meta";

/**
 * Provides the functionality for interacting with a Chat Bot
 * and the relevant application state.
 *
 * @public
 */
export class ChatHeadless {
  private chatCore: ChatCore;
  private stateManager: ReduxStateManager;

  constructor(config: ChatConfig) {
    this.chatCore = new ChatCore(config);
    this.stateManager = new ReduxStateManager();
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
   * Resets all fields within {@link ConversationState}
   *
   * @public
   */
  restartConversation() {
    this.setConversationId(undefined);
    this.setChatLoadingStatus(false);
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
  ): Promise<MessageResponse> {
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
    let nextMessage: MessageResponse;
    try {
      nextMessage = await this.chatCore.getNextMessage({
        conversationId: this.state.conversation.conversationId,
        messages,
        notes: this.state.conversation.notes,
        context: this.state.meta.context,
      });
    } catch (e) {
      this.setChatLoadingStatus(false);
      return Promise.reject(e as Error);
    }
    this.setConversationId(nextMessage.conversationId);
    this.setChatLoadingStatus(false);
    this.setMessages([...messages, nextMessage.message]);
    this.setMessageNotes(nextMessage.notes);
    return nextMessage;
  }
}
