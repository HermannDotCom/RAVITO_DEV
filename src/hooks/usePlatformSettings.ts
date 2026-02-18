import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PlatformSettings {
  guide_client_enabled: boolean;
  guide_supplier_enabled: boolean;
  guide_admin_enabled: boolean;
}

const DEFAULTS: PlatformSettings = {
  guide_client_enabled: true,
  guide_supplier_enabled: true,
  guide_admin_enabled: true,
};

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error || !data) {
      setLoading(false);
      return;
    }

    const parsed: Partial<PlatformSettings> = {};
    for (const row of data) {
      if (row.key in DEFAULTS) {
        (parsed as any)[row.key] = row.value;
      }
    }

    setSettings({ ...DEFAULTS, ...parsed });
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof PlatformSettings, value: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      console.error('Error updating platform setting:', error);
      return false;
    }

    setSettings(prev => ({ ...prev, [key]: value }));
    return true;
  };

  return { settings, loading, updateSetting, refetch: fetchSettings };
};
