interface AsLoaderModuleURL<TModule> extends String {
  fallback?(): Promise<TModule>;
}

export { AsLoaderModuleURL };
