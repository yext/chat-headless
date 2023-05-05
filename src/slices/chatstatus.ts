import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatStatusState } from '../models/slices/chatstatus';

export const initialState: ChatStatusState = {};

/**
 * Registers with Redux the slice of {@link State} pertaining to the loading status
 * of Chat Headless.
 */
export const chatStatusSlice = createSlice({
  name: 'chatStatus',
  initialState,
  reducers: {
    setIsLoading: (state: ChatStatusState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { setIsLoading } = chatStatusSlice.actions;
export default chatStatusSlice.reducer;