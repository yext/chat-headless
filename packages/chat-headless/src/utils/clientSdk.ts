import { ChatEventPayLoad } from "@yext/analytics";
import packageJson from "../../package.json";

const { version } = packageJson;
const coreVersion = packageJson.dependencies["@yext/chat-core"];

export function getClientSdk(
  additionalClientSdk?: ChatEventPayLoad["clientSdk"]
): ChatEventPayLoad["clientSdk"] {
  return {
    ...additionalClientSdk,
    CHAT_HEADLESS: version,
    CHAT_CORE: coreVersion,
  };
}
