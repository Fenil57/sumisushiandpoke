import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSettings, SiteSettings, PLACEHOLDER_SETTINGS } from '../services/settingsService';

interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  loadError: string | null;
  hasLiveSettings: boolean;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(PLACEHOLDER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLiveSettings, setHasLiveSettings] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getSettings();
      setSettings(data);
      setHasLiveSettings(true);
    } catch (error) {
      setSettings(PLACEHOLDER_SETTINGS);
      setHasLiveSettings(false);
      setLoadError(
        error instanceof Error ? error.message : 'Could not load site settings.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, loadError, hasLiveSettings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
