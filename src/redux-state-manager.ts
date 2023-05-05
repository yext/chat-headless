import { configureStore, combineReducers, EnhancedStore, Unsubscribe } from '@reduxjs/toolkit';

import chatStatusReducer from './slices/chatstatus';
import StateListener from './models/state-listener';
import StateManager from './models/state-manager';
import { State } from './models/state';

/**
 * A Redux-backed implementation of the {@link StateManager} interface. Redux is used to
 * manage the state, dispatch events, and register state listeners.
 */
export default class ReduxStateManager implements StateManager {
  private store: EnhancedStore;

  constructor() {
    const coreReducer = combineReducers({
      chatStatus: chatStatusReducer,
    });

    this.store = configureStore({
      middleware:
        (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
      reducer: (state, action) => {
        if (action.type === 'set-state') {
          return action.payload;
        } else {
          return coreReducer(state, action);
        }
      },
    });
  }

  getState(): State {
    return this.store.getState();
  }

  dispatchEvent(type: string, payload?: unknown): void {
    this.store.dispatch({ type, payload });
  }

  addListener<T>(listener: StateListener<T>): Unsubscribe {
    let previousValue = listener.valueAccessor(this.getState());
    return this.store.subscribe(() => {
      const currentValue: T = listener.valueAccessor(this.getState());
      if (currentValue !== previousValue) {
        listener.callback(currentValue);
        previousValue = currentValue;
      }
    });
  }
}