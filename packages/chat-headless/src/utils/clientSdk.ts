import { EventPayload } from "@yext/analytics";
import { version, dependencies } from "../../package.json";

const coreVersion = dependencies["@yext/chat-core"];

/**
 * Creates new mapping for clientSdk by merging data from param additionalClientSdk
 * with chat-headless's version and chat-core's version extracted from package.json
 *
 * @internal
 */
export function getClientSdk(
  additionalClientSdk?: EventPayload["clientSdk"]
): EventPayload["clientSdk"] {
  return {
    ...additionalClientSdk,
    CHAT_HEADLESS: version,
    CHAT_CORE: coreVersion,
  };
}
