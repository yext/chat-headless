import {
  ChatHttpClient,
  ConversationState,
  HeadlessConfig,
  Message,
  MessageNotes,
  MessageSource,
  MetaState,
  State,
  provideChatHeadless,
} from "../src";
import coreLib from "@yext/chat-core";
import { ReduxStateManager } from "../src/ReduxStateManager";
import {
  getStateLocalStorageKey,
  initialState,
} from "../src/slices/conversation";

const config: HeadlessConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};
const jestHostname = "localhost";

const mockedMetaState: MetaState = {
  context: {
    foo: "bar",
  },
};

beforeEach(() => {
  jest.spyOn(coreLib, "provideChatCore").mockImplementation(() => {
    return {
      getNextMessage: jest.fn(),
      on: jest.fn(),
    } as Partial<ChatHttpClient> as ChatHttpClient;
  });
  localStorage.clear();
});

describe("setters work as expected", () => {
  it("setState works as expected", () => {
    const chatHeadless = provideChatHeadless(config);
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
        canSendMessage: false,
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
    const chatHeadless = provideChatHeadless(config);
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
    const chatHeadless = provideChatHeadless(config);
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

  it("addMessage works as expected", () => {
    const chatHeadless = provideChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(
      ReduxStateManager.prototype,
      "dispatch"
    );
    const message: Message = {
      text: "What is Yext Chat?",
      source: MessageSource.USER,
      timestamp: "2023-05-15T17:40:58.019Z",
    };
    chatHeadless.addMessage(message);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: "conversation/addMessage",
      payload: message,
    });
  });

  it("setMessageNotes works as expected", () => {
    const chatHeadless = provideChatHeadless(config);
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
    const chatHeadless = provideChatHeadless(config);
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

describe("addListener works as expected", () => {
  const messages: Message[] = [
    {
      text: "test",
      source: MessageSource.BOT,
      timestamp: "2023-05-15T17:39:58.019Z",
    },
  ];

  it("invokes callback on state update", () => {
    const chatHeadless = provideChatHeadless(config);
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
    const chatHeadless = provideChatHeadless(config);
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
    const chatHeadless = provideChatHeadless(config);
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
  const chatHeadless = provideChatHeadless(config);
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
      canSendMessage: false,
    },
    meta: mockedMetaState,
  });
  const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, "dispatch");
  chatHeadless.restartConversation();
  expect(stateDispatchSpy).toBeCalledTimes(5);
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
  expect(stateDispatchSpy).toHaveBeenCalledWith({
    type: "conversation/setCanSendMessage",
    payload: true,
  });

  const expectedState: State = {
    conversation: {
      messages: [],
      notes: {},
      isLoading: false,
      canSendMessage: true,
    },
    meta: mockedMetaState,
  };
  expect(chatHeadless.state).toEqual(expectedState);
});

describe("loadSessionState works as expected", () => {
  const expectedState: ConversationState = {
    conversationId: "dummy-id",
    messages: [
      {
        text: "How can I help you?",
        source: MessageSource.BOT,
        timestamp: new Date().toISOString(),
      },
    ],
    notes: {
      currentGoal: "GOAL",
    },
    isLoading: true,
    canSendMessage: true,
  };

  it("loads valid state from local storage", () => {
    localStorage.setItem(
      getStateLocalStorageKey(jestHostname, config.botId),
      JSON.stringify(expectedState)
    );
    const chatHeadless = provideChatHeadless(config);
    expect(chatHeadless.state).toEqual({
      conversation: expectedState,
      meta: {},
    });
  });

  it("handles invalid state in local storage", () => {
    localStorage.setItem(
      getStateLocalStorageKey(jestHostname, config.botId),
      JSON.stringify({ hello: "world" })
    );
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    const chatHeadless = provideChatHeadless(config);
    expect(chatHeadless.state).toEqual({
      conversation: initialState,
      meta: {},
    });
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith(
      "Unabled to load saved state: error parsing state. Starting with a fresh state."
    );
  });

  it("does not persist or load state when toggle is off", () => {
    localStorage.setItem(
      getStateLocalStorageKey(jestHostname, config.botId),
      JSON.stringify(expectedState)
    );
    const chatHeadless = provideChatHeadless({
      ...config,
      saveToLocalStorage: false,
    });
    expect(chatHeadless.state).toEqual({
      conversation: initialState,
      meta: {},
    });
    const modifiedMessages = [
      ...expectedState.messages,
      {
        text: "This is a new message",
        source: MessageSource.USER,
        timestamp: "2023-05-15T17:39:58.019Z",
      },
    ];
    chatHeadless.setMessages(modifiedMessages);
    expect(
      localStorage.getItem(getStateLocalStorageKey(jestHostname, config.botId))
    ).toEqual(JSON.stringify(expectedState));
  });

  const oldState: ConversationState = {
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
    canSendMessage: true,
  };

  it("ignores and removes state when older than 24 hours", () => {
    const oldStateKey = getStateLocalStorageKey(jestHostname, config.botId);
    localStorage.setItem(oldStateKey, JSON.stringify(oldState));
    const chatHeadless = provideChatHeadless(config);
    expect(chatHeadless.state).toEqual({
      conversation: initialState,
      meta: {},
    });
    expect(localStorage.getItem(oldStateKey)).toBeNull();
  });
});
