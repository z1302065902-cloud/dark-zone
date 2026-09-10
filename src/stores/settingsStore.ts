import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setLang } from '../utils/i18n';

export interface SettingsState {
  /** Master volume 0..1 */
  masterVolume: number;
  /** Mouse sensitivity multiplier (1 = default) */
  sensitivity: number;
  /** Language */
  lang: 'zh' | 'en';
  setMasterVolume: (v: number) => void;
  setSensitivity: (v: number) => void;
  setLang: (l: 'zh' | 'en') => void;
}

export const settingsKey = 'dark-zone-settings';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      masterVolume: 0.8,
      sensitivity: 1.0,
      lang: 'zh',
      setMasterVolume: (v) => set({ masterVolume: Math.max(0, Math.min(1, v)) }),
      setSensitivity: (v) => set({ sensitivity: Math.max(0.2, Math.min(3, v)) }),
      setLang: (l) => {
        setLang(l); // sync module-level i18n
        set({ lang: l });
      },
    }),
    {
      name: settingsKey,
      partialize: (s) => ({ masterVolume: s.masterVolume, sensitivity: s.sensitivity, lang: s.lang }),
    }
  )
);

// Apply persisted language on module load (i18n module var is not persisted)
const initial = useSettingsStore.getState();
if (initial.lang) {
  try { setLang(initial.lang); } catch { /* noop */ }
}
