import { ConversationState } from "./slices/conversation";
import { MetaState } from "./slices/meta";

/**
 * The state representing a ChatHeadless instance.
 *
 * @public
 */
export interface State {
  /** {@inheritdoc ConversationState} */
  conversation: ConversationState;
  /** {@inheritdoc MetaState} */
  meta: MetaState;
}
