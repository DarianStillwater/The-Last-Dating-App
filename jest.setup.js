// Pre-define globals that expo/src/winter/runtime.native.ts lazily installs
// via installGlobal(). Without this, the lazy require() calls trigger Jest's
// "import outside scope" sandbox error.

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = { get: () => undefined };
}
