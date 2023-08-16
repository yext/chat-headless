import { ChatHeadless, ChatHeadlessImpl } from "./ChatHeadless";
import { HeadlessConfig, ChatClient } from "./models";

/**
 * Provide an instance of {@link ChatHeadless} with all functionality built in.
 *
 * @public
 */
export function provideChatHeadless(
  config: HeadlessConfig,
  chatClient?: ChatClient
): ChatHeadless {
  return new ChatHeadlessImpl(config, chatClient);
}
