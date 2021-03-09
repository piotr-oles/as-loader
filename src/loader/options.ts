type Options = Record<string, string | number | boolean | null | string[]>;

function mapAscOptionsToArgs(options: Options): string[] {
  const args = [];
  const keys = Object.keys(options);

  for (const key of keys) {
    const value = options[key];

    if (typeof value === "boolean") {
      if (value) {
        // add flag only if value is true
        args.push("--" + key);
      }
    } else if (typeof value === "string" || typeof value === "number") {
      args.push("--" + key, String(value));
    } else if (Array.isArray(value)) {
      args.push("--" + key, value.join(","));
    }
  }

  return args;
}

export { mapAscOptionsToArgs };
