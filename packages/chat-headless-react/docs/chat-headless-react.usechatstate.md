<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@yext/chat-headless-react](./chat-headless-react.md) &gt; [useChatState](./chat-headless-react.usechatstate.md)

## useChatState() function

A React hook that returns a Chat state in store as specified by the map function.

**Signature:**

```typescript
export declare function useChatState<T>(stateSelector: StateSelector<T>): T;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  stateSelector | [StateSelector](./chat-headless-react.stateselector.md)<!-- -->&lt;T&gt; |  |

**Returns:**

T

## Remarks

This hook must be used only within [ChatHeadlessProvider()](./chat-headless-react.chatheadlessprovider.md)<!-- -->. Otherwise, it will throw an error.

