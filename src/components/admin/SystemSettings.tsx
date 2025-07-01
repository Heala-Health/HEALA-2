
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertTriangle, Shield, Globe, Users, DollarSign, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  category: string;
  is_active: boolean;
}

export const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: 'system_setting_update',
        target_resource_type_param: 'system_setting',
        target_resource_id_param: null,
        action_details_param: { setting: settingKey, value: newValue }
      });

      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: newValue }
          : setting
      ));

      toast({
        title: "Settings Updated",
        description: `${settingKey} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Globe className="w-4 h-4" />;
      case 'user_management': return <Users className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'notifications': return <Bell className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading) {
    return <div className="p-6">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                {getCategoryIcon(category)}
                <h3 className="font-semibold text-lg capitalize">
                  {category.replace('_', ' ')}
                </h3>
              </div>
              
              {categorySettings.map((setting) => (
                <div key={setting.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={setting.is_active ? "default" : "secondary"}>
                        {setting.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                  
                  {/* Platform Maintenance Mode */}
                  {setting.setting_key === 'platform_maintenance_mode' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              enabled: checked
                            })
                          }
                          disabled={saving}
                        />
                        <span>Maintenance Mode</span>
                        {setting.setting_value.enabled && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      <Input
                        placeholder="Maintenance message"
                        value={setting.setting_value.message || ''}
                        onChange={(e) => 
                          updateSetting(setting.setting_key, {
                            ...setting.setting_value,
                            message: e.target.value
                          })
                        }
                        disabled={saving}
                      />
                    </div>
                  )}

                  {/* User Registration */}
                  {setting.setting_key === 'user_registration_enabled' && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.setting_value.enabled || false}
                        onCheckedChange={(checked) => 
                          updateSetting(setting.setting_key, {
                            ...setting.setting_value,
                            enabled: checked
                          })
                        }
                        disabled={saving}
                      />
                      <span>Allow New User Registration</span>
                    </div>
                  )}

                  {/* Emergency Alert */}
                  {setting.setting_key === 'emergency_alert_enabled' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              enabled: checked
                            })
                          }
                          disabled={saving}
                        />
                        <span>Emergency Alert System</span>
                        <Shield className="w-4 h-4 text-red-500" />
                      </div>
                      <Input
                        placeholder="Emergency alert message"
                        value={setting.setting_value.alert_message || ''}
                        onChange={(e) => 
                          updateSetting(setting.setting_key, {
                            ...setting.setting_value,
                            alert_message: e.target.value
                          })
                        }
                        disabled={saving}
                      />
                    </div>
                  )}

                  {/* Auto Verification Rules */}
                  {setting.setting_key === 'auto_verification_rules' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.physician?.enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              physician: {
                                ...setting.setting_value.physician,
                                enabled: checked
                              }
                            })
                          }
                          disabled={saving}
                        />
                        <span>Auto-approve Physician Verifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.hospital?.enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              hospital: {
                                ...setting.setting_value.hospital,
                                enabled: checked
                              }
                            })
                          }
                          disabled={saving}
                        />
                        <span>Auto-approve Hospital Verifications</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Settings */}
                  {setting.setting_key === 'payment_settings' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Auto-resolve Disputes (days)</label>
                        <Input
                          type="number"
                          value={setting.setting_value.dispute_auto_resolve_days || 30}
                          onChange={(e) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              dispute_auto_resolve_days: parseInt(e.target.value)
                            })
                          }
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Refund Amount (NGN)</label>
                        <Input
                          type="number"
                          value={setting.setting_value.max_refund_amount || 50000}
                          onChange={(e) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              max_refund_amount: parseInt(e.target.value)
                            })
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notification Settings */}
                  {setting.setting_key === 'notification_settings' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.email_enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              email_enabled: checked
                            })
                          }
                          disabled={saving}
                        />
                        <span>Email Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.sms_enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              sms_enabled: checked
                            })
                          }
                          disabled={saving}
                        />
                        <span>SMS Notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.setting_value.push_enabled || false}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, {
                              ...setting.setting_value,
                              push_enabled: checked
                            })
                          }
                          disabled={saving}
                        />
                        <span>Push Notifications</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
