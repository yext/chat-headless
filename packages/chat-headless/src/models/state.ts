
import { ChatStatusState } from './slices/chatstatus';
import { ConversationState } from './slices/conversation';

/**
 * The state representing a ChatHeadless instance.
 *
 * @public
 */
export interface State {
  /** {@inheritdoc ConversationState} */
  conversation: ConversationState,
    /** {@inheritdoc ChatStatusState} */
  chatStatus: ChatStatusState
}