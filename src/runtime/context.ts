// eslint-disable-next-line
const context: any =
  (typeof self === "object" && self.self === self && self) ||
  (typeof global === "object" && global.global === global && global) ||
  this;

export { context };
