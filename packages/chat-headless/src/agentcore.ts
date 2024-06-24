/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageRequest } from "@yext/chat-core";
import { MessageResponse } from "@yext/chat-core";
import "amazon-connect-chatjs"
import { ChatClient } from "./models";
import { ChatEventClient } from "./models/ChatClient";


export class ChatCoreAwsConnect implements ChatEventClient {

  private session: any;
  private eventListeners: Record<string, EventListener[]> = {};

  //return whether the init is successful
  async init(messageResponse: MessageResponse): Promise<void> {
    if (this.session) {
      return;
    }
    // @ts-ignore
    const chatSession = connect.ChatSession
    console.log("Initializing AWS Connect chat session...")
    chatSession.setGlobalConfig({
      loggerConfig: {
        // There are five levels available - DEBUG, INFO, WARN, ERROR, ADVANCED_LOG. Default is INFO
        level: chatSession.LogLevel.DEBUG,
        // Choose if you want to use the default logger
        useDefaultLogger: true,
      },
      region: "us-east-1", // optional, defaults to: "us-west-2"
      //Control switch for enabling/disabling message-receipts (Read/Delivered) for messages
      //message receipts use sendEvent API for sending Read/Delivered events https://docs.aws.amazon.com/connect-participant/latest/APIReference/API_SendEvent.html
      features: {
        messageReceipts: {
          shouldSendMessageReceipts: true, // DEFAULT: true, set to false to disable Read/Delivered receipts
          throttleTime: 5000, //default throttle time - time to wait before sending Read/Delivered receipt.
        },
      },
    })
    const connectionCreds = messageResponse.integrationDetails?.awsConnectHandoff?.credentials;
    if (!connectionCreds) {
      throw new Error("Missing AWS Connect credentials");
    }
    console.log("Connection creds", connectionCreds);
    this.session = chatSession.create({
      chatDetails: {
        contactId: connectionCreds.contactId,
        participantId: connectionCreds.participantId,
        participantToken: connectionCreds.participantToken,
      },
      options: {
        // optional
        region: "us-east-1", // optional, defaults to `region` set in `connect.ChatSession.setGlobalConfig()`
      },
      type: "CUSTOMER", // REQUIRED
    });
    const { connectCalled, connectSuccess } = await this.session.connect();
    if (!connectCalled || !connectSuccess) {
      throw new Error("Failed to connect to chat session");
    }
    console.log("Connected to chat session");
    this.setupEventListeners();
    this.session.sendMessage({
      contentType: "text/plain",
      // @ts-ignore
      message: messageResponse.notes['conversationSummary'],
    });
    return;
  }

  on(eventName: string, cb: EventListener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(cb);
  }

  emit(eventName: string, _data: any) {
    switch (eventName) {
      case "typing":
        this.session.sendEvent({
          contentType: "application/vnd.amazonaws.connect.event.typing",
        });
        break;
      default:
        console.log("Unhandled event", eventName);
    }
  }

  private setupEventListeners() {
    this.session.onMessage((event: any) => {
      const { data } = event;
      switch (data.ContentType) {
        case "text/plain":
          if (data.ParticipantRole === "AGENT" || data.ParticipantRole === "SYSTEM") {
            this.eventListeners["message"]?.forEach(cb => cb(data.Content));
          }
          break;
        default:
          console.log("Unhandled message type", data.ContentType);
      }
    });

    this.session.onTyping((event: any) => {
      const { data } = event;
      if (data.ParticipantRole === "AGENT") {
        switch (data.ContentType) {
          case "application/vnd.amazonaws.connect.event.typing":
            this.eventListeners["typing"]?.forEach(cb => cb(true));
            break;
          case "application/vnd.amazonaws.connect.event.typing-off":
            this.eventListeners["typing"]?.forEach(cb => cb(false));
            break;
        }
      }
    });

    this.session.onEnded((event: any) => {
      const { data } = event;
      this.eventListeners["close/handoff"]?.forEach(cb => cb(data));
    })
  }

  async processMessage(request: MessageRequest) {
    return this.session.sendMessage({
      contentType: "text/plain",
      message: request.messages.at(-1)?.text,
    });
  }

  //optional? if stream is not supported for a specific core, then default to processMessage
  // async processMessageStream(request: MessageRequest) {
  //   return this.session.sendMessage({
  //     contentType: "text/plain",
  //     message: request.messages.at(-1)?.text,
  //   });
  // }

  getSession() {
    return this.session;
  }
}

type EventListener = (data: any) => void;

export interface ResponderConfig {
  handler: ChatClient,
  nextResponder?: string,
}

export interface IntegrationConfig {
  responders: Record<string, ResponderConfig>
}
