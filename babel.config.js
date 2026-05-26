// Babel config for the Bloom Expo template.
//
// `babel-preset-expo` is the single preset every Expo project needs: it wires
// the Metro transform, JSX, and — when it detects `react-native-reanimated`
// in the dependency tree (it does: reanimated 4.x + react-native-worklets) —
// it AUTOMATICALLY injects the worklets babel plugin. So no manual
// `react-native-worklets/plugin` entry is required (adding it would double-
// apply and error). Keep this file minimal and let the preset do its job.
//
// Why this file is committed (not generated on the fly): without it, Babel has
// no preset to resolve and Metro can't transform the app. The preset is pinned
// to the SDK-55 line in package.json (`babel-preset-expo: ~55.0.21`) so a clone
// + `npm install` resolves it deterministically and hoists it to the project
// root — never floating to the `latest` (SDK 56) tag.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
