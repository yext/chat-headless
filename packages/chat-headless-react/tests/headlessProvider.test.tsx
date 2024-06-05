import { render } from "@testing-library/react";
import {
  ChatHeadlessProvider,
  ConversationState,
  HeadlessConfig,
} from "../src";
import { renderToString } from "react-dom/server";
import { useChatState } from "../src/useChatState";

it("only fetches local storage on client-side render", async () => {
  const win = window;
  Object.defineProperty(win, "localStorage", {
    value: {
      ...win.localStorage,
      getItem: (_: string): string => {
        return JSON.stringify({
          messages: [
            {
              text: "foobar",
              source: "BOT",
              timestamp: new Date().toISOString(),
            },
          ],
          isLoading: false,
          canSendMessage: false,
        } satisfies ConversationState);
      },
    },
  });
  const windowSpy = jest
    .spyOn(window, "window", "get")
    .mockImplementation(() => win);
  const config: HeadlessConfig = {
    botId: "123",
    apiKey: "1234",
    saveToLocalStorage: true,
  };
  const str = () =>
    renderToString(
      <ChatHeadlessProvider config={config}>
        <TestComponent />
      </ChatHeadlessProvider>
    );
  const container = document.body.appendChild(document.createElement("div"));
  container.innerHTML = str();
  expect(windowSpy).not.toHaveBeenCalled();
  expect(str()).not.toContain("foobar");

  const view = render(
    <ChatHeadlessProvider config={config}>
      <TestComponent />
    </ChatHeadlessProvider>,
    { container, hydrate: true }
  );
  expect(await view.findByText("foobar")).toBeTruthy();
  expect(windowSpy).toHaveBeenCalled();
});

const TestComponent = () => {
  const messages = useChatState((state) => state.conversation.messages);
  return (
    <div>
      {messages.map((msg, i) => (
        <span key={i}>{msg.text}</span>
      ))}
    </div>
  );
};
