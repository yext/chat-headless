import {
  ChatHeadlessProvider,
  useChatActions,
  useChatState,
  ChatConfig,
} from "@yext/chat-headless-react";
import { useCallback, useEffect, useState } from "react";

const config: ChatConfig = {
  botId: "red-dog-bot",
  apiKey: process.env.REACT_APP_BOT_API_KEY || "BOT_KEY_HERE",
  apiDomain: "liveapi-dev.yext.com",
};

function App() {
  return (
    <div className="App">
      <ChatHeadlessProvider config={config}>
        <ChatComponent />
      </ChatHeadlessProvider>
    </div>
  );
}

function ChatComponent() {
  const isLoading = useChatState((s) => s.conversation.isLoading);
  const messages = useChatState((s) => s.conversation.messages);
  const [input, setInput] = useState("");
  const actions = useChatActions();

  useEffect(() => {
    if (messages.length === 0) {
      actions.getNextMessage();
    }
  }, [messages, actions]);

  const onClick = useCallback(() => {
    actions.getNextMessage(input);
    setInput("");
  }, [actions, input]);

  const onClickStream = useCallback(() => {
    actions.streamNextMessage(input);
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
      <button onClick={onClickStream}>Send (Stream)</button>
    </div>
  );
}

export default App;
