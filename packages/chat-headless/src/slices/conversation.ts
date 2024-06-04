import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationState } from "../models/slices/ConversationState";
import { Message, MessageNotes } from "@yext/chat-core";

const BASE_STATE_LOCAL_STORAGE_KEY = "yext_chat_state";

export const initialState: ConversationState = {
  messages: [],
  isLoading: false,
  canSendMessage: true,
};

export function getStateLocalStorageKey(
  hostname: string,
  botId: string
): string {
  return `${BASE_STATE_LOCAL_STORAGE_KEY}__${hostname}__${botId}`;
}

/**
 * Loads the {@link ConversationState} from local storage.
 */
export const loadSessionState = (botId: string): ConversationState => {
  if (!localStorage) {
    console.warn(
      "Local storage is not available. State will not be persisted while navigating across pages."
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
  const savedState = localStorage.getItem(
    getStateLocalStorageKey(hostname, botId)
  );

  if (savedState) {
    const parsedState: ConversationState = JSON.parse(savedState);
    if (parsedState.messages.length > 0) {
      const lastTimestamp =
        parsedState.messages[parsedState.messages.length - 1].timestamp;
      const currentDate = new Date();
      const lastDate = new Date(lastTimestamp || 0);
      const diff = currentDate.getTime() - lastDate.getTime();
      // If the last message was sent within the last day, we consider the session to be active
      if (diff < 24 * 60 * 60 * 1000) {
        return parsedState;
      }
      localStorage.removeItem(getStateLocalStorageKey(hostname, botId));
    }
  }

  return initialState;
};

export const saveSessionState = (botId: string, state: ConversationState) => {
  if (!localStorage) {
    console.warn(
      "Local storage is not available. State will not be persisted while navigating across pages."
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
  localStorage.setItem(
    getStateLocalStorageKey(hostname, botId),
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
