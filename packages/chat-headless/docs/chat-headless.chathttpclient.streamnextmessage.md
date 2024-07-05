<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@yext/chat-headless](./chat-headless.md) &gt; [ChatHttpClient](./chat-headless.chathttpclient.md) &gt; [streamNextMessage](./chat-headless.chathttpclient.streamnextmessage.md)

## ChatHttpClient.streamNextMessage() method

Make a request to generate the next message and stream its tokens via server-sent events.

**Signature:**

```typescript
streamNextMessage(request: MessageRequest): Promise<StreamResponse>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  request | MessageRequest | The message request to process. |

**Returns:**

Promise&lt;StreamResponse&gt;
