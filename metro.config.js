const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force Metro to resolve Zustand as a CommonJS module
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "zustand") {
    return context.resolveRequest(context, "zustand/index.js", platform);
  }
  if (moduleName.startsWith("zustand/")) {
    const subpath = moduleName.substring("zustand/".length);
    if (!subpath.endsWith(".js") && !subpath.endsWith(".json")) {
      return context.resolveRequest(context, `zustand/${subpath}.js`, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
