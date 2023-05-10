import {
  ChatHeadlessProvider,
  useChatActions,
  useChatState,
  ChatConfig,
} from "@yext/chat-headless-react";
import { useCallback } from "react";

const config: ChatConfig = {
  botId: "",
  apiKey: "",
};

function MyComponent(): JSX.Element {
  const isLoading = useChatState((s) => s.conversation.isLoading);
  const messages = useChatState((s) => s.conversation.messages);
  const actions = useChatActions();

  const onClick = useCallback(() => {
    actions.setChatLoadingStatus(!isLoading);
  }, [actions, isLoading]);

  return (
    <div>
      <button onClick={onClick}>Click me!</button>
      <p>isLoading: {`${isLoading}`}</p>
      {messages.map((m) => (
        <p>{`${m.source}: ${m.text}`}</p>
      ))}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <ChatHeadlessProvider config={config}>
        <MyComponent />
      </ChatHeadlessProvider>
    </div>
  );
}

export default App;
