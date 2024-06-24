import {
  MessageRequest,
  MessageResponse,
  StreamResponse,
} from "@yext/chat-core";

/**
 * The client interface used to make requests to the Chat API.
 * @public
 */
export interface ChatHttpClient {
  /** Make a request to Chat API to generate the next message. */
  getNextMessage(request: MessageRequest): Promise<MessageResponse>;
  /**
   * Make a request to Chat streaming API to generate the next message and
   * consume its tokens via server-sent events.
   */
  streamNextMessage(request: MessageRequest): Promise<StreamResponse>;
}

export interface ChatEventClient {
  init(messageResponse: MessageResponse): Promise<void>;
  on(eventName: string, cb: EventListener): void;
  emit(eventName: string, data: any): void;
  processMessage(request: MessageRequest): Promise<undefined>;
  // processMessageStream(request: MessageRequest): Promise<void>;
  getSession(): any;
}

export function isChatEventClient(client: ChatClient): client is ChatEventClient {
  return (client as ChatEventClient).init !== undefined;
}

export type ChatClient = ChatHttpClient | ChatEventClient;