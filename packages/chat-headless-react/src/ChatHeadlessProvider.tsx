import { ChatHeadless, HeadlessConfig } from "@yext/chat-headless";
import { PropsWithChildren, useMemo } from "react";
import { Provider } from "react-redux";
import { ChatHeadlessContext } from "./ChatHeadlessContext";
import { updateClientSdk } from "./utils/clientSdk";

/**
 * Props for {@link ChatHeadlessProvider}
 *
 * @public
 */
export type ChatHeadlessProviderProps = PropsWithChildren<{
  config: HeadlessConfig;
}>;

/**
 * Instantiates a ChatHeadless instance for {@link ChatHeadlessContext} and provide
 * the context for all children components.
 *
 * @param props - {@link ChatHeadlessProviderProps}
 *
 * @public
 */
export function ChatHeadlessProvider(
  props: ChatHeadlessProviderProps
): JSX.Element {
  const { children, config } = props;
  const headless = useMemo(
    () => new ChatHeadless(updateClientSdk(config)),
    [config]
  );

  return (
    <ChatHeadlessContext.Provider value={headless}>
      <Provider store={headless.store}>{children}</Provider>
    </ChatHeadlessContext.Provider>
  );
}
