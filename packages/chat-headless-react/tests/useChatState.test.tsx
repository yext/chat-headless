import { ChatConfig, ChatHeadlessProvider, useChatState } from '../src';
import { render, screen } from '@testing-library/react';
import { ChatHeadlessContext } from '../src/ChatHeadlessContext';
import { useContext } from 'react';
import userEvent from '@testing-library/user-event';

it('invoke useChatState outside of ChatHeadlessProvider', () => {
  function Test(): JSX.Element {
    const isLoading = useChatState(state => state.conversation.isLoading);
    return <div>{isLoading}</div>;
  }
  jest.spyOn(global.console, 'error').mockImplementation();
  const expectedError = new Error(
    'Attempted to call useChatState() outside of ChatHeadlessProvider.' +
    ' Please ensure that \'useChatState()\' is called within an ChatHeadlessProvider component.');
  expect(() => render(<Test />)).toThrow(expectedError);
});

const config: ChatConfig = {
  botId: 'BOT_ID',
  apiKey: 'API_KEY',
};

it('trigger re-render on state update', async () => {
  const stateUpdates: (boolean | undefined)[] = [];

  function Test() {
    const selectedState = useChatState(s => s.conversation.isLoading);
    const headless = useContext(ChatHeadlessContext);
    stateUpdates.push(selectedState);

    return <div>
      <button onClick={() => headless.setChatLoadingStatus(true)}>update</button>
      <span>{selectedState}</span>
    </div>;
  }

  render(<ChatHeadlessProvider config={config}>
    <Test />
  </ChatHeadlessProvider>);
  expect(stateUpdates).toEqual([false]);
  await userEvent.click(screen.getByRole('button'));
  expect(stateUpdates).toEqual([false, true]);
});