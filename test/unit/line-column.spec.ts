import { getLineColumnFromIndex } from "../../loader/line-column";

const AS_SOURCE = [
  "export function add(a: i32, b: i32): i32 {",
  "  return a + b;",
  "}",
  "",
].join("\n");

describe("line-column", () => {
  it.each([
    [0, AS_SOURCE, 1, 1],
    [10, AS_SOURCE, 1, 11],
    [42, AS_SOURCE, 1, 43],
    [43, AS_SOURCE, 2, 1],
    [45, AS_SOURCE, 2, 3],
    [58, AS_SOURCE, 2, 16],
    [59, AS_SOURCE, 3, 1],
    [60, AS_SOURCE, 3, 2],
  ])(
    "get line and column for index %p in %p",
    (index, source, line, column) => {
      expect(getLineColumnFromIndex(source, index)).toEqual({ line, column });
    }
  );

  it.each([
    [-1, AS_SOURCE],
    [10000, AS_SOURCE],
    [NaN, AS_SOURCE],
  ])("returns undefined for invalid index %p in %p", (index, source) => {
    expect(getLineColumnFromIndex(source, index)).toBeUndefined();
  });
});
