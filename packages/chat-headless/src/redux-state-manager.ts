import { configureStore, combineReducers, EnhancedStore, Unsubscribe, Action } from '@reduxjs/toolkit';

import chatStatusReducer from './slices/chatstatus';
// import StateListener from './models/state-listener';
// import StateManager from './models/state-manager';
import { State } from './models/state';

/**
 * A Redux-backed implementation of the {@link StateManager} interface. Redux is used to
 * manage the state, dispatch events, and register state listeners.
 */
export default class ReduxStateManager { //implements StateManager {
  private store: EnhancedStore;

  constructor() {
    const coreReducer = combineReducers({
      chatStatus: chatStatusReducer,
    });

    this.store = configureStore({
      reducer: coreReducer,
    });
  }

  getState(): State {
    return this.store.getState();
  }

  dispatch(action: Action): void {
    this.store.dispatch(action);
  }
}