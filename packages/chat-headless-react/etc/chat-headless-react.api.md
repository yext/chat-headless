## API Report File for "@yext/chat-headless-react"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="react" />

import { ChatHeadless } from '@yext/chat-headless';
import { Context } from 'react';
import { HeadlessConfig } from '@yext/chat-headless';
import { PropsWithChildren } from 'react';
import { State } from '@yext/chat-headless';

// @public
export const ChatHeadlessContext: Context<ChatHeadless>;

// @public
export function ChatHeadlessProvider(props: ChatHeadlessProviderProps): JSX.Element;

// @public
export type ChatHeadlessProviderProps = PropsWithChildren<{
    config: HeadlessConfig;
}>;

// @public
export type StateSelector<T> = (s: State) => T;

// @public
export function useChatActions(): ChatHeadless;

// @public
export function useChatState<T>(stateSelector: StateSelector<T>): T;


export * from "@yext/chat-headless";

// (No @packageDocumentation comment for this package)

```
