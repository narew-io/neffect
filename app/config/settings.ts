// ================================================================
// ------------------------ APP SETTINGS --------------------------
// ================================================================

/* PROFILE SETTINGS - each profile has its own settings */
export interface ProfileSettings {
  visibleEffects: string[];
  previewImageUrl: string;
}

export interface Profile {
  id: string;
  icon: string;
  name: string;
  settings: ProfileSettings;
}

export interface AppSettings {
  profiles: Profile[];
  activeProfileId: string;
}

const STORAGE_KEY = "neffect-settings";

/* DEFAULT PROFILE SETTINGS */
const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  visibleEffects: [], // Empty = show all
  previewImageUrl:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
};

/* DEFAULT PROFILES */
const DEFAULT_PROFILES: Profile[] = [
  {
    id: "private",
    icon: "user",
    name: "Private",
    settings: { ...DEFAULT_PROFILE_SETTINGS },
  },
  {
    id: "organization",
    icon: "building",
    name: "Organization",
    settings: { ...DEFAULT_PROFILE_SETTINGS },
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  profiles: DEFAULT_PROFILES,
  activeProfileId: "private",
};

export { DEFAULT_PROFILE_SETTINGS };

/* LOAD SETTINGS */
export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  return DEFAULT_SETTINGS;
}

/* SAVE SETTINGS */
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const updated = { ...current, ...settings };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }

  return updated;
}

/* RESET SETTINGS */
export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset settings:", error);
  }

  return DEFAULT_SETTINGS;
}

/* GET ACTIVE PROFILE */
export function getActiveProfile(settings: AppSettings): Profile | undefined {
  return settings.profiles.find((p) => p.id === settings.activeProfileId);
}

/* GET ACTIVE PROFILE SETTINGS */
export function getActiveProfileSettings(
  settings: AppSettings
): ProfileSettings {
  const profile = getActiveProfile(settings);
  return profile?.settings || DEFAULT_PROFILE_SETTINGS;
}

/* UPDATE ACTIVE PROFILE SETTINGS */
export function updateActiveProfileSettings(
  appSettings: AppSettings,
  profileSettings: Partial<ProfileSettings>
): AppSettings {
  const updatedProfiles = appSettings.profiles.map((profile) => {
    if (profile.id === appSettings.activeProfileId) {
      return {
        ...profile,
        settings: { ...profile.settings, ...profileSettings },
      };
    }
    return profile;
  });

  return saveSettings({ profiles: updatedProfiles });
}

/* UPDATE PROFILE */
export function updateProfile(
  appSettings: AppSettings,
  profileId: string,
  updates: Partial<Omit<Profile, "id" | "settings">>
): AppSettings {
  const updatedProfiles = appSettings.profiles.map((profile) => {
    if (profile.id === profileId) {
      return { ...profile, ...updates };
    }
    return profile;
  });

  return saveSettings({ profiles: updatedProfiles });
}

/* CHECK IF EFFECT IS VISIBLE */
export function isEffectVisible(
  effectId: string,
  settings: AppSettings
): boolean {
  const profileSettings = getActiveProfileSettings(settings);
  if (profileSettings.visibleEffects.length === 0) return true;
  return profileSettings.visibleEffects.includes(effectId);
}
