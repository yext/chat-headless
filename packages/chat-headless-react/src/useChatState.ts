import { State } from "@yext/chat-headless";
import { useContext } from "react";
import { useSelector } from "react-redux";
import { ChatHeadlessContext } from "./ChatHeadlessContext";

/**
 * Map function to specify what part of the Chat state to use
 * 
 * @public
 */
export type StateSelector<T> = (s: State) => T;

/**
 * A React hook that returns a Chat state in store as specified by the map function.
 * 
 * @remarks
 * This hook must be used only within {@link ChatHeadlessProvider}.
 * Otherwise, it will throw an error.
 * 
 * @public
 */
export function useChatState<T>(stateSelector: StateSelector<T>): T {
  const chatHeadless = useContext(ChatHeadlessContext);
  if (chatHeadless.state === undefined) {
    throw new Error('Attempted to call useChatState() outside of ChatHeadlessProvider.'
     + ' Please ensure that \'useChatState()\' is called within an ChatHeadlessProvider component.');
  }
  return useSelector(stateSelector)
}