import {
  ChatHeadless,
  Message,
  MessageNotes,
  MessageSource,
  MetaState,
  State,
} from "../src";
import {
  ChatConfig,
  ChatCore,
  MessageRequest,
  MessageResponse,
} from "@yext/chat-core";
import { ReduxStateManager } from "../src/ReduxStateManager";
import {
  initialState,
  STATE_SESSION_STORAGE_KEY,
} from "../src/slices/conversation";

jest.mock("@yext/chat-core");

const config: ChatConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};

const mockedMetaState: MetaState = {
  context: {
    foo: "bar",
  },
};

describe("setters work as expected", () => {
  it("setState works as expected", () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    const state: State = {
      conversation: {
        messages: [
          {
            text: "How can I help you?",
            source: MessageSource.BOT,
            timestamp: "2023-05-15T17:39:58.019Z",
          },
        ],
        notes: {
          currentGoal: "NEW_GOAL",
        },
        isLoading: true,
      },
      meta: mockedMetaState,
    };
    chatHeadless.setState(state);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "set-state",
      payload: state,
    });
  });

  it("setContext works as expected", () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    const context = {
      hello: "world",
    };
    chatHeadless.setContext(context);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "meta/setContext",
      payload: context,
    });
  });

  it("setMessages works as expected", () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    const messages: Message[] = [
      {
        text: "How can I help you?",
        source: MessageSource.BOT,
        timestamp: "2023-05-15T17:39:58.019Z",
      },
      {
        text: "What is Yext Chat?",
        source: MessageSource.USER,
        timestamp: "2023-05-15T17:40:58.019Z",
      },
    ];
    chatHeadless.setMessages(messages);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "conversation/setMessages",
      payload: messages,
    });
  });

  it("setMessageNotes works as expected", () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    const notes: MessageNotes = {
      currentGoal: "MY_GOAL",
      searchQuery: "MY QUERY",
      queryResult: {
        foo: "bar",
      },
      collectedData: {
        name: "John Doe",
      },
    };
    chatHeadless.setMessageNotes(notes);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "conversation/setMessageNotes",
      payload: notes,
    });
  });

  it("setChatLoadingStatus works as expected", () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    chatHeadless.setChatLoadingStatus(true);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "conversation/setIsLoading",
      payload: true,
    });
  });
});

describe("Chat API methods work as expected", () => {
  const expectedUserMessage: Message = {
    text: "This is a dummy text!",
    source: MessageSource.USER,
    timestamp: expect.any(String),
  };
  const expectedResponse: MessageResponse = {
    conversationId: "convo-id",
    message: {
      text: "dummy response!",
      source: MessageSource.BOT,
      timestamp: "2023-05-15T17:39:58.019Z",
    },
    notes: {
      currentGoal: "SOME_GOAL",
    },
  };

  it("getNextMessage works as expected", async () => {
    const chatHeadless = new ChatHeadless(config);
    chatHeadless.setState({
      conversation: initialState,
      meta: mockedMetaState,
    });
    const coreGetNextMessageSpy = jest
      .spyOn(ChatCore.prototype, "getNextMessage")
      .mockResolvedValueOnce(expectedResponse);
    const responsePromise = chatHeadless.getNextMessage(
      "This is a dummy text!"
    );
    //state update before response
    const expectedStateBeforeRes: State = {
      conversation: {
        messages: [expectedUserMessage],
        isLoading: true,
      },
      meta: mockedMetaState,
    };
    expect(chatHeadless.state).toEqual(expectedStateBeforeRes);

    const response = await responsePromise;
    //state update after response
    const expectedStateAfterRes = {
      conversation: {
        conversationId: expectedResponse.conversationId,
        messages: [expectedUserMessage, expectedResponse.message],
        notes: expectedResponse.notes,
        isLoading: false,
      },
      meta: mockedMetaState,
    };
    expect(chatHeadless.state).toEqual(expectedStateAfterRes);
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
    const expectedRequest: MessageRequest = {
      conversationId: expectedStateBeforeRes.conversation.conversationId,
      notes: expectedStateBeforeRes.conversation.notes,
      messages: expectedStateBeforeRes.conversation.messages,
      context: expectedStateBeforeRes.meta.context,
    };
    expect(coreGetNextMessageSpy).toBeCalledWith(expectedRequest);
    expect(response).toEqual(expectedResponse);
  });

  it("updates loading status and throw error when an API request returns an error", async () => {
    const errorMessage =
      "Chat API error: FATAL_ERROR: Invalid API Key. (code: 1)";
    const chatHeadless = new ChatHeadless(config);
    const coreGetNextMessageSpy = jest
      .spyOn(ChatCore.prototype, "getNextMessage")
      .mockRejectedValue(errorMessage);
    expect.assertions(3);

    try {
      await chatHeadless.getNextMessage("This is a dummy text!");
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toEqual(errorMessage);
      // eslint-disable-next-line jest/no-conditional-expect
      expect(chatHeadless.state).toEqual({
        conversation: {
          messages: [expectedUserMessage],
          isLoading: false,
        },
        meta: {},
      });
    }
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
  });

  it("sends message array as is for initial message from bot", async () => {
    const chatHeadless = new ChatHeadless(config);
    expect(chatHeadless.state.conversation.messages).toEqual([]);

    const coreGetNextMessageSpy = jest
      .spyOn(ChatCore.prototype, "getNextMessage")
      .mockResolvedValueOnce(expectedResponse);
    await chatHeadless.getNextMessage();
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
    expect(coreGetNextMessageSpy).toBeCalledWith({
      messages: [],
    });
  });
});

describe("addListener works as expected", () => {
  const messages: Message[] = [
    {
      text: "test",
      source: MessageSource.BOT,
      timestamp: "2023-05-15T17:39:58.019Z",
    },
  ];

  it("invokes callback on state update", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn();
    chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback,
    });

    expect(mockedCallback).toBeCalledTimes(0);
    chatHeadless.setMessages(messages);
    expect(mockedCallback).toBeCalledTimes(1);
    expect(mockedCallback).toHaveBeenCalledWith(messages);
  });

  it("unsubscribes to state update event when the returned function is invoked", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn();
    const unsubscribedFn = chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback,
    });
    unsubscribedFn();
    expect(mockedCallback).toBeCalledTimes(0);
    chatHeadless.setMessages(messages);
    expect(mockedCallback).toBeCalledTimes(0);
  });

  it("does not invoke callback on a different state update", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn();
    chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback,
    });
    expect(mockedCallback).toBeCalledTimes(0);
    chatHeadless.setMessageNotes({});
    expect(mockedCallback).toBeCalledTimes(0);
  });
});

it("restartConversation works as expected", () => {
  const chatHeadless = new ChatHeadless(config);
  chatHeadless.setState({
    conversation: {
      conversationId: "dummy-id",
      messages: [
        {
          text: "How can I help you?",
          source: MessageSource.BOT,
          timestamp: "2023-05-15T17:39:58.019Z",
        },
      ],
      notes: {
        currentGoal: "GOAL",
      },
      isLoading: true,
    },
    meta: mockedMetaState,
  });
  const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, "dispatch");
  chatHeadless.restartConversation();
  expect(stateDispatchSpy).toBeCalledTimes(4);
  expect(stateDispatchSpy).toHaveBeenCalledWith({
    type: "conversation/setConversationId",
    payload: undefined,
  });
  expect(stateDispatchSpy).toHaveBeenCalledWith({
    type: "conversation/setIsLoading",
    payload: false,
  });
  expect(stateDispatchSpy).toHaveBeenCalledWith({
    type: "conversation/setMessageNotes",
    payload: {},
  });
  expect(stateDispatchSpy).toHaveBeenCalledWith({
    type: "conversation/setMessages",
    payload: [],
  });

  const expectedState: State = {
    conversation: {
      messages: [],
      notes: {},
      isLoading: false,
    },
    meta: mockedMetaState,
  };
  expect(chatHeadless.state).toEqual(expectedState);
});

describe("loadSessionState works as expected", () => {
  const expectedState = {
    conversationId: "dummy-id",
    messages: [
      {
        text: "How can I help you?",
        source: MessageSource.BOT,
        timestamp: "2023-05-15T17:39:58.019Z",
      },
    ],
    notes: {
      currentGoal: "GOAL",
    },
    isLoading: true,
  };
  it("loads valid state from session storage", () => {
    sessionStorage.setItem(
      STATE_SESSION_STORAGE_KEY,
      JSON.stringify(expectedState)
    );
    const chatHeadless = new ChatHeadless(config);
    chatHeadless.setState({
      ...chatHeadless.state,
      meta: mockedMetaState,
    });

    expect(chatHeadless.state).toEqual({ conversation: expectedState, meta: mockedMetaState });
  });

  it("does not persist or load state when toggle is off", () => {
    sessionStorage.setItem(
      STATE_SESSION_STORAGE_KEY,
      JSON.stringify(expectedState)
    );
    const chatHeadless = new ChatHeadless(config, false);
    chatHeadless.setState({
      ...chatHeadless.state,
      meta: mockedMetaState,
    });
    expect(chatHeadless.state).toEqual({ conversation: initialState, meta: mockedMetaState });
    const modifiedMessages = [
      ...expectedState.messages,
      {
        text: "This is a new message",
        source: MessageSource.USER,
        timestamp: "2023-05-15T17:39:58.019Z",
      },
    ];
    chatHeadless.setMessages(modifiedMessages);
    expect(sessionStorage.getItem(STATE_SESSION_STORAGE_KEY)).toEqual(
      JSON.stringify(expectedState)
    );
  });
});
