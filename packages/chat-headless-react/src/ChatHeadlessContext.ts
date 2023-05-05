import { createContext } from 'react';
import { ChatHeadless } from '@yext/chat-headless';

export const SearchHeadlessContext = createContext<ChatHeadless>({} as ChatHeadless);