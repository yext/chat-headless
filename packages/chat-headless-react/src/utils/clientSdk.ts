import { HeadlessConfig } from "@yext/chat-headless";
import packageJson from "../../package.json";
const { version } = packageJson;

/**
 * Appends chat-headless-react's package version to the
 * config's analytics "clientSdk" field.
 *
 * @internal
 */
export function updateClientSdk(config: HeadlessConfig): HeadlessConfig {
  return {
    ...config,
    analyticsConfig: {
      ...config.analyticsConfig,
      baseEventPayload: {
        ...config.analyticsConfig?.baseEventPayload,
        clientSdk: {
          ...config.analyticsConfig?.baseEventPayload?.clientSdk,
          CHAT_HEADLESS_REACT: version,
        },
      },
    },
  };
}
