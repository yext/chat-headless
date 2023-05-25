import { ConversationState } from "./slices/ConversationState";
import { MetaState } from "./slices/MetaState";

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
