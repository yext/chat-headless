import { ChatEventClient } from "./ChatEventClient";
import { ChatHttpClient } from "./ChatHttpClient";

/**
 * A client that can be used to process user messages and provide responses.
 * 
 * @public
 */
export type ChatClient = ChatHttpClient | ChatEventClient;
