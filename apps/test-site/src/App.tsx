import {
  ChatHeadlessProvider,
  useChatActions,
  useChatState,
  HeadlessConfig,
  MessageSource,
} from "@yext/chat-headless-react";
import { useCallback, useEffect, useState } from "react";

const config: HeadlessConfig = {
  botId: "tripp-bot",
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
  const canSendMessage = useChatState((s) => s.conversation.canSendMessage);
  const messages = useChatState((s) => s.conversation.messages);
  const [input, setInput] = useState("");
  const actions = useChatActions();

  const handleError = useCallback(
    (e: unknown) => {
      console.error(e);
      actions.addMessage({
        text: "Sorry, I'm unable to respond at the moment. Please try again later!",
        source: MessageSource.BOT,
        timestamp: new Date().toISOString(),
      });
    },
    [actions]
  );

  useEffect(() => {
    if (messages.length === 0) {
      actions.getNextMessage(input).catch((e) => handleError(e));
    }
  }, [messages, actions, input, handleError]);

  const onClick = useCallback(async () => {
    actions.getNextMessage(input).catch((e) => handleError(e));
    setInput("");
  }, [actions, handleError, input]);

  const onClickStream = useCallback(() => {
    actions.streamNextMessage(input).catch((e) => handleError(e));
    setInput("");
  }, [actions, handleError, input]);

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
      <input
        type="text"
        value={input}
        disabled={!canSendMessage}
        onChange={onInputChange}
      />
      <button onClick={onClick}>Send</button>
      <button onClick={onClickStream}>Send (Stream)</button>
    </div>
  );
}

export default App;
