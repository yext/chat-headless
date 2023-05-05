
import { ChatStatusState } from './slices/chatstatus';
import { ConversationState } from './slices/conversation';

/**
 * The state representing a ChatHeadless instance.
 *
 * @public
 */
export interface State {
  conversation: ConversationState,
  chatStatus: ChatStatusState
}