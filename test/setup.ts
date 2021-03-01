import { TextDecoder } from "util";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line node/no-unsupported-features/node-builtins
global.TextDecoder = TextDecoder; // @assemblyscript/loader expects global TextDecoder - it's not global in Node 10
