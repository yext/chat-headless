import { MessageRequest, MessageResponse, StreamResponse } from "@yext/chat-core";
import { ChatClient } from "./ChatClient";

/**
 * An HTTP-based client for processing user messages and generating
 * corresponding responses via a chat service API.
 * 
 * @public
 */
export interface ChatHttpClient {
  /**
   * Make a request to generate the next message.
   * 
   * @param request - The message request to process.
   */
  getNextMessage(request: MessageRequest): Promise<MessageResponse>;
  
  /**
   * Make a request to generate the next message and stream its tokens via server-sent events.
   * 
   * @param request - The message request to process.
   */
  streamNextMessage(request: MessageRequest): Promise<StreamResponse>;
}

export function isChatHttpClient(client: ChatClient): client is ChatHttpClient {
  return (client as ChatHttpClient).getNextMessage !== undefined;
}