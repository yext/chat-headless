import { provideChatHeadless, HeadlessConfig } from "../src";
import * as AnalyticsLib from "@yext/analytics";

jest.mock("@yext/analytics");
jest.mock("@yext/chat-core");

const config: HeadlessConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};

it("passes though apiKey, env, region from core config to analytics config", () => {
  const chatAnalyticsSpy = jest.spyOn(AnalyticsLib, "analytics");
  provideChatHeadless({
    ...config,
    env: "SANDBOX",
    region: "US",
  });
  expect(chatAnalyticsSpy).toBeCalledTimes(1);
  expect(chatAnalyticsSpy).toBeCalledWith({
    authorizationType: "apiKey",
    authorization: "MY_API_KEY",
    env: "SANDBOX",
    region: "US",
  });
});

it("passes through analytics specific configurations", () => {
  const chatAnalyticsSpy = jest.spyOn(AnalyticsLib, "analytics");
  provideChatHeadless({
    ...config,
    env: "SANDBOX",
    region: "US",
    analyticsConfig: {
      sessionTrackingEnabled: true,
    }
  });
  expect(chatAnalyticsSpy).toBeCalledTimes(1);
  expect(chatAnalyticsSpy).toBeCalledWith({
    authorizationType: "apiKey",
    authorization: "MY_API_KEY",
    env: "SANDBOX",
    region: "US",
    sessionTrackingEnabled: true,
  });
});

it("merges base payload with event specific payload (latter overrides)", () => {
  jest.spyOn(Date.prototype, "toISOString").mockReturnValue("mocked-time");
  const reportSpy = jest.fn();
  jest.spyOn(AnalyticsLib, "analytics").mockImplementation(() => ({
    report: reportSpy,
    with: jest.fn(),
  }));
  const headless = provideChatHeadless({
    ...config,
    analyticsConfig: {
      baseEventPayload: {
        internalUser: true,
        pageUrl: "base-page",
        referrerUrl: "referrer-page",
        visitor: {
          "some-id": "some-method",
        },
        chat: {
          botId: "base-bot-id",
        },
        clientSdk: {
          CHAT_RANDOM_SDK: "0.0.0",
        },
      },
    },
  });
  headless.report({
    action: "CHAT_LINK_CLICK",
    pageUrl: "event-specific-page",
    chat: {
      botId: "event-specific-bot",
    },
  });
  expect(reportSpy).toBeCalledTimes(1);
  expect(reportSpy).toBeCalledWith({
    action: "CHAT_LINK_CLICK",
    timestamp: "mocked-time",
    internalUser: true,
    pageUrl: "event-specific-page",
    referrerUrl: "referrer-page",
    visitor: {
      "some-id": "some-method",
    },
    chat: {
      botId: "event-specific-bot",
    },
    clientSdk: {
      CHAT_CORE: expect.any(String),
      CHAT_HEADLESS: expect.any(String),
      CHAT_RANDOM_SDK: "0.0.0",
    },
  });
});

it("addClientSdk works as expected", () => {
  jest.spyOn(Date.prototype, "toISOString").mockReturnValue("mocked-time");
  const reportSpy = jest.fn();
  jest.spyOn(AnalyticsLib, "analytics").mockImplementation(() => ({
    report: reportSpy,
    with: jest.fn(),
  }));
  const headless = provideChatHeadless({
    ...config,
    analyticsConfig: {
      baseEventPayload: {
        clientSdk: {
          CHAT_RANDOM_SDK: "0.0.0",
        },
      },
    },
  });
  headless.addClientSdk({
    CHAT_NEW_SDK: "1.1.1",
  });
  headless.report({
    action: "CHAT_LINK_CLICK",
  });
  expect(reportSpy).toBeCalledTimes(1);
  expect(reportSpy).toBeCalledWith(
    expect.objectContaining({
      clientSdk: expect.objectContaining({
        CHAT_CORE: expect.any(String),
        CHAT_HEADLESS: expect.any(String),
        CHAT_RANDOM_SDK: "0.0.0",
        CHAT_NEW_SDK: "1.1.1",
      }),
    })
  );
});

it("automatically fills in botId for chat events", () => {
  jest.spyOn(Date.prototype, "toISOString").mockReturnValue("mocked-time");
  const reportSpy = jest.fn();
  jest.spyOn(AnalyticsLib, "analytics").mockImplementation(() => ({
    report: reportSpy,
    with: jest.fn(),
  }));
  const headless = provideChatHeadless({
    ...config,
    analyticsConfig: {
      baseEventPayload: {
        clientSdk: {
          CHAT_RANDOM_SDK: "0.0.0",
        },
      },
    },
  });
  headless.report({
    action: "CHAT_LINK_CLICK",
    chat: {
      conversationId: "my-convo-id",
      responseId: "my-response-id",
    }
  });
  expect(reportSpy).toBeCalledTimes(1);
  expect(reportSpy).toBeCalledWith(
      expect.objectContaining({
        chat: expect.objectContaining({
          botId: config.botId,
          conversationId: "my-convo-id",
          responseId: "my-response-id",
        }),
      })
  );
});
