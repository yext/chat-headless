import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationState } from "../models/slices/ConversationState";
import { Message, MessageNotes } from "@yext/chat-core";

const BASE_STATE_SESSION_STORAGE_KEY = "yext_chat_state";

export const initialState: ConversationState = {
  messages: [],
  isLoading: false,
  canSendMessage: true,
};

export function getStateSessionStorageKey(
  hostname: string,
  botId: string
): string {
  return `${BASE_STATE_SESSION_STORAGE_KEY}__${hostname}__${botId}`;
}

/**
 * Loads the {@link ConversationState} from session storage.
 */
export const loadSessionState = (botId: string): ConversationState => {
  if (!sessionStorage) {
    console.warn(
      "Session storage is not available. State will not be persisted across page refreshes."
    );
    return initialState;
  }
  const hostname = window?.location?.hostname;
  if (!hostname) {
    console.warn(
      "Unable to get hostname of current page. State will not be persisted across page refreshes."
    );
    return initialState;
  }
  const savedState = sessionStorage.getItem(
    getStateSessionStorageKey(hostname, botId)
  );
  return savedState ? JSON.parse(savedState) : initialState;
};

export const saveSessionState = (botId: string, state: ConversationState) => {
  if (!sessionStorage) {
    console.warn(
      "Session storage is not available. State will not be persisted across page refreshes."
    );
    return initialState;
  }
  const hostname = window?.location?.hostname;
  if (!hostname) {
    console.warn(
      "Unable to get hostname of current page. State will not be persisted across page refreshes."
    );
    return initialState;
  }
  sessionStorage.setItem(
    getStateSessionStorageKey(hostname, botId),
    JSON.stringify(state)
  );
};

/**
 * Registers with Redux the slice of {@link State} pertaining to the loading status
 * of Chat Headless.
 */
export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setConversationId: (
      state: ConversationState,
      action: PayloadAction<string | undefined>
    ) => {
      state.conversationId = action.payload;
    },
    setMessages: (
      state: ConversationState,
      action: PayloadAction<Message[]>
    ) => {
      state.messages = action.payload;
    },
    addMessage: (state: ConversationState, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setMessageNotes: (
      state: ConversationState,
      action: PayloadAction<MessageNotes>
    ) => {
      state.notes = action.payload;
    },
    setIsLoading: (
      state: ConversationState,
      action: PayloadAction<boolean>
    ) => {
      state.isLoading = action.payload;
    },
    setCanSendMessage: (
      state: ConversationState,
      action: PayloadAction<boolean>
    ) => {
      state.canSendMessage = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setMessageNotes,
  setIsLoading,
  setConversationId,
  setCanSendMessage,
} = conversationSlice.actions;
export default conversationSlice.reducer;
