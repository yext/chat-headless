import { ChatHeadless, ChatConfig } from '@yext/chat-headless';
import { PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { ChatHeadlessContext } from './ChatHeadlessContext';

/**
 * Props for {@link ChatHeadlessProvider}
 */
export type ChatHeadlessProviderProps = PropsWithChildren<{
  /** {@inheritdoc ChatConfig} */
  config: ChatConfig
}>

/**
 * Instantiates a ChatHeadless instance for {@link ChatHeadlessContext} and provide
 * the context for all children components.
 *
 * @param props - {@link ChatHeadlessProviderProps}
 * 
 * @public
 */
export function ChatHeadlessProvider(props: ChatHeadlessProviderProps): JSX.Element {
  const {children, config } = props;
  const headless = useMemo(() => new ChatHeadless(config), [config])

  return (
    <ChatHeadlessContext.Provider value={headless}>
      <Provider store={headless.store}>
        {children}
      </Provider>
    </ChatHeadlessContext.Provider>
  )
}