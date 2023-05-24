import {
  ChatHeadless,
  Message,
  MessageSource,
  State,
  ChatConfig,
  MetaState
} from "../src";
import {
  ChatCore,
  MessageRequest,
  MessageResponse,
  RawResponse,
  StreamResponse,
} from "@yext/chat-core";
import {
  initialState,
} from "../src/slices/conversation";
import { Readable } from "stream";

const config: ChatConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};

const mockedMetaState: MetaState = {
  context: {
    foo: "bar",
  },
};

beforeEach(() => {
  sessionStorage.clear();
})

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

  async function testAPI(
    chatHeadless: ChatHeadless,
    testFn: (text: string) => Promise<MessageResponse>,
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
    const chatHeadless = new ChatHeadless(config);
    const coreGetNextMessageSpy = jest
      .spyOn(ChatCore.prototype, 'getNextMessage')
      .mockResolvedValueOnce(expectedResponse);
    await testAPI(chatHeadless, chatHeadless.getNextMessage, coreGetNextMessageSpy)
  });

  it("streamNextMessage works as expected", async () => {
   const chatHeadless = new ChatHeadless(config);
   const coreStreamtNextMessageSpy = jest
   .spyOn(ChatCore.prototype, "streamNextMessage")
   .mockResolvedValueOnce(new StreamResponse({
     body: new Readable({
       read() {
         this.push('event: startTokenStream\ndata: { "currentGoal": "SOME_GOAL" }\n\n')
         this.push('event: streamToken\ndata: {"token": "dummy"}\n\n')
         this.push('event: streamToken\ndata: {"token": " response"}\n\n')
         this.push('event: streamToken\ndata: {"token": "!"}\n\n')
         this.push('event: endStream\ndata: {"conversationId": "convo-id",' + 
         '"message": { "timestamp": "2023-05-15T17:39:58.019Z", "source": "BOT", "text": "dummy response!"},'+ 
         '"notes": { "currentGoal": "SOME_GOAL" }}\n\n')
         this.push(null);
       },
     })
   } as unknown as RawResponse));

   const setMessagesSpy = jest.spyOn(chatHeadless, 'setMessages');
   await testAPI(chatHeadless, chatHeadless.streamNextMessage, coreStreamtNextMessageSpy);
   // 1 for user's message, 3 for each streamToken event, and 1 for endStream event
   expect(setMessagesSpy).toBeCalledTimes(5)
   expect(setMessagesSpy).nthCalledWith(1, [expectedUserMessage])
   expect(setMessagesSpy).nthCalledWith(2, [expectedUserMessage, {
      source: "BOT",
      text: "dummy"
    }])
    expect(setMessagesSpy).nthCalledWith(3, [expectedUserMessage, {
      source: "BOT",
      text: "dummy response"
    }])
    expect(setMessagesSpy).nthCalledWith(4, [expectedUserMessage, {
      source: "BOT",
      text: "dummy response!"
    }])
    expect(setMessagesSpy).nthCalledWith(5, [expectedUserMessage, {
      timestamp: "2023-05-15T17:39:58.019Z",
      source: "BOT",
      text: "dummy response!"
    }])
  })

  it("logs error when streamNextMessage failed to get full message response at end of stream", async () => {
    const chatHeadless = new ChatHeadless(config);
    const coreStreamNextMessageSpy = jest
      .spyOn(ChatCore.prototype, "streamNextMessage")
      .mockResolvedValueOnce(new StreamResponse({
        body: new Readable({
          read() {
            this.push('event: startTokenStream\ndata: {}\n\n')
            this.push('event: streamToken\ndata: {"token": "dummy"}\n\n')
            this.push('event: streamToken\ndata: {"token": " response!"}\n\n')
            //missing endStream event with full response
            this.push(null);
          },
        })
      } as unknown as RawResponse));
    expect.assertions(2);

    try {
      await chatHeadless.streamNextMessage("This is a dummy text!");
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toEqual("Stream Error: Missing full message response at the end of stream.");
    }
    expect(coreStreamNextMessageSpy).toBeCalledTimes(1);
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