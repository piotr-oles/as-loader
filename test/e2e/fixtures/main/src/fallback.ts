import * as assembly from "./assembly/correct/simple";

async function loadAndRun() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = await (assembly as any).fallback() as typeof assembly;

  console.log(module.run());
}

loadAndRun();
