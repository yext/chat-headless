import {
  MessageRequest,
  MessageResponse,
  StreamResponse,
} from "@yext/chat-core";

/**
 * The client interface used to make requests to the Chat API.
 * @public
 */
export interface ChatClient {
  /** Make a request to Chat API to generate the next message. */
  getNextMessage(request: MessageRequest): Promise<MessageResponse>;
  /**
   * Make a request to Chat streaming API to generate the next message and
   * consume its tokens via server-sent events.
   */
  streamNextMessage(request: MessageRequest): Promise<StreamResponse>;
}
