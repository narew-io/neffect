// ================================================================
// --------------------------- JSON DB ----------------------------
// ================================================================

/**
 * Simple JSON database wrapper for localStorage
 * Provides type-safe CRUD operations with automatic serialization
 */

type DbEventType = "change" | "clear";
type DbListener<T> = (data: T | null) => void;

class JsonDB<T> {
  private key: string;
  private defaultValue: T;
  private listeners: Map<DbEventType, Set<DbListener<T>>> = new Map();

  constructor(key: string, defaultValue: T) {
    this.key = `neffect-db-${key}`;
    this.defaultValue = defaultValue;

    // Bind methods to preserve context
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.update = this.update.bind(this);
    this.clear = this.clear.bind(this);
  }

  /* READ */
  get(): T {
    if (typeof window === "undefined") return this.defaultValue;

    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        return { ...this.defaultValue, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error(`[JsonDB] Failed to read "${this.key}":`, error);
    }

    return this.defaultValue;
  }

  /* WRITE */
  set(data: T): T {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      this.emit("change", data);
    } catch (error) {
      console.error(`[JsonDB] Failed to write "${this.key}":`, error);
    }

    return data;
  }

  /* PARTIAL UPDATE */
  update(partial: Partial<T>): T {
    const current = this.get();
    const updated = { ...current, ...partial };
    return this.set(updated);
  }

  /* DELETE */
  clear(): void {
    try {
      localStorage.removeItem(this.key);
      this.emit("clear", null);
    } catch (error) {
      console.error(`[JsonDB] Failed to clear "${this.key}":`, error);
    }
  }

  /* CHECK IF EXISTS */
  exists(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(this.key) !== null;
  }

  /* SUBSCRIBE TO CHANGES */
  subscribe(event: DbEventType, listener: DbListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit(event: DbEventType, data: T | null): void {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }
}

// ================================================================
// ------------------------ DB INSTANCES --------------------------
// ================================================================

import type { AppSettings, Profile, ProfileSettings } from "~/config/settings";

/* DEFAULT VALUES */
const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  visibleEffects: [],
  previewImageUrl:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
};

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

/* SETTINGS DB */
export const settingsDb = new JsonDB<AppSettings>("settings", DEFAULT_SETTINGS);

// ================================================================
// ----------------------- HELPER FUNCTIONS -----------------------
// ================================================================

/* GET ACTIVE PROFILE */
export function getActiveProfile(): Profile | undefined {
  const settings = settingsDb.get();
  return settings.profiles.find((p) => p.id === settings.activeProfileId);
}

/* GET ACTIVE PROFILE SETTINGS */
export function getActiveProfileSettings(): ProfileSettings {
  const profile = getActiveProfile();
  return profile?.settings || DEFAULT_PROFILE_SETTINGS;
}

/* UPDATE ACTIVE PROFILE SETTINGS */
export function updateActiveProfileSettings(
  profileSettings: Partial<ProfileSettings>
): AppSettings {
  const settings = settingsDb.get();
  const updatedProfiles = settings.profiles.map((profile) => {
    if (profile.id === settings.activeProfileId) {
      return {
        ...profile,
        settings: { ...profile.settings, ...profileSettings },
      };
    }
    return profile;
  });

  return settingsDb.update({ profiles: updatedProfiles });
}

/* UPDATE PROFILE */
export function updateProfile(
  profileId: string,
  updates: Partial<Omit<Profile, "id" | "settings">>
): AppSettings {
  const settings = settingsDb.get();
  const updatedProfiles = settings.profiles.map((profile) => {
    if (profile.id === profileId) {
      return { ...profile, ...updates };
    }
    return profile;
  });

  return settingsDb.update({ profiles: updatedProfiles });
}

/* ADD PROFILE */
export function addProfile(profile: Profile): AppSettings {
  const settings = settingsDb.get();
  return settingsDb.update({
    profiles: [...settings.profiles, profile],
    activeProfileId: profile.id,
  });
}

/* DELETE PROFILE */
export function deleteProfile(profileId: string): AppSettings {
  const settings = settingsDb.get();
  const newProfiles = settings.profiles.filter((p) => p.id !== profileId);
  const newActiveId =
    profileId === settings.activeProfileId
      ? newProfiles[0]?.id || "private"
      : settings.activeProfileId;

  return settingsDb.update({
    profiles: newProfiles,
    activeProfileId: newActiveId,
  });
}

/* SET ACTIVE PROFILE */
export function setActiveProfile(profileId: string): AppSettings {
  return settingsDb.update({ activeProfileId: profileId });
}

/* CHECK IF EFFECT IS VISIBLE */
export function isEffectVisible(effectId: string): boolean {
  const profileSettings = getActiveProfileSettings();
  if (profileSettings.visibleEffects.length === 0) return true;
  return profileSettings.visibleEffects.includes(effectId);
}

/* CREATE NEW PROFILE */
export function createProfile(icon: string, name?: string): Profile {
  const settings = settingsDb.get();
  return {
    id: `profile-${Date.now()}`,
    icon,
    name: name || `Profile ${settings.profiles.length + 1}`,
    settings: { ...DEFAULT_PROFILE_SETTINGS },
  };
}

export { DEFAULT_PROFILE_SETTINGS, DEFAULT_SETTINGS };
export type { AppSettings, Profile, ProfileSettings } from "~/config/settings";
