async function loadAndRun() {
  const assembly = await import("./assembly/correct/simple");

  console.log(assembly.run());
}

loadAndRun();
