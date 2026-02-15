import { useState, useEffect, useCallback } from 'react';
import { api, Settings } from '../lib/api';
import { useToast } from './use-toast';

export function useSettings() {
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const loadSettings = useCallback(async () => {
        try {
            const data = await api.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast({
                title: "Error loading settings",
                description: "Could not fetch configuration from server.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const updateSettings = async (section: keyof Settings, value: any) => {
        const newSettings = { ...settings, [section]: value } as Settings;
        setSettings(newSettings);

        try {
            await api.saveSettings(newSettings);
            toast({
                title: "Settings saved",
                description: "Configuration updated successfully."
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({
                title: "Error saving settings",
                description: "Could not update configuration.",
                variant: "destructive"
            });
            // Revert on error? Ideally, yes, but for now simple optimistic UI or just error toast.
            loadSettings(); // Reload to ensure sync
        }
    };

    const resetSettings = async () => {
        setLoading(true);
        try {
            const result = await api.resetSettings();
            setSettings(result.config);
            toast({
                title: "Settings reset",
                description: "Configuration has been restored to defaults."
            });
        } catch (error) {
            console.error('Failed to reset settings:', error);
            toast({
                title: "Error resetting settings",
                description: "Could not restore default configuration.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return { settings, loading, updateSettings, resetSettings, refresh: loadSettings };
}
