## API Report File for "@yext/chat-headless"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { AnalyticsConfig } from '@yext/analytics';
import { ApiError } from '@yext/chat-core';
import { ChatConfig } from '@yext/chat-core';
import { ChatPrompt } from '@yext/chat-core';
import { DeepPartial } from '@reduxjs/toolkit';
import { EndEvent } from '@yext/chat-core';
import { Endpoints } from '@yext/chat-core';
import { Environment } from '@yext/chat-core';
import { EventPayload } from '@yext/analytics';
import { InternalConfig } from '@yext/chat-core';
import { Message } from '@yext/chat-core';
import { MessageNotes } from '@yext/chat-core';
import { MessageRequest } from '@yext/chat-core';
import { MessageResponse } from '@yext/chat-core';
import { MessageSource } from '@yext/chat-core';
import { RawResponse } from '@yext/chat-core';
import { Region } from '@yext/chat-core';
import { StartEvent } from '@yext/chat-core';
import { Store } from '@reduxjs/toolkit';
import { StreamEvent } from '@yext/chat-core';
import { StreamEventCallback } from '@yext/chat-core';
import { StreamEventName } from '@yext/chat-core';
import { StreamResponse } from '@yext/chat-core';
import { TokenStreamEvent } from '@yext/chat-core';
import { Unsubscribe } from '@reduxjs/toolkit';

export { ApiError }

// @public
export type ChatClient = ChatHttpClient | ChatEventClient;

export { ChatConfig }

// @public
export interface ChatEventClient {
    emit(eventName: string, data: any): void;
    getSession(): any;
    init(messageResponse: MessageResponse): Promise<any>;
    on(eventName: "message" | "typing" | "close", cb: (data: any) => void): void;
    processMessage(request: MessageRequest): Promise<void>;
    reinitializeSession(credentials: any): Promise<void>;
    resetSession(): void;
}

// @public
export interface ChatHeadless {
    // @internal
    addClientSdk(additionalClientSdk: Record<string, string>): void;
    addListener<T>(listener: StateListener<T>): Unsubscribe;
    addMessage(message: Message): void;
    getNextMessage(text?: string, source?: MessageSource): Promise<MessageResponse | undefined>;
    initLocalStorage(): void;
    // Warning: (ae-forgotten-export) The symbol "RecursivePartial" needs to be exported by the entry point index.d.ts
    report(eventPayload: Omit<EventPayload, "chat"> & RecursivePartial<Pick<EventPayload, "chat">>): Promise<void>;
    restartConversation(): void;
    setCanSendMessage(canSendMessage: boolean): void;
    setChatLoadingStatus(isLoading: boolean): void;
    setContext(context: unknown): void;
    setMessageNotes(notes: MessageNotes): void;
    setMessages(messages: Message[]): void;
    setState(state: State): void;
    get state(): State;
    // @internal
    get store(): Store;
    streamNextMessage(text?: string, source?: MessageSource): Promise<MessageResponse | undefined>;
}

// @public
export interface ChatHttpClient {
    getNextMessage(request: MessageRequest): Promise<MessageResponse>;
    streamNextMessage(request: MessageRequest): Promise<StreamResponse>;
}

export { ChatPrompt }

// @public
export interface ConversationState {
    canSendMessage: boolean;
    conversationId?: string;
    isLoading: boolean;
    messages: Message[];
    notes?: MessageNotes;
}

export { EndEvent }

export { Endpoints }

export { Environment }

// @public
export interface HeadlessConfig extends ChatConfig {
    analyticsConfig?: Omit<AnalyticsConfig, "authorizationType" | "authorization" | "env" | "region"> & {
        baseEventPayload?: DeepPartial<EventPayload>;
    };
    saveToLocalStorage?: boolean;
}

export { InternalConfig }

export { Message }

export { MessageNotes }

export { MessageRequest }

export { MessageResponse }

export { MessageSource }

// @public
export interface MetaState {
    context?: any;
}

// @public
export function provideChatHeadless(config: HeadlessConfig, clients?: {
    bot?: ChatClient;
    agent?: ChatClient;
}): ChatHeadless;

// Warning: (ae-internal-missing-underscore) The name "provideChatHeadlessInternal" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal
export function provideChatHeadlessInternal(config: HeadlessConfig, internalConfig: InternalConfig): ChatHeadless;

export { RawResponse }

export { Region }

export { StartEvent }

// @public
export interface State {
    conversation: ConversationState;
    meta: MetaState;
}

// @public
export interface StateListener<T> {
    callback(currentValue: T): any;
    valueAccessor(state: State): T;
}

export { StreamEvent }

export { StreamEventCallback }

export { StreamEventName }

export { StreamResponse }

export { TokenStreamEvent }

// (No @packageDocumentation comment for this package)

```
