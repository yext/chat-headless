import {
  ChatHeadless,
  Message,
  MessageSource,
  State,
  ChatConfig,
  MetaState,
  provideChatHeadless,
  MessageRequest,
  MessageResponse,
  RawResponse,
  StreamResponse,
  ApiError,
} from "../src";
import { initialState } from "../src/slices/conversation";
import { Readable } from "stream";
import coreLib from "@yext/chat-core";
import * as analyticsLib from "@yext/analytics";

const config: ChatConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};

const mockedMetaState: MetaState = {
  context: {
    foo: "bar",
  },
};

jest.mock("@yext/analytics");

function mockChatCore(spy?: jest.Mock) {
  jest.spyOn(coreLib, "provideChatCore").mockReturnValueOnce({
    getNextMessage: spy ?? jest.fn(),
    streamNextMessage: spy ?? jest.fn(),
  });
}

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(analyticsLib, "analytics").mockReturnValue({
    report: jest.fn(),
    with: jest.fn(),
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
      responseId: "response-id",
      text: "dummy response!",
      source: MessageSource.BOT,
      timestamp: "2023-05-15T17:39:58.019Z",
    },
    notes: {
      currentGoal: "SOME_GOAL",
    },
  };

  async function testAPI(
    chatHeadless: ChatHeadless,
    testFn: (text: string) => Promise<MessageResponse | undefined>,
    coreTestFnSpy: unknown
  ) {
    chatHeadless.setState({
      conversation: initialState,
      meta: mockedMetaState,
    });
    const responsePromise = testFn.bind(chatHeadless)("This is a dummy text!");
    //state update before response
    const expectedStateBeforeRes: State = {
      conversation: {
        messages: [expectedUserMessage],
        isLoading: true,
        canSendMessage: false,
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
        canSendMessage: true,
      },
      meta: mockedMetaState,
    };
    expect(chatHeadless.state).toEqual(expectedStateAfterRes);
    expect(coreTestFnSpy).toBeCalledTimes(1);
    const expectedRequest: MessageRequest = {
      conversationId: expectedStateBeforeRes.conversation.conversationId,
      notes: expectedStateBeforeRes.conversation.notes,
      messages: expectedStateBeforeRes.conversation.messages,
      context: expectedStateBeforeRes.meta.context,
    };
    expect(coreTestFnSpy).toBeCalledWith(expectedRequest);
    expect(response).toEqual(expectedResponse);
  }

  it("getNextMessage works as expected", async () => {
    const coreGetNextMessageSpy = jest
      .fn()
      .mockResolvedValueOnce(expectedResponse);
    mockChatCore(coreGetNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);
    await testAPI(
      chatHeadless,
      chatHeadless.getNextMessage,
      coreGetNextMessageSpy
    );
  });

  it("streamNextMessage works as expected", async () => {
    const coreStreamNextMessageSpy = jest.fn().mockResolvedValueOnce(
      new StreamResponse({
        ok: true,
        body: new Readable({
          read() {
            this.push(
              'event: startTokenStream\ndata: { "currentGoal": "SOME_GOAL" }\n\n'
            );
            this.push('event: streamToken\ndata: {"token": "dummy"}\n\n');
            this.push('event: streamToken\ndata: {"token": " response"}\n\n');
            this.push('event: streamToken\ndata: {"token": "!"}\n\n');
            this.push(
              'event: endStream\ndata: {"conversationId": "convo-id",' +
                '"message": { "timestamp": "2023-05-15T17:39:58.019Z", "source": "BOT", "text": "dummy response!", "responseId": "response-id" },' +
                '"notes": { "currentGoal": "SOME_GOAL" }}\n\n'
            );
            this.push(null);
          },
        }),
      } as unknown as RawResponse)
    );
    mockChatCore(coreStreamNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);

    const setMessagesSpy = jest.spyOn(chatHeadless, "setMessages");
    await testAPI(
      chatHeadless,
      chatHeadless.streamNextMessage,
      coreStreamNextMessageSpy
    );
    // 1 for user's message, 3 for each streamToken event, and 1 for endStream event
    expect(setMessagesSpy).toBeCalledTimes(5);
    expect(setMessagesSpy).nthCalledWith(1, [expectedUserMessage]);
    expect(setMessagesSpy).nthCalledWith(2, [
      expectedUserMessage,
      {
        source: "BOT",
        text: "dummy",
      },
    ]);
    expect(setMessagesSpy).nthCalledWith(3, [
      expectedUserMessage,
      {
        source: "BOT",
        text: "dummy response",
      },
    ]);
    expect(setMessagesSpy).nthCalledWith(4, [
      expectedUserMessage,
      {
        source: "BOT",
        text: "dummy response!",
      },
    ]);
    expect(setMessagesSpy).nthCalledWith(5, [
      expectedUserMessage,
      {
        timestamp: "2023-05-15T17:39:58.019Z",
        responseId: "response-id",
        source: "BOT",
        text: "dummy response!",
      },
    ]);
  });

  it("logs error when streamNextMessage failed to get full message response at end of stream", async () => {
    const coreStreamNextMessageSpy = jest.fn().mockResolvedValueOnce(
      new StreamResponse({
        ok: true,
        body: new Readable({
          read() {
            this.push("event: startTokenStream\ndata: {}\n\n");
            this.push('event: streamToken\ndata: {"token": "dummy"}\n\n');
            this.push('event: streamToken\ndata: {"token": " response!"}\n\n');
            //missing endStream event with full response
            this.push(null);
          },
        }),
      } as unknown as RawResponse)
    );
    mockChatCore(coreStreamNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);
    expect.assertions(3);

    try {
      await chatHeadless.streamNextMessage("This is a dummy text!");
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(ApiError);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e.message).toEqual(
        "Stream Error: Missing full message response at the end of stream."
      );
    }
    expect(coreStreamNextMessageSpy).toBeCalledTimes(1);
  });

  it("logs warning when attempt to send next message to API when it is still processing", async () => {
    const coreGetNextMessageSpy = jest
      .fn()
      .mockResolvedValueOnce(expectedResponse);
    mockChatCore(coreGetNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    chatHeadless.getNextMessage("message 1");
    const secondResponse = await chatHeadless.getNextMessage("message 2");
    expect(consoleWarnSpy).toBeCalledTimes(1);
    expect(consoleWarnSpy).toBeCalledWith(
      "Unable to process new message at the moment. Another message is still being processed."
    );
    expect(secondResponse).toBeUndefined();
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
    expect(coreGetNextMessageSpy).toBeCalledWith({
      messages: [
        {
          source: MessageSource.USER,
          text: "message 1",
          timestamp: expect.any(String),
        },
      ],
    });
  });

  it("updates state and throw error when an API request returns an error", async () => {
    const errorMessage =
      "Chat API error: FATAL_ERROR: Invalid API Key. (code: 1)";
    const coreGetNextMessageSpy = jest.fn().mockRejectedValue(errorMessage);
    mockChatCore(coreGetNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);
    expect.assertions(3);

    try {
      await chatHeadless.getNextMessage("This is a dummy text!");
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toEqual(errorMessage);
      const expectedState: State = {
        conversation: {
          messages: [expectedUserMessage],
          isLoading: false,
          canSendMessage: true,
        },
        meta: {},
      };
      // eslint-disable-next-line jest/no-conditional-expect
      expect(chatHeadless.state).toEqual(expectedState);
    }
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
  });

  it("sends message array as is for initial message from bot", async () => {
    const coreGetNextMessageSpy = jest
      .fn()
      .mockResolvedValueOnce(expectedResponse);
    mockChatCore(coreGetNextMessageSpy);
    const chatHeadless = provideChatHeadless(config);
    expect(chatHeadless.state.conversation.messages).toEqual([]);

    await chatHeadless.getNextMessage();
    expect(coreGetNextMessageSpy).toBeCalledTimes(1);
    expect(coreGetNextMessageSpy).toBeCalledWith({
      messages: [],
    });
  });
});
