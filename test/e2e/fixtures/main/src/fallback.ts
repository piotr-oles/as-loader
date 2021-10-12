import * as assembly from "./assembly/correct/complex";

async function loadAndRun() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = await (assembly as any).fallback() as typeof assembly;

  const colors = module.getPalette(10);
  console.log(colors.map(color => color.toString()).join(','))
}

loadAndRun();
