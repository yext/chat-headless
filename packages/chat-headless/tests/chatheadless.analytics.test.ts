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
