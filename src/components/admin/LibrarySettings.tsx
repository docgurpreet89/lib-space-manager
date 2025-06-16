
import { useState, useEffect } from 'react';
import { supabase, LibrarySettings as LibrarySettingsType } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const LibrarySettings = () => {
  const [settings, setSettings] = useState({
    seat_lock_duration_minutes: '30',
    monthly_rate_default: '50.00',
    seat_change_fee: '5.00',
    library_timings: '9:00 AM - 10:00 PM',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('library_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: { [key: string]: string } = {};
      data?.forEach((setting: LibrarySettingsType) => {
        settingsMap[setting.setting_name] = setting.setting_value;
      });

      setSettings({
        seat_lock_duration_minutes: settingsMap.seat_lock_duration_minutes || '30',
        monthly_rate_default: settingsMap.monthly_rate_default || '50.00',
        seat_change_fee: settingsMap.seat_change_fee || '5.00',
        library_timings: settingsMap.library_timings || '9:00 AM - 10:00 PM',
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load library settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('library_settings')
          .upsert({
            setting_name: key,
            setting_value: value,
          });

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Library settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Settings</CardTitle>
        <CardDescription>
          Configure global library settings and pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="seat_lock_duration">Seat Lock Duration (minutes)</Label>
          <Input
            id="seat_lock_duration"
            type="number"
            value={settings.seat_lock_duration_minutes}
            onChange={(e) => handleInputChange('seat_lock_duration_minutes', e.target.value)}
            placeholder="30"
          />
          <p className="text-sm text-gray-500">
            How long a seat is held while pending approval
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_rate">Default Monthly Rate ($)</Label>
          <Input
            id="monthly_rate"
            type="number"
            step="0.01"
            value={settings.monthly_rate_default}
            onChange={(e) => handleInputChange('monthly_rate_default', e.target.value)}
            placeholder="50.00"
          />
          <p className="text-sm text-gray-500">
            Default monthly subscription rate for library access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="change_fee">Seat Change Fee ($)</Label>
          <Input
            id="change_fee"
            type="number"
            step="0.01"
            value={settings.seat_change_fee}
            onChange={(e) => handleInputChange('seat_change_fee', e.target.value)}
            placeholder="5.00"
          />
          <p className="text-sm text-gray-500">
            Fee charged for changing seat assignments
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="library_timings">Library Timings</Label>
          <Input
            id="library_timings"
            value={settings.library_timings}
            onChange={(e) => handleInputChange('library_timings', e.target.value)}
            placeholder="9:00 AM - 10:00 PM"
          />
          <p className="text-sm text-gray-500">
            Operating hours of the library
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};
