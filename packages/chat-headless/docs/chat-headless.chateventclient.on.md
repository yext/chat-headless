<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@yext/chat-headless](./chat-headless.md) &gt; [ChatEventClient](./chat-headless.chateventclient.md) &gt; [on](./chat-headless.chateventclient.on.md)

## ChatEventClient.on() method

Registers an event listener for a specified event. Supported events are: - `message`<!-- -->: A new message has been received. - `typing`<!-- -->: The agent is typing. - `close`<!-- -->: The chat session has been closed.

**Signature:**

```typescript
on(eventName: "message" | "typing" | "close", cb: (data: any) => void): void;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  eventName | "message" \| "typing" \| "close" | The name of the event to listen to. |
|  cb | (data: any) =&gt; void | The callback function to be executed when the event is triggered. |

**Returns:**

void

