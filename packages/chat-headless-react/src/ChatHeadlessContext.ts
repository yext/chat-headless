import { createContext } from 'react';
import { ChatHeadless } from '@yext/chat-headless';

/**
 * Persists a global ChatHeadless instance for React components under ChatHeadlessProvider.
 * 
 * @remarks
 * The default value is empty and will be set by ChatHeadlessProvider.
 * 
 * @public 
 */
export const ChatHeadlessContext = createContext<ChatHeadless>({} as ChatHeadless);