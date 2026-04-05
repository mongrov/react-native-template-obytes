import type TranslateOptions from 'i18next';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback, useSyncExternalStore } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';

import RNRestart from 'react-native-restart';
import { storage } from '../storage';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = () => storage.getString(LOCAL);

export const translate = memoize(
  (key: TxKeyPath, options = undefined) =>
    i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) =>
    options ? key + JSON.stringify(options) : key,
);

export function changeLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  if (lang === 'ar') {
    I18nManager.forceRTL(true);
  }
  else {
    I18nManager.forceRTL(false);
  }
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (__DEV__)
      NativeModules.DevSettings.reload();
    else RNRestart.restart();
  }
  else if (Platform.OS === 'web') {
    window.location.reload();
  }
}

// Simple external store for language state
let langListeners: Array<() => void> = [];

function subscribeLang(listener: () => void) {
  langListeners.push(listener);
  return () => {
    langListeners = langListeners.filter(l => l !== listener);
  };
}

function getLangSnapshot(): string | undefined {
  return storage.getString(LOCAL);
}

function emitLangChange() {
  for (const listener of langListeners) {
    listener();
  }
}

export function useSelectedLanguage() {
  const language = useSyncExternalStore(subscribeLang, getLangSnapshot, getLangSnapshot);

  const setLanguage = useCallback(
    (lang: Language) => {
      storage.set(LOCAL, lang);
      emitLangChange();
      if (lang !== undefined)
        changeLanguage(lang as Language);
    },
    [],
  );

  return { language: language as Language, setLanguage };
}
