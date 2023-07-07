import { ChatHeadless, HeadlessConfig } from "../src";
import * as AnalyticsLib from "@yext/analytics";

jest.mock("@yext/analytics");
jest.mock("@yext/chat-core");

const config: HeadlessConfig = {
  botId: "MY_BOT",
  apiKey: "MY_API_KEY",
};

it("passes though apiKey, env, region from core config to analytics config", () => {
  const chatAnalyticsSpy = jest.spyOn(AnalyticsLib, "provideChatAnalytics");
  new ChatHeadless({
    ...config,
    env: "SANDBOX",
    region: "US",
  });
  expect(chatAnalyticsSpy).toBeCalledTimes(1);
  expect(chatAnalyticsSpy).toBeCalledWith({
    apiKey: "MY_API_KEY",
    env: "SANDBOX",
    region: "US",
  });
});

it("passes through analytics specific configurations", () => {
  const chatAnalyticsSpy = jest.spyOn(AnalyticsLib, "provideChatAnalytics");
  new ChatHeadless({
    ...config,
    env: "SANDBOX",
    region: "US",
    analyticsConfig: {
      endpoint: "http://www.my-endpoint.com",
      sessionTrackingEnabled: true,
    },
  });
  expect(chatAnalyticsSpy).toBeCalledTimes(1);
  expect(chatAnalyticsSpy).toBeCalledWith({
    apiKey: "MY_API_KEY",
    env: "SANDBOX",
    region: "US",
    endpoint: "http://www.my-endpoint.com",
    sessionTrackingEnabled: true,
  });
});

it("merges base payload with event specific payload (latter overrides)", () => {
  jest.spyOn(Date.prototype, "toISOString").mockReturnValue("mocked-time");
  const reportSpy = jest.fn();
  jest.spyOn(AnalyticsLib, "provideChatAnalytics").mockImplementation(() => ({
    report: reportSpy,
  }));
  const headless = new ChatHeadless({
    ...config,
    analyticsConfig: {
      baseEventPayload: {
        internalUser: true,
        pageUrl: "base-page",
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
    internalUser: true,
    pageUrl: "event-specific-page",
    timestamp: "mocked-time",
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
