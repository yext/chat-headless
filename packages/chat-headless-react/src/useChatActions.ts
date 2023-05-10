import { ChatHeadless } from "@yext/chat-headless";
import { useContext } from "react";
import { ChatHeadlessContext } from "./ChatHeadlessContext";

export type ChatActions = ChatHeadless;

/**
 * A React hook that returns a ChatHeadless instance with setter methods
 * to update state.
 *
 * @remarks
 * This hook must be used only within {@link ChatHeadlessProvider}.
 * Otherwise, it will throw an error.
 *
 * @public
 */
export function useChatActions(): ChatActions {
  const chatHeadless = useContext(ChatHeadlessContext);
  if (chatHeadless.state === undefined) {
    throw new Error(
      "Attempted to call useChatActions() outside of ChatHeadlessProvider." +
        " Please ensure that 'useChatActions()' is called within an ChatHeadlessProvider component."
    );
  }
  return chatHeadless;
}
