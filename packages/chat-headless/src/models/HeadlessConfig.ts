import { DeepPartial } from "@reduxjs/toolkit";
import { AnalyticsConfig, EventPayload } from "@yext/analytics";
import { ChatConfig } from "@yext/chat-core";

/**
 * The configuration for a SearchHeadless instance.
 *
 * @public
 */
export interface HeadlessConfig extends ChatConfig {
  /** Whether to save the instance's {@link ConversationState} to local storage. Defaults to true. */
  saveToLocalStorage?: boolean;
  /** Configurations for Chat analytics. */
  analyticsConfig?: Omit<AnalyticsConfig, "authorizationType" | "authorization" | "env" | "region"> & {
    /** Base payload to include for requests to the Analytics Events API. */
    baseEventPayload?: DeepPartial<EventPayload>;
  };
}
