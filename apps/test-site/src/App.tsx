import {
  ChatHeadlessProvider,
  useChatActions,
  useChatState,
  ChatConfig,
} from "@yext/chat-headless-react";
import { useCallback, useEffect, useState } from "react";

const config: ChatConfig = {
  botId: "red-dog-bot",
  apiKey: "API_KEY_HERE",
  apiDomain: "liveapi-dev.yext.com",
};

function App() {
  return (
    <div className="App">
      <ChatHeadlessProvider config={config}>
        <MyComponent />
      </ChatHeadlessProvider>
    </div>
  );
}

function MyComponent(): JSX.Element {
  const isLoading = useChatState((s) => s.conversation.isLoading);
  const messages = useChatState((s) => s.conversation.messages);
  const actions = useChatActions();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (messages.length === 0) {
      actions.getNextMessage();
    }
  }, [messages, actions]);

  const onClick = useCallback(() => {
    actions.getNextMessage(input);
    setInput("");
  }, [actions, input]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  return (
    <div>
      {messages.map((m, i) => (
        <p key={i}>{`${m.source}: ${m.text}`}</p>
      ))}
      {isLoading && <p>loading...</p>}
      <input type="text" value={input} onChange={onInputChange} />
      <button onClick={onClick}>Send</button>
    </div>
  );
}

export default App;
