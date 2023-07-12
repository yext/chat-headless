import { TextDecoder, TextEncoder } from "util";

/**
 * jest's jsdom doesn't have the following properties defined in global for the DOM.
 * polyfill it with functions from NodeJS. This is to used in Chat Core.
 */
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
