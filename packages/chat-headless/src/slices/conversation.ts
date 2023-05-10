import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConversationState } from "../models/slices/conversation";
import { Message, MessageNotes } from "@yext/chat-core";

export const initialState: ConversationState = {
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

export const { setMessages, setMessageNotes, setIsLoading } =
  conversationSlice.actions;
export default conversationSlice.reducer;
