import { create } from "zustand";

type ThemeState = {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
};

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("githuv-theme");
  if (stored !== null) return stored === "dark";
  return true;
};

const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem("githuv-theme", next ? "dark" : "light");
      return { isDark: next };
    }),
  setDark: (value) => {
    localStorage.setItem("githuv-theme", value ? "dark" : "light");
    set({ isDark: value });
  },
}));

export default useThemeStore;
