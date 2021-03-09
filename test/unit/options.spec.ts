import { mapAscOptionsToArgs } from "../../loader/options";

describe("options", () => {
  it.each([
    [{}, []],
    [{ optimizeLevel: 3 }, ["--optimizeLevel", "3"]],
    [{ coverage: true }, ["--coverage"]],
    [{ coverage: false }, []],
    [{ runtime: "half" }, ["--runtime", "half"]],
    [{ enable: ["bulk-memory", "simd"] }, ["--enable", "bulk-memory,simd"]],
    [
      {
        optimizeLevel: 2,
        shrinkLevel: 1,
        noValidate: true,
        sharedMemory: false,
        disable: ["mutable-globals"],
      },
      [
        "--optimizeLevel",
        "2",
        "--shrinkLevel",
        "1",
        "--noValidate",
        "--disable",
        "mutable-globals",
      ],
    ],
  ])("maps options %p to args %p", (options, args) => {
    expect(mapAscOptionsToArgs(options)).toEqual(args);
  });
});
