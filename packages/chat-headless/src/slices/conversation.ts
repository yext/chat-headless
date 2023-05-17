import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationState } from "../models/slices/conversation";
import { Message, MessageNotes } from "@yext/chat-core";

export const STATE_SESSION_STORAGE_KEY : string = "conversationState";
export const initialState: ConversationState =
    sessionStorage.getItem(STATE_SESSION_STORAGE_KEY)
    ? JSON.parse(sessionStorage.getItem(STATE_SESSION_STORAGE_KEY)!)
    : {
  messages: [],
  isLoading: false,
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
  },
});

export const { setMessages, setMessageNotes, setIsLoading, setConversationId } =
  conversationSlice.actions;
export default conversationSlice.reducer;
