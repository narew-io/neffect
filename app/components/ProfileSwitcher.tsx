// ================================================================
// ---------------------- PROFILE SWITCHER ------------------------
// ================================================================

import { useState, type ReactNode } from "react";
import {
    settingsDb,
    updateProfile,
    addProfile,
    deleteProfile,
    setActiveProfile,
    createProfile,
    type Profile,
    type AppSettings
} from "~/utils/db";

/* AVAILABLE ICONS */
const PROFILE_ICONS: { id: string; svg: ReactNode }[] = [
    {
        id: "user",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
    {
        id: "building",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
            </svg>
        ),
    },
    {
        id: "briefcase",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        ),
    },
    {
        id: "star",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
    {
        id: "heart",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
    },
    {
        id: "folder",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        id: "globe",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
    },
    {
        id: "zap",
        svg: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
    },
];

export function getProfileIcon(iconId: string): ReactNode {
    const icon = PROFILE_ICONS.find((i) => i.id === iconId);
    return icon?.svg || PROFILE_ICONS[0].svg;
}

export { PROFILE_ICONS };

interface ProfileSwitcherProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export function ProfileSwitcher({ settings, onSettingsChange }: ProfileSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAddingProfile, setIsAddingProfile] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string>("star");
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>("");

    const activeProfile = settings.profiles.find((p) => p.id === settings.activeProfileId);

    const startEditing = (profile: Profile, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProfileId(profile.id);
        setEditingName(profile.name);
    };

    const saveEditing = () => {
        if (editingProfileId && editingName.trim()) {
            const newSettings = updateProfile(editingProfileId, { name: editingName.trim() });
            onSettingsChange(newSettings);
        }
        setEditingProfileId(null);
        setEditingName("");
    };

    const cancelEditing = () => {
        setEditingProfileId(null);
        setEditingName("");
    };

    const handleSelectProfile = (profileId: string) => {
        const newSettings = setActiveProfile(profileId);
        onSettingsChange(newSettings);
        setIsOpen(false);
    };

    const handleAddProfile = () => {
        const newProfile = createProfile(selectedIcon);
        const newSettings = addProfile(newProfile);

        onSettingsChange(newSettings);
        setIsAddingProfile(false);
        setIsOpen(false);
    };

    const handleEditProfileName = (profileId: string, newName: string) => {
        const newSettings = updateProfile(profileId, { name: newName });
        onSettingsChange(newSettings);
    };

    const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Can't delete if only 1 profile left
        if (settings.profiles.length <= 1) return;

        const newSettings = deleteProfile(profileId);
        onSettingsChange(newSettings);
    };

    return (
        <div className="profile-switcher">
            <button
                type="button"
                className="profile-switcher__trigger"
                onClick={() => setIsOpen(!isOpen)}
                title={activeProfile?.name || "Select Profile"}
            >
                <span className="profile-switcher__icon">
                    {activeProfile && getProfileIcon(activeProfile.icon)}
                </span>
                <svg className="profile-switcher__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div className="profile-switcher__dropdown">
                    <div className="profile-switcher__header">
                        <span>Profiles</span>
                    </div>

                    <div className="profile-switcher__list">
                        {settings.profiles.map((profile) => (
                            <div
                                key={profile.id}
                                className={`profile-switcher__item ${profile.id === settings.activeProfileId ? "profile-switcher__item--active" : ""}`}
                            >
                                <button
                                    type="button"
                                    className="profile-switcher__item-main"
                                    onClick={() => handleSelectProfile(profile.id)}
                                >
                                    <span className="profile-switcher__item-icon">
                                        {getProfileIcon(profile.icon)}
                                    </span>
                                    {editingProfileId === profile.id ? (
                                        <input
                                            type="text"
                                            className="profile-switcher__item-input"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEditing();
                                                if (e.key === "Escape") cancelEditing();
                                            }}
                                            onBlur={saveEditing}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="profile-switcher__item-name">{profile.name}</span>
                                    )}
                                </button>
                                <div className="profile-switcher__item-actions">
                                    {editingProfileId !== profile.id && (
                                        <button
                                            type="button"
                                            className="profile-switcher__item-edit"
                                            onClick={(e) => startEditing(profile, e)}
                                            title="Edit name"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                    )}
                                    {settings.profiles.length > 1 && (
                                        <button
                                            type="button"
                                            className="profile-switcher__item-delete"
                                            onClick={(e) => handleDeleteProfile(profile.id, e)}
                                            title="Delete profile"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isAddingProfile ? (
                        <button
                            type="button"
                            className="profile-switcher__add"
                            onClick={() => setIsAddingProfile(true)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Profile
                        </button>
                    ) : (
                        <div className="profile-switcher__add-form">
                            <p className="profile-switcher__add-label">Choose icon:</p>
                            <div className="profile-switcher__icons">
                                {PROFILE_ICONS.map((icon) => (
                                    <button
                                        key={icon.id}
                                        type="button"
                                        className={`profile-switcher__icon-btn ${selectedIcon === icon.id ? "profile-switcher__icon-btn--active" : ""}`}
                                        onClick={() => setSelectedIcon(icon.id)}
                                    >
                                        {icon.svg}
                                    </button>
                                ))}
                            </div>
                            <div className="profile-switcher__add-actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => setIsAddingProfile(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--primary btn--sm"
                                    onClick={handleAddProfile}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
