import {
  Message,
  MessageNotes,
  MessageResponse,
  MessageSource,
} from "@yext/chat-core";
import { State } from "./state";
import { DeepPartial, Store, Unsubscribe } from "@reduxjs/toolkit";
import { StateListener } from "./utils/StateListeners";
import { ChatEventPayLoad } from "@yext/analytics";

/**
 * Provides the functionality needed to interact with the Chat API in a
 * stateful manner.
 *
 * @public
 */
export interface ChatHeadless {
  // --------- STATE MANAGEMENT --------
  /**
   * Gets the current state of the ChatHeadless instance.
   *
   * @public
   */
  get state(): State;
  /**
   * Sets the {@link State} to the specified state.
   *
   * @public
   *
   * @param state - The state to set
   */
  setState(state: State): void;
  /**
   * Gets the store that holds the application's state tree.
   *
   * @remarks
   * This is intended for internal usage in the binding packages only.
   *
   * @internal
   */
  get store(): Store;
  /**
   * Sets {@link MetaState.context} to the specified context.
   *
   * @public
   *
   * @param context - The context to set
   */
  setContext(context: unknown): void;
  /**
   * Sets {@link ConversationState.messages} to the specified messages
   *
   * @public
   *
   * @param messages - the messages to set
   */
  setMessages(messages: Message[]): void;
  /**
   * Adds a new message to {@link ConversationState.messages}
   *
   * @public
   *
   * @param message - the message to add to state
   */
  addMessage(message: Message): void;
  /**
   * Sets {@link ConversationState.notes} to the specified notes
   *
   * @public
   *
   * @param notes - the notes to set
   */
  setMessageNotes(notes: MessageNotes): void;
  /**
   * Sets {@link ConversationState.isLoading} to the specified loading state
   *
   * @public
   *
   * @param isLoading - the loading state to set
   */
  setChatLoadingStatus(isLoading: boolean): void;
  /**
   * Sets {@link ConversationState.canSendMessage} to the specified state
   *
   * @public
   *
   * @param canSendMessage - the state to set
   */
  setCanSendMessage(canSendMessage: boolean): void;
  /**
   * Adds additional client SDKs to the base event payload for Yext Analytics API.
   *
   * @remarks
   * This is intended for internal usage in the Yext Chat related packages only.
   *
   * @internal
   */
  addClientSdk(additionalClientSdk: Record<string, string>): void;
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
  initSessionStorage(): void;
  /**
   * Resets all fields within {@link ConversationState}
   *
   * @public
   */
  restartConversation(): void;
  // --------- MESSAGE SENDING --------
  /**
   * Send Chat related analytics event to Yext Analytics API.
   *
   * @remarks
   * once a CHAT_IMPRESSION analytics event is reported, subsequent
   * CHAT_IMPRESSION reports will not be send.
   *
   * @public
   */
  report(
    eventPayload: Omit<ChatEventPayLoad, "chat"> &
      DeepPartial<Pick<ChatEventPayLoad, "chat">>
  ): Promise<void>;
  /**
   * Performs a Chat API request for the next message generated by chat bot
   * using the conversation state (e.g. message history and notes). Update
   * the state with the response data.
   *
   * @public
   *
   * @remarks
   * If rejected, an ApiError is returned.
   * A new message is added to the conversation history only if the provided text is not empty.
   *
   * @param text - the text of the next message
   * @param source - the source of the message
   * @returns a Promise of a response from the Chat API
   */
  getNextMessage(
    text?: string,
    source?: MessageSource
  ): Promise<MessageResponse | undefined>;
  /**
   * Adds a listener for a specific state value of type T.
   *
   * @public
   *
   * @param listener - The state listener to add
   * @returns The function for removing the added listener
   */
  addListener<T>(listener: StateListener<T>): Unsubscribe;
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
   * If rejected, an ApiError is returned.
   * A new message is added to the conversation history only if the provided text is not empty.
   *
   * @param text - the text of the next message
   * @param source - the source of the message
   * @returns a Promise of the full response from the Chat Stream API
   */
  streamNextMessage(
    text?: string,
    source?: MessageSource
  ): Promise<MessageResponse | undefined>;
}
