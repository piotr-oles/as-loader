import * as fs from 'fs';
import { instantiate } from "as-loader/runtime/bind";

import * as assembly from "./assembly/correct/bind";

async function loadAndRun() {
  const module = await instantiate(
    assembly,
    fs.promises.readFile
  );

  const { hello } = module.exports;

  console.log(hello('world'));
}

loadAndRun();
