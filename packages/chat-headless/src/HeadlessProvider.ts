import { InternalConfig, provideChatCoreInternal } from "@yext/chat-core";
import { ChatHeadless } from "./models";
import { ChatHeadlessImpl } from "./ChatHeadlessImpl";
import { HeadlessConfig } from "./models";
import { ChatCoreAwsConnect } from "./agentcore";


/**
 * Provide an instance of {@link ChatHeadless} with all functionality built in.
 *
 * @public
 */
export function provideChatHeadless(config: HeadlessConfig): ChatHeadless {
  console.log('test headless 2')
  // const _integrationConfig: IntegrationConfig = {
  //   responders: {
  //     // bot: {
  //     //   handler: provideChatCore(config),
  //     //   nextResponder: 'agent',
  //     // },
  //     agent: {
  //       handler: new ChatCoreAwsConnect(),
  //       nextResponder: 'bot',
  //     }
  //   }
  // }
  return new ChatHeadlessImpl(config, undefined, new ChatCoreAwsConnect());
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
