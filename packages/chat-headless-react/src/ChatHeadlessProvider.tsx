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
 * Props for {@link ChatHeadlessProvider}
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
  console.log('test headless react')
  const headless = useMemo(() => {
    const configWithoutLocalStorage = { ...config, saveToLocalStorage: false };
    const headless = provideChatHeadless(
      updateClientSdk(configWithoutLocalStorage)
    );
    return headless;
  }, [config]);

  return (
    <ChatHeadlessInstanceProvider
      deferRender={config.saveToLocalStorage}
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
  // browser-specific APIs like local storage.
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
  // deferLoad is typically used with localStorage so that the children won't be
  // immediately rendered and trigger the "load initial message" flow before
  // the state can be loaded from local storage.
  const [deferLoad, setDeferLoad] = useState(deferRender);

  // localStorage is overridden here so that it is compatible with server-
  // side rendering, which cannot have browser api calls like local storage
  // outside of hooks.
  useEffect(() => {
    if (!deferRender || !headless) {
      return;
    }
    headless.initLocalStorage();
    setDeferLoad(false);
  }, [headless, deferRender]);

  return (
    <ChatHeadlessContext.Provider value={headless}>
      {deferLoad || <Provider store={headless.store}>{children}</Provider>}
    </ChatHeadlessContext.Provider>
  );
}
