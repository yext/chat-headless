import { ChatConfig } from "@yext/chat-core";

/**
 * The configuration for a SearchHeadless instance.
 *
 * @public
 */
export interface HeadlessConfig extends ChatConfig {
  /** Whether to save the instance's {@link ConversationState} to session storage. Defaults to true. */
  saveToSessionStorage?: boolean;
}
