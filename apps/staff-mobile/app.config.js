module.exports = ({ config }) => {
  return {
    ...config,
    // Native build toolchains (Expo prebuild, sharp, EAS Build) require raster PNG format for the app icon.
    // Map SVG icon reference to the generated 1024x1024 PNG asset so builds succeed seamlessly.
    icon:
      config.icon && config.icon.endsWith('.svg')
        ? './assets/images/icon.png'
        : config.icon || './assets/images/icon.png',
  };
};
