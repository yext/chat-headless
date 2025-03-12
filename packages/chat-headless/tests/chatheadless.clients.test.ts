/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, MessageResponse, MessageSource } from "@yext/chat-core";
import { provideChatHeadless } from "../src/HeadlessProvider";
import { ChatEventClient, ChatHttpClient, HeadlessConfig } from "../src/models";
import * as analyticsLib from "@yext/analytics";

jest.useFakeTimers();
jest.mock("@yext/analytics");
beforeEach(() => {
  jest.spyOn(analyticsLib, "analytics").mockReturnValue({
    report: jest.fn(),
    with: jest.fn(),
  });
  localStorage.clear();
  sessionStorage.clear();
});

const config: HeadlessConfig = {
  botId: "botId",
  apiKey: "apiKey",
};

it("process message with only bot http client", async () => {
  const mockResponses: MessageResponse[] = [
    { message: createMessage("message 1"), notes: {} },
    { message: createMessage("message 2"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 3"), notes: {} },
  ];
  const client = createMockHttpClient(mockResponses);
  const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  const headless = provideChatHeadless(config, { bot: client });

  //process initial message
  await headless.getNextMessage();
  expect(client.getNextMessage).toHaveBeenCalledTimes(1);
  expect(headless.state.conversation.messages.at(-1)).toEqual(
    mockResponses[0].message
  );

  // trigger handoff (failed as there's no next client)
  await headless.getNextMessage("user message 1");
  expect(client.getNextMessage).toHaveBeenCalledTimes(2);
  expect(headless.state.conversation.messages.at(-1)).toEqual(
    mockResponses[1].message
  );
  expect(consoleWarnSpy).toBeCalledTimes(1);
  expect(consoleWarnSpy).toBeCalledWith(
    "No next client available for handoff."
  );

  // continue to process message with current client
  await headless.getNextMessage("user message 2");
  expect(client.getNextMessage).toHaveBeenCalledTimes(3);
  expect(headless.state.conversation.messages.at(-1)).toEqual(
    mockResponses[2].message
  );
});

it("process message with only bot event client", async () => {
  const callbacks: Record<string, any[]> = {};
  const client: ChatEventClient = createMockEventClient(callbacks);

  const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  const headless = provideChatHeadless(config, { bot: client });

  // process message
  await headless.getNextMessage("user message");
  expect(client.processMessage).toHaveBeenCalledTimes(1);
  expect(headless.state.conversation.messages.at(-1)?.text).toEqual(
    "bot message"
  );

  // trigger handoff (failed as there's no next client)
  callbacks["close"]?.forEach((cb) => cb());
  expect(consoleWarnSpy).toBeCalledTimes(1);
  expect(consoleWarnSpy).toBeCalledWith(
    "No next client available for handoff."
  );
});

it("handoff http client between event client", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  const agentClient = createMockEventClient(callbacks);
  const headless = provideChatHeadless(config, {
    bot: botClient,
    agent: agentClient,
  });

  //http client handoff to event client
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.processMessage).toHaveBeenCalledTimes(0);
  expect(agentClient.init).toHaveBeenCalledTimes(1);

  //event client handle next user message
  await headless.getNextMessage("user message 1");
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.processMessage).toHaveBeenCalledTimes(1);

  //event client handoff to http client
  callbacks["close"]?.forEach((cb) => cb());
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.processMessage).toHaveBeenCalledTimes(1);

  //http client handle next user message
  await headless.getNextMessage("user message 2");
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(2);
  expect(agentClient.processMessage).toHaveBeenCalledTimes(1);
});

it("update state on events from event client", async () => {
  const callbacks: Record<string, any[]> = {};
  const client: ChatEventClient = createMockEventClient(callbacks);
  const headless = provideChatHeadless(config, { bot: client });

  callbacks["message"]?.forEach((cb) => cb("new message"));
  expect(headless.state.conversation.messages.at(-1)?.text).toEqual(
    "new message"
  );

  callbacks["typing"]?.forEach((cb) => cb(true));
  expect(headless.state.conversation.isLoading).toBeTruthy();

  callbacks["typing"]?.forEach((cb) => cb(false));
  expect(headless.state.conversation.isLoading).toBeFalsy();
});

it("resets session and uses bot client on reset", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  const agentClient = createMockEventClient(callbacks);
  const headless = provideChatHeadless(config, {
    bot: botClient,
    agent: agentClient,
  });

  // start with bot client, immediately trigger handoff
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.init).toHaveBeenCalledTimes(1);

  // with agent client, get next message
  await headless.getNextMessage();
  expect(agentClient.processMessage).toHaveBeenCalledTimes(1);

  // reset session, switching back to bot client
  headless.restartConversation();
  expect(agentClient.resetSession).toHaveBeenCalledTimes(1);
  expect(agentClient.getSession()).toBeUndefined();

  // with bot client, get next message
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(2);
});

it("update state messages with appropriate source during handoff", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  const agentClient = createMockEventClient(callbacks);
  const headless = provideChatHeadless(config, {
    bot: botClient,
    agent: agentClient,
  });

  //latest message is fromt BOT, then bot client handoff to agent client
  await headless.getNextMessage();
  expect(headless.state.conversation.messages.at(-1)?.source).toEqual(
    MessageSource.BOT
  );

  //agent client handle next user message
  await headless.getNextMessage("user message 1");
  expect(headless.state.conversation.messages.at(-2)?.source).toEqual(
    MessageSource.USER
  );
  expect(headless.state.conversation.messages.at(-1)?.source).toEqual(
    MessageSource.AGENT
  );

  //agent client handoff to bot client
  callbacks["close"]?.forEach((cb) => cb());

  //bot client handle next user message
  await headless.getNextMessage("user message 2");
  expect(headless.state.conversation.messages.at(-1)?.source).toEqual(
    MessageSource.BOT
  );
});

it("reinitializes session using credentials saved in session storage", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  let agentClient = createMockEventClient(callbacks);
  let headless = provideChatHeadless(config, {
    bot: botClient,
    agent: agentClient,
  });

  expect(
    sessionStorage.getItem("yext_chat_handoff_credentials__localhost__botId")
  ).toBeNull();

  // start with bot client, immediately trigger handoff
  await headless.getNextMessage();
  expect(agentClient.init).toHaveBeenCalledTimes(1);
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);

  agentClient = createMockEventClient(callbacks);
  headless = provideChatHeadless(config, {
    bot: botClient,
    agent: agentClient,
  });

  expect(agentClient.init).toHaveBeenCalledTimes(0);
  expect(agentClient.reinitializeSession).toHaveBeenCalledTimes(1);
  expect(agentClient.reinitializeSession).toHaveBeenCalledWith(
    "mock-conversation-id"
  );

  // process the async reinitializeSession
  await jest.runAllTimersAsync();

  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.processMessage).toHaveBeenCalledTimes(1);
});

it("does not reinitialize session if saveToLocalStorage is false", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  let agentClient = createMockEventClient(callbacks);
  const newConfig = { ...config, saveToLocalStorage: false };
  let headless = provideChatHeadless(newConfig, {
    bot: botClient,
    agent: agentClient,
  });

  // start with bot client, immediately trigger handoff
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.init).toHaveBeenCalledTimes(1);

  expect(
    sessionStorage.getItem("yext_chat_handoff_credentials__localhost__botId")
  ).toBeNull();

  agentClient = createMockEventClient(callbacks);
  headless = provideChatHeadless(newConfig, {
    bot: botClient,
    agent: agentClient,
  });

  // agent does not reinitialize, nothing saved to session
  expect(agentClient.reinitializeSession).toHaveBeenCalledTimes(0);

  // bot client is the active client
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(2);
});

it("defaults to bot client if session storage contains invalid data", async () => {
  const botClient = createMockHttpClient([
    { message: createMessage("message 1"), notes: {}, integrationDetails: {} }, //trigger handoff
    { message: createMessage("message 2"), notes: {} },
  ]);
  const callbacks: Record<string, any[]> = {};
  let agentClient = createMockEventClient(callbacks);
  const newConfig = { ...config, saveToLocalStorage: true };
  let headless = provideChatHeadless(newConfig, {
    bot: botClient,
    agent: agentClient,
  });

  // start with bot client, immediately trigger handoff
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(1);
  expect(agentClient.init).toHaveBeenCalledTimes(1);

  // save invalid data to session storage
  sessionStorage.setItem(
    "yext_chat_handoff_credentials__localhost__botId",
    "invalid"
  );

  agentClient = createMockEventClient(callbacks);
  // this call is expected to log an error to console because the handoff credential is invalid
  const originalErrorFn = maskConsoleErrors();
  headless = provideChatHeadless(newConfig, {
    bot: botClient,
    agent: agentClient,
  });
  unmaskConsoleErrors(originalErrorFn);

  // agent does not reinitialize, nothing saved to session
  expect(agentClient.reinitializeSession).toHaveBeenCalledTimes(0);

  // bot client is the active client
  await headless.getNextMessage();
  expect(botClient.getNextMessage).toHaveBeenCalledTimes(2);
});

function createMessage(text: string): Message {
  return {
    text,
    timestamp: "2023-05-15T17:39:58.019Z",
    source: "BOT",
  };
}

function createMockHttpClient(
  mockResponses: MessageResponse[]
): ChatHttpClient {
  let numCalls = 0;
  const client: ChatHttpClient = {
    getNextMessage: jest.fn(async () => {
      const response = mockResponses[numCalls];
      numCalls++;
      return response;
    }),
    streamNextMessage: jest.fn(),
  };
  return client;
}

function createMockEventClient(
  callbacks?: Record<string, any[]>
): ChatEventClient {
  const client: ChatEventClient = {
    init: jest.fn(async () => {
      return Promise.resolve("mock-conversation-id");
    }),
    on: (event, cb) => {
      if (!callbacks) {
        return;
      }
      if (!callbacks[event]) {
        callbacks[event] = [];
      }
      callbacks[event].push(cb);
    },
    processMessage: jest.fn(async () => {
      if (!callbacks) {
        return;
      }
      callbacks["message"]?.forEach((cb) => cb("bot message"));
    }),
    emit: jest.fn(),
    getSession: jest.fn(),
    resetSession: jest.fn(),
    reinitializeSession: jest.fn(),
  };
  return client;
}

function maskConsoleErrors() : (data: any[]) => void {
  const originalFunction = console.error;
  console.error = jest.fn();
  return originalFunction;
}

function unmaskConsoleErrors(originalFunction : (data: any[]) => void) {
  console.error = originalFunction;
}
