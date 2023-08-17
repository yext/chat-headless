import { InternalConfig, provideChatCoreInternal } from "@yext/chat-core";
import { ChatHeadless, ChatHeadlessImpl } from "./ChatHeadless";
import { HeadlessConfig } from "./models";

/**
 * Provide an instance of {@link ChatHeadless} with all functionality built in.
 *
 * @public
 */
export function provideChatHeadless(config: HeadlessConfig): ChatHeadless {
  return new ChatHeadlessImpl(config);
}

/**
 * Provide an instance of {@link ChatHeadless} with all functionality built in,
 * including internal-only configuration.
 *
 * @internal
 */
export function provideChatHeadlessInternal(
  config: HeadlessConfig,
  internalConfig: InternalConfig
): ChatHeadless {
  const internalCore = provideChatCoreInternal(config, internalConfig);
  return new ChatHeadlessImpl(config, internalCore);
}
