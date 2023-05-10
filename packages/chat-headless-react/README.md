# Chat Headless React

Chat Headless React is the official React UI Bindings layer for Chat Headless

## Getting Started - `ChatHeadlessProvider`

Chat Headless React includes an `<ChatHeadlessProvider />` component, which takes in a `ChatConfig`, instantiate a `ChatHeadless` instance and makes it available to the rest of your app:

```tsx
import { ChatHeadlessProvider, ChatConfig } from "@yext/chat-headless-react";

const config: ChatConfig = {
  botId: "BOT_ID",
  apiKey: "API_KEY",
};

function MyApp() {
  return (
    <ChatHeadlessProvider config={config}>
      {/* Add components that use Chat as children */}
      <MyComponent />
    </ChatHeadlessProvider>
  );
}
```

## Respond to State Updates with `useChatState`

`useChatState` reads a value from the `ChatState` state and subscribes to updates.

```tsx
import { useChatState } from "@yext/chat-headless-react";

export default function MyComponent() {
  const isLoadingStatus = useChatState((state) => state.conversation.isLoading);
  return <div>{`Loading Status: ${isLoadingStatus}`}</div>;
}
```

## Dispatch Actions with `useChatActions`

`useChatActions` allows you to dispatch actions using the `ChatHeadless` instance.

```tsx
import { useChatActions } from "@yext/chat-headless-react";
import { useCallback } from "react";

function MyComponent() {
  const actions = useChatActions();
  const onClick = useCallback(() => {
    actions.setChatLoadingStatus(true);
  }, [actions]);

  return <button onClick={onClick}>Click Me</button>;
}
```
