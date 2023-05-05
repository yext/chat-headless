import { ChatConfig, ChatCore, Message, MessageNotes, MessageResponse, MessageSource } from '@yext/chat-core';
import { State } from './models/state';
import ReduxStateManager from './redux-state-manager';
import { setIsLoading } from './slices/chatstatus';
import { setMessageNotes, setMessages } from './slices/conversation';

export class ChatHeadless {

  chatCore: ChatCore;
  stateManager: ReduxStateManager;

  constructor(config: ChatConfig) {
    this.chatCore = new ChatCore(config);
    this.stateManager = new ReduxStateManager();
  }

  /**
   * Gets the current state of the SearchHeadless instance.
   */
  get state(): State {
    return this.stateManager.getState();
  }

  setMessageNotes(notes: MessageNotes) {
    this.stateManager.dispatch(setMessageNotes(notes));
  }

  setMessages(messages: Message[]) {
    this.stateManager.dispatch(setMessages(messages));
  }

  setChatLoadingStatus(isLoading: boolean) {
    this.stateManager.dispatch(setIsLoading(isLoading));
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