import * as fs from 'fs';
import { instantiate } from "as-loader/runtime";

import * as assembly from "./assembly/correct/complex";

async function loadAndRun() {
  const module = await instantiate(
    assembly,
    fs.promises.readFile,
    undefined,
    false
  );

  const {
    __getArray,
    __getString,
    __pin,
    __unpin,
    getPalette,
    Color
  } = module.exports;

  const colorsPtr = __pin(getPalette(10));
  const colorsPtrs = __getArray(colorsPtr);
  const colors = colorsPtrs.map(__pin).map(Color.wrap);

  console.log(colors.map(color => __getString(color.toString())).join(','));

  __unpin(colorsPtr);
}

loadAndRun();
