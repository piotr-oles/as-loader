async function load() {
  const assembly = await import("./assembly/correct/simple");
  console.log(assembly);
}

load();
