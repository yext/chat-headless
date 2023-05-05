import { ChatConfig, ChatCore, Message, MessageNotes, MessageResponse, MessageSource } from '@yext/chat-core';
import { State } from './models/state';

export class ChatHeadless {

  chatCore: ChatCore;
  stateManager: StateManager;

  constructor(config: ChatConfig) {
    this.chatCore = new ChatCore(config);
    this.stateManager = new StateManager();
  }

  /**
   * Gets the current state of the SearchHeadless instance.
   */
  get state(): State {
    return this.stateManager.getState();
  }

  setMessageNotes(notes: MessageNotes) {

  }

  setMessages(messages: Message[]) {

  }

  setChatLoadingStatus(isLoading: boolean) {

  }

  async getNextMessage(text: string, source: MessageSource = MessageSource.USER): Promise<MessageResponse> {
    this.setChatLoadingStatus(true);
    const messages: Message[] = [...this.state.conversation.messages, {
      timestamp: Date.now(),
      source,
      text
    }];
    this.setMessages(messages);
    const nextMessage = await this.chatCore.getNextMessage({
      messages,
      notes: this.state.conversation.notes
    });
    this.setChatLoadingStatus(false);
    this.setMessages([...messages, nextMessage.message]);
    this.setMessageNotes(nextMessage.notes);
    return nextMessage;
  }
}