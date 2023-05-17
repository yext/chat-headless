import {
  configureStore,
  combineReducers,
  EnhancedStore,
  Unsubscribe,
  Action,
} from "@reduxjs/toolkit";
import conversationReducer from "./slices/conversation";
import metaReducer from "./slices/meta";
import { State } from "./models/state";
import { StateListener } from "./models/utils/StateListeners";

/**
 * A Redux-backed implementation of the {@link StateManager} interface. Redux is used to
 * manage the state, dispatch events, and register state listeners.
 *
 * @internal
 */
export class ReduxStateManager {
  private store: EnhancedStore;

  constructor() {
    const coreReducer = combineReducers({
      conversation: conversationReducer,
      meta: metaReducer,
    });
    this.store = configureStore({
      reducer: (state, action) => {
        return action.type === "set-state"
          ? action.payload
          : coreReducer(state, action);
      },
    });
  }

  /**
   * Returns the current state.
   */
  getState(): State {
    return this.store.getState();
  }

  /**
   * Returns the Redux store.
   */
  getStore(): EnhancedStore {
    return this.store;
  }

  /**
   * Dispatches an event. This can update the {@link State}.
   *
   * @param action - represents an intention to change the state.
   * This includes "type" field for the action type and "payload" field for the data to dispatch
   */
  dispatch<T extends Action>(action: T): void {
    this.store.dispatch(action);
  }

  /**
   * Adds a listener for a specific state value of type T.
   *
   * @param listener - The state listener to add
   * @returns The function for removing the added listener
   */
  addListener<T>(listener: StateListener<T>): Unsubscribe {
    let previousValue = listener.valueAccessor(this.getState());
    return this.store.subscribe(() => {
      const currentValue: T = listener.valueAccessor(this.getState());
      if (currentValue !== previousValue) {
        previousValue = currentValue;
        listener.callback(currentValue);
      }
    });
  }
}
