import * as fs from "fs";
import { instantiate } from "@assemblyscript/loader";

import * as assembly from "./assembly/broken/simple";

async function loadAndRun() {
  const module = await instantiate<typeof assembly>(
    fs.promises.readFile((assembly as unknown) as string)
  );

  console.log(module.exports.run());
}

loadAndRun();
