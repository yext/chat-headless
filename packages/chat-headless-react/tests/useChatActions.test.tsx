import { useChatActions } from '../src';
import { render } from '@testing-library/react';

it('invoke useChatActions outside of ChatHeadlessProvider', () => {
  function Test(): JSX.Element {
    useChatActions();
    return <div>hello</div>;
  }
  jest.spyOn(global.console, 'error').mockImplementation();
  const expectedError = new Error(
    'Attempted to call useChatActions() outside of ChatHeadlessProvider.' +
    ' Please ensure that \'useChatActions()\' is called within an ChatHeadlessProvider component.');
  expect(() => render(<Test />)).toThrow(expectedError);
});
