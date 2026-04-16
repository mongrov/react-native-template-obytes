/**
 * Custom font assets (Cabinet Grotesk + Epilogue) aligned with root `theme.ts` PostScript names.
 * Loaded at runtime via `useFonts`; paths are also listed in `app.config.ts` for native prebuild.
 */
export const luminxFontSources = {
  'Cabinet Grotesk': require('../../assets/fonts/CabinetGrotesk-Regular.otf'),
  'Cabinet Grotesk Thin': require('../../assets/fonts/CabinetGrotesk-Thin.otf'),
  'Cabinet Grotesk Extralight': require('../../assets/fonts/CabinetGrotesk-Extralight.otf'),
  'Cabinet Grotesk Light': require('../../assets/fonts/CabinetGrotesk-Light.otf'),
  'Cabinet Grotesk Medium': require('../../assets/fonts/CabinetGrotesk-Medium.otf'),
  'Cabinet Grotesk Bold': require('../../assets/fonts/CabinetGrotesk-Bold.otf'),
  'Cabinet Grotesk Extrabold': require('../../assets/fonts/CabinetGrotesk-Extrabold.otf'),
  'Cabinet Grotesk Black': require('../../assets/fonts/CabinetGrotesk-Black.otf'),
  'Epilogue': require('../../assets/fonts/Epilogue-Regular.otf'),
  'Epilogue Thin': require('../../assets/fonts/Epilogue-Thin.otf'),
  'Epilogue Thin Italic': require('../../assets/fonts/Epilogue-ThinItalic.otf'),
  'Epilogue ExtraLight': require('../../assets/fonts/Epilogue-ExtraLight.otf'),
  'Epilogue ExtraLight Italic': require('../../assets/fonts/Epilogue-ExtraLightItalic.otf'),
  'Epilogue Light': require('../../assets/fonts/Epilogue-Light.otf'),
  'Epilogue Light Italic': require('../../assets/fonts/Epilogue-LightItalic.otf'),
  'Epilogue Medium': require('../../assets/fonts/Epilogue-Medium.otf'),
  'Epilogue Medium Italic': require('../../assets/fonts/Epilogue-MediumItalic.otf'),
  'Epilogue SemiBold': require('../../assets/fonts/Epilogue-SemiBold.otf'),
  'Epilogue SemiBold Italic': require('../../assets/fonts/Epilogue-SemiBoldItalic.otf'),
  'Epilogue Bold': require('../../assets/fonts/Epilogue-Bold.otf'),
  'Epilogue Bold Italic': require('../../assets/fonts/Epilogue-BoldItalic.otf'),
  'Epilogue ExtraBold': require('../../assets/fonts/Epilogue-ExtraBold.otf'),
  'Epilogue ExtraBold Italic': require('../../assets/fonts/Epilogue-ExtraBoldItalic.otf'),
  'Epilogue Black': require('../../assets/fonts/Epilogue-Black.otf'),
  'Epilogue Black Italic': require('../../assets/fonts/Epilogue-BlackItalic.otf'),
  'Epilogue Italic': require('../../assets/fonts/Epilogue-Italic.otf'),
} as const;
