import { create } from "zustand";

type UiState = {
  installDismissed: boolean;
  setInstallDismissed: (v: boolean) => void;
  lightboxUrl: string | null;
  setLightboxUrl: (url: string | null) => void;
  authOpen: boolean;
  authNext: string | null;
  openAuth: (next?: string | null) => void;
  closeAuth: () => void;
  logoutOpen: boolean;
  openLogout: () => void;
  closeLogout: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  installDismissed: false,
  setInstallDismissed: (v) => set({ installDismissed: v }),
  lightboxUrl: null,
  setLightboxUrl: (url) => set({ lightboxUrl: url }),
  authOpen: false,
  authNext: null,
  openAuth: (next = null) => set({ authOpen: true, authNext: next }),
  closeAuth: () => set({ authOpen: false, authNext: null }),
  logoutOpen: false,
  openLogout: () => set({ logoutOpen: true }),
  closeLogout: () => set({ logoutOpen: false }),
}));
