import { InternalConfig, provideChatCoreInternal } from "@yext/chat-core";
import { ChatHeadless } from "./models";
import { ChatHeadlessImpl } from "./ChatHeadlessImpl";
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
