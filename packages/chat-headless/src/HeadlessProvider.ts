import { InternalConfig, provideChatCoreInternal } from "@yext/chat-core";
import { ChatClient, ChatHeadless } from "./models";
import { ChatHeadlessImpl } from "./ChatHeadlessImpl";
import { HeadlessConfig } from "./models";

/**
 * Provide an instance of {@link ChatHeadless} with all functionality built in.
 *
 * @public
 */
export function provideChatHeadless(
  config: HeadlessConfig,
  clients?: { bot?: ChatClient, agent?: ChatClient },
): ChatHeadless {
  return new ChatHeadlessImpl(config, clients?.bot, clients?.agent);
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
