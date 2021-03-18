import * as fs from 'fs';
import { instantiate, RETURN_TYPES } from "as-loader/runtime/bind";

import * as assembly from "./assembly/correct/bind";

async function loadAndRun() {
  const module = await instantiate(
    assembly,
    fs.promises.readFile,
    undefined,
    false
  );

  const { hello } = module.exports;
  hello.returnType = RETURN_TYPES.STRING;

  console.log(hello('world'));
}

loadAndRun();
