import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MetaState } from "../models/slices/meta";

export const initialState: MetaState = {};

/**
 * Registers with Redux the slice of {@link State} pertaining to
 * meta attributes of Chat Headless.
 */
export const metaSlice = createSlice({
  name: "meta",
  initialState,
  reducers: {
    setContext: (
      state: MetaState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: PayloadAction<any | undefined>
    ) => {
      state.context = action.payload;
    },
  },
});

export const { setContext } = metaSlice.actions;
export default metaSlice.reducer;
