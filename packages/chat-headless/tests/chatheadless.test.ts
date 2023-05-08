
import { ChatHeadless, ConversationState, Message, MessageNotes, MessageSource, State } from '../src';
import { ChatConfig, ChatCore, MessageResponse } from '@yext/chat-core';
import { ReduxStateManager } from '../src/ReduxStateManager'

jest.mock('@yext/chat-core')

const config: ChatConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY"
}

describe('setters work as expected', () => {
  it('setMessages works as expected', () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, 'dispatch')
    const state: State = {
      conversation: {
        messages: [{
          text: "How can I help you?",
          source: MessageSource.BOT,
          timestamp: 100
        }],
        notes: {
          currentGoal: "NEW_GOAL"
        }
      },
      chatStatus: {
        isLoading: true
      }
    }
    chatHeadless.setState(state);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: 'set-state',
      payload: state
    });
  });
  
  it('setMessages works as expected', () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, 'dispatch')
    const messages: Message[] = [
      {
        text: "How can I help you?",
        source: MessageSource.BOT,
        timestamp: 100
      },
      {
        text: "What is Yext Chat?",
        source: MessageSource.USER,
        timestamp: 200
      },
    ];
    chatHeadless.setMessages(messages);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: 'conversation/setMessages',
      payload: messages
    });
  });

  it('setMessageNotes works as expected', () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, 'dispatch')
    const notes: MessageNotes = {
      currentGoal: "MY_GOAL",
      searchQuery: "MY QUERY",
      queryResult: {
        foo: "bar"
      },
      collectedData: {
        name: "John Doe"
      }
    };
    chatHeadless.setMessageNotes(notes);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: 'conversation/setMessageNotes',
      payload: notes
    });
  });

  it('setChatLoadingStatus works as expected', () => {
    const chatHeadless = new ChatHeadless(config);
    const stateDispatchSpy = jest.spyOn(ReduxStateManager.prototype, 'dispatch')
    chatHeadless.setChatLoadingStatus(true);
    expect(stateDispatchSpy).toBeCalledTimes(1);
    expect(stateDispatchSpy).toBeCalledWith({
      type: 'chatStatus/setIsLoading',
      payload: true
    });
  });
})

describe('Chat API methods work as expected', () => {
  it("getNextMessage works as expected", async () => {
    const chatHeadless = new ChatHeadless(config);
    const expectedResponse: MessageResponse = {
      message: {
        text: "dummy response!",
        source: MessageSource.BOT,
        timestamp: 123456789
      },
      notes: {
        currentGoal: "SOME_GOAL"
      },
    }
    const expectedUserMessage: Message = {
      text: "This is a dummy text!",
      source: MessageSource.USER,
      timestamp: expect.any(Number)
    }

    const coreGetNextMessageSpy = jest.spyOn(ChatCore.prototype, 'getNextMessage')
      .mockResolvedValue(expectedResponse)
    const responsePromise = chatHeadless.getNextMessage("This is a dummy text!");
    //state update before response
    expect(chatHeadless.state).toEqual({
      conversation: {
        messages: [expectedUserMessage]
      },
      chatStatus: {
        isLoading: true
      }
    })

    const response = await responsePromise;
    //state update after response
    expect(chatHeadless.state).toEqual({
      conversation: {
        messages: [expectedUserMessage, expectedResponse.message],
        notes: expectedResponse.notes
      },
      chatStatus: {
        isLoading: false
      }
    })
    expect(coreGetNextMessageSpy).toBeCalledTimes(1)
    expect(response).toEqual(expectedResponse)
  })
})


describe("addListener works as expected", () => {
  const messages: Message[] = [
    { text: "test", source: MessageSource.BOT, timestamp: 100 }
  ];
    
  it("invokes callback on state update", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn()
    chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback
    })

    expect(mockedCallback).toBeCalledTimes(0)
    chatHeadless.setMessages(messages)
    expect(mockedCallback).toBeCalledTimes(1)
    expect(mockedCallback).toHaveBeenCalledWith(messages)
  })

  it("unsubscribes to state update event when the returned function is invoked", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn()
    const unsubscribedFn = chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback
    })
    unsubscribedFn()
    expect(mockedCallback).toBeCalledTimes(0)
    chatHeadless.setMessages(messages)
    expect(mockedCallback).toBeCalledTimes(0)
  })

  it("doesn't invoke callback on a different state update", () => {
    const chatHeadless = new ChatHeadless(config);
    const mockedCallback = jest.fn()
    chatHeadless.addListener({
      valueAccessor: (s) => s.conversation.messages,
      callback: mockedCallback
    })
    expect(mockedCallback).toBeCalledTimes(0)
    chatHeadless.setMessageNotes({})
    expect(mockedCallback).toBeCalledTimes(0)
  })
})