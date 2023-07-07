import { HeadlessConfig } from "@yext/chat-headless";
import { updateClientSdk } from "../src/utils/clientSdk";

it("appends lib version to clientSdk", () => {
  const actualConfig = updateClientSdk({
    apiKey: "my-api-key",
    botId: "bot-bot-id",
  });
  const expectedConfig: HeadlessConfig = {
    apiKey: "my-api-key",
    botId: "bot-bot-id",
    analyticsConfig: {
      baseEventPayload: {
        clientSdk: {
          CHAT_HEADLESS_REACT: expect.any(String),
        },
      },
    },
  };
  expect(actualConfig).toEqual(expectedConfig);
});
