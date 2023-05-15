## API Report File for "@yext/chat-headless"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ChatConfig } from '@yext/chat-core';
import { Message } from '@yext/chat-core';
import { MessageNotes } from '@yext/chat-core';
import { MessageRequest } from '@yext/chat-core';
import { MessageResponse } from '@yext/chat-core';
import { MessageSource } from '@yext/chat-core';
import { Store } from '@reduxjs/toolkit';
import { Unsubscribe } from '@reduxjs/toolkit';

export { ChatConfig }

// @public
export class ChatHeadless {
    constructor(config: ChatConfig);
    addListener<T>(listener: StateListener<T>): Unsubscribe;
    getNextMessage(text?: string, source?: MessageSource): Promise<MessageResponse>;
    restartConversation(): void;
    setChatLoadingStatus(isLoading: boolean): void;
    setMessageNotes(notes: MessageNotes): void;
    setMessages(messages: Message[]): void;
    setState(state: State): void;
    get state(): State;
    // @internal
    get store(): Store;
}

// @public
export interface ConversationState {
    conversationId?: string;
    isLoading?: boolean;
    messages: Message[];
    notes?: MessageNotes;
}

export { Message }

export { MessageNotes }

export { MessageRequest }

export { MessageResponse }

export { MessageSource }

// @public
export interface State {
    conversation: ConversationState;
}

// @public
export interface StateListener<T> {
    callback(currentValue: T): any;
    valueAccessor(state: State): T;
}

// (No @packageDocumentation comment for this package)

```