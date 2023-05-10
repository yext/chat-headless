import { Message, MessageNotes } from "@yext/chat-core";

/**
 * Maintains the data for the current conversation.
 *
 * @public
 */
export interface ConversationState {
  /** {@inheritdoc Message} */
  messages: Message[];
  /** {@inheritdoc MessageNotes} */
  notes?: MessageNotes;
  /** Whether the next message is currently processing or has finished processing. */
  isLoading?: boolean;
}
