import {
  ChatHeadlessProvider,
  useChatActions,
  useChatState,
  HeadlessConfig,
  MessageSource,
} from "@yext/chat-headless-react";
import { useCallback, useEffect, useState } from "react";

/**
 * The analytics SDK only supports the SANDBOX and PRODUCTION environments. If you want to test
 * chat with analytics events, set testEnvironment to SANDBOX.
 * */
const testEnvironment = 'DEV';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const chatEndpoint = testEnvironment === 'SANDBOX'
    ?  `https://sbx-cdn.us.yextapis.com/v2/accounts/me/chat/${process.env.REACT_APP_TEST_BOT_ID}/message`
    : `https://liveapi-dev.yext.com/v2/accounts/me/chat/${process.env.REACT_APP_TEST_BOT_ID}/message`;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const chatStreamEndpoint = testEnvironment === 'SANDBOX'
    ? `https://sbx-cdn.us.yextapis.com/v2/accounts/me/chat/${process.env.REACT_APP_TEST_BOT_ID}/message/streaming`
    : `https://liveapi-dev.yext.com/v2/accounts/me/chat/${process.env.REACT_APP_TEST_BOT_ID}/message/streaming`;

const config: HeadlessConfig = {
  botId: process.env.REACT_APP_TEST_BOT_ID || "BOT_ID_HERE",
  apiKey: process.env.REACT_APP_BOT_API_KEY || "BOT_KEY_HERE",
  env: 'SANDBOX',
  region: 'US',
  endpoints: {
    chat: chatEndpoint,
    chatStream: chatStreamEndpoint,
  },
  analyticsConfig: {
    baseEventPayload: {
      internalUser: true,
    },
  },
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

  const onReport = useCallback(async () => {
    await actions.report({
      action: "CHAT_LINK_CLICK",
      visitor: {
        "test-id": "test-method",
      },
    });
  }, [actions]);

  const onRestart = useCallback(() => {
    actions.restartConversation();
  }, [actions]);

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
      <button onClick={onReport}>report</button>
      <button onClick={onRestart}>Restart</button>
    </div>
  );
}

export default App;
