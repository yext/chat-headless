import { Message, MessageNotes } from "@yext/chat-core";

/**
 * Maintains the data for the current conversation.
 *
 * @public
 */
export interface ConversationState {
  /** The id of the current conversation. */
  conversationId?: string;
  /** The messages in a conversation. */
  messages: Message[];
  /** Information relevant to the current state of the conversation, generated and provided by Chat API. */
  notes?: MessageNotes;
  /** Whether the next message is currently processing or has finished processing. */
  isLoading?: boolean;
}
