"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type NotificationSetting = {
  key: string;
  enabled: boolean;
  channels: string[];
  frequencyDays?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
};

type NotificationDefinition = {
  key: string;
  label: string;
  description: string;
  defaultChannels: string[];
  canDisable: boolean;
  hasFrequency?: boolean;
};

type Props = {
  definitions: NotificationDefinition[];
  value: NotificationSetting[];
  onChange: (next: NotificationSetting[]) => void;
};

const CHANNELS = ["in_app", "email", "sms"];

export function ModuleNotificationSettings({ definitions, value, onChange }: Props) {
  function updateSetting(key: string, patch: Partial<NotificationSetting>) {
    onChange(value.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  return (
    <div className="space-y-4">
      {definitions.map((definition) => {
        const setting =
          value.find((entry) => entry.key === definition.key) ?? {
            key: definition.key,
            enabled: true,
            channels: definition.defaultChannels,
          };

        return (
          <Card key={definition.key}>
            <CardHeader>
              <CardTitle className="text-base">{definition.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{definition.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch
                  checked={setting.enabled}
                  disabled={!definition.canDisable}
                  onCheckedChange={(checked) => updateSetting(definition.key, { enabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-4">
                  {CHANNELS.map((channel) => (
                    <label key={channel} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={setting.channels.includes(channel)}
                        onCheckedChange={(checked) =>
                          updateSetting(definition.key, {
                            channels: checked
                              ? [...new Set([...setting.channels, channel])]
                              : setting.channels.filter((entry) => entry !== channel),
                          })
                        }
                      />
                      {channel.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
              {definition.hasFrequency ? (
                <div className="space-y-2">
                  <Label>Frequency (days)</Label>
                  <Input
                    type="number"
                    value={String(setting.frequencyDays ?? 1)}
                    onChange={(event) =>
                      updateSetting(definition.key, {
                        frequencyDays: Number(event.target.value),
                      })
                    }
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
