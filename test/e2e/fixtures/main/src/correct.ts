import { instantiate } from "as-loader/runtime/node";

import * as assembly from "./assembly/correct/simple";

async function loadAndRun() {
  const module = await instantiate(assembly);

  console.log(module.exports.run());
}

loadAndRun();
