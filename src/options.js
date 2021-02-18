/**
 * @param {object} options
 * @returns {string[]}
 */
function mapAscOptionsToArgs(options) {
  const args = [];
  for (const key in options) {
    if (typeof options[key] === "boolean") {
      args.push("--" + key);
    } else if (
      typeof options[key] === "string" ||
      typeof options[key] === "number"
    ) {
      args.push("--" + key, String(options[key]));
    } else if (Array.isArray(options[key])) {
      args.push("--" + key, options[key].join(","));
    } else if (typeof options[key] === "object" && options[key] !== null) {
      args.push(...mapAscOptionsToArgs(options[key]));
    }
  }
  return args;
}

module.exports = { mapAscOptionsToArgs };
