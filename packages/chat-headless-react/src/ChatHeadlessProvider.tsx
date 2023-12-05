import {
  provideChatHeadless,
  ChatHeadless,
  HeadlessConfig,
} from "@yext/chat-headless";
import React, { PropsWithChildren, useMemo, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { ChatHeadlessContext } from "./ChatHeadlessContext";
import { updateClientSdk } from "./utils/clientSdk";

/**
 * Props for {@link ChatHeadlessProvider}. test
 *
 * @public
 */
export type ChatHeadlessProviderProps = PropsWithChildren<{
  config: HeadlessConfig;
}>;

/**
 * Instantiates a ChatHeadless instance for {@link ChatHeadlessContext} and provides
 * the context to all children components.
 *
 * @param props - {@link ChatHeadlessProviderProps}
 *
 * @public
 */
export function ChatHeadlessProvider(
  props: ChatHeadlessProviderProps
): JSX.Element {
  const { children, config } = props;

  const headless = useMemo(() => {
    const configWithoutSession = { ...config, saveToSessionStorage: false };
    const headless = provideChatHeadless(updateClientSdk(configWithoutSession));
    return headless;
  }, [config]);

  return (
    <ChatHeadlessInstanceProvider
      deferRender={config.saveToSessionStorage}
      headless={headless}
    >
      {children}
    </ChatHeadlessInstanceProvider>
  );
}

/**
 * Props for {@link ChatHeadlessInstanceProvider}
 *
 * @internal
 */
export type ChatHeadlessInstanceProviderProps = PropsWithChildren<{
  // Set this to true when using server-side rendering in conjunction with
  // browser-specific APIs like session storage.
  deferRender?: boolean;
  headless: ChatHeadless;
}>;

/**
 * Takes in a ChatHeadless instance for {@link ChatHeadlessContext} and provides
 * the context to all children components.
 * @param props - {@link ChatHeadlessInstanceProviderProps}
 *
 * @internal
 */
export function ChatHeadlessInstanceProvider(
  props: ChatHeadlessInstanceProviderProps
): JSX.Element {
  const { children, deferRender, headless } = props;
  // deferLoad is typically used with sessionStorage so that the children won't be
  // immediately rendered and trigger the "load initial message" flow before
  // the state can be loaded from session.
  const [deferLoad, setDeferLoad] = useState(deferRender);

  // sessionStorage is overridden here so that it is compatible with server-
  // side rendering, which cannot have browser api calls like session storage
  // outside of hooks.
  useEffect(() => {
    if (!deferRender || !headless) {
      return;
    }
    headless.initSessionStorage();
    setDeferLoad(false);
  }, [headless, deferRender]);

  return (
    <ChatHeadlessContext.Provider value={headless}>
      {deferLoad || <Provider store={headless.store}>{children}</Provider>}
    </ChatHeadlessContext.Provider>
  );
}
