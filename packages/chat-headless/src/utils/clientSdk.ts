import { ChatEventPayLoad } from "@yext/analytics";
import packageJson from "../../package.json";

const { version } = packageJson;
const coreVersion = packageJson.dependencies["@yext/chat-core"];

/**
 * Creates new mapping for clientSdk by merging data from param additionalClientSdk
 * with chat-headless's version and chat-core's version extracted from package.json
 *
 * @internal
 */
export function getClientSdk(
  additionalClientSdk?: ChatEventPayLoad["clientSdk"]
): ChatEventPayLoad["clientSdk"] {
  return {
    ...additionalClientSdk,
    CHAT_HEADLESS: version,
    CHAT_CORE: coreVersion,
  };
}
