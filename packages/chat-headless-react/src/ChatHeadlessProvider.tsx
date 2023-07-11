import { ChatHeadless, HeadlessConfig } from "@yext/chat-headless";
import { PropsWithChildren, useMemo, useEffect, useState } from "react";
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
  // deferLoad is used with sessionStorage so that the children won't be
  // immediately rendered and trigger the "load initial message" flow before
  // the state can be loaded from session.
  const [deferLoad, setDeferLoad] = useState(config.saveToSessionStorage);

  const headless = useMemo(() => {
    const configWithoutSession = { ...config, saveToSessionStorage: false };
    const headless = new ChatHeadless(updateClientSdk(configWithoutSession));
    return headless;
  }, [config]);

  // sessionStorage is overridden here so that it is compatible with server-
  // side rendering, which cannot have browser api calls like session storage
  // outside of hooks.
  useEffect(() => {
    if (!config.saveToSessionStorage || !headless) {
      return;
    }
    headless.initSessionStorage();
    setDeferLoad(false);
  }, [headless, config]);

  return (
    <ChatHeadlessContext.Provider value={headless}>
      {deferLoad || <Provider store={headless.store}>{children}</Provider>}
    </ChatHeadlessContext.Provider>
  );
}
