/* eslint-disable @typescript-eslint/no-explicit-any */

import { MessageRequest, MessageResponse } from "@yext/chat-core";
import { ChatClient } from "./ChatClient";

/**
 * An event-driven client for processing user message and provide responses
 * by emitting and listening to events.
 * 
 * @public
 */
export interface ChatEventClient {
  /**
   * Initializes the client, using credentials and data in the provided message to setup a chat session.
   * 
   * @param messageResponse - The message response that initiated the handoff to the chat client.
   */
  init(messageResponse: MessageResponse): Promise<void>;
  
  /**
   * Registers an event listener for a specified event.
   * Supported events are:
   * - `message`: A new message has been received.
   * - `typing`: The agent is typing.
   * - `close`: The chat session has been closed.
   * 
   * @param eventName - The name of the event to listen to.
   * @param cb - The callback function to be executed when the event is triggered.
   */
  on(eventName: string, cb: (data: any) => void): void;
  
  /**
   * Emits an event with the specified name and data, triggering all registered listeners for that event.
   * 
   * @param eventName - The name of the event to emit.
   * @param data  - The data to be passed to the event listeners.
   */
  emit(eventName: string, data: any): void;
  
  /**
   * Processes a message request. The response should be emitted as a message event.
   * 
   * @param request - The message request to process.
   */
  processMessage(request: MessageRequest): Promise<void>;

  /**
   * Provide the current chat session.
   */
  getSession(): any;
}

export function isChatEventClient(client: ChatClient): client is ChatEventClient {
  return (client as ChatEventClient).init !== undefined;
}