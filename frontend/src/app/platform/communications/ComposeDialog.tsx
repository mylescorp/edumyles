"use client";

import { useState } from "react";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Mail, Smartphone, Bell, Send, Calendar, Save } from "lucide-react";
import { toast } from "sonner";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MessageType = "broadcast" | "targeted" | "alert" | "campaign";
type Channel = "in_app" | "email" | "sms";

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: "broadcast", label: "Broadcast" },
  { value: "targeted", label: "Targeted" },
  { value: "alert", label: "Alert" },
  { value: "campaign", label: "Campaign" },
];
const PLAN_TIERS = ["starter", "standard", "pro", "enterprise"] as const;

export function ComposeDialog({ open, onOpenChange }: ComposeDialogProps) {
  const { sessionToken } = useAuth();

  // Form state
  const [type, setType] = useState<MessageType>("broadcast");
  const [subject, setSubject] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["in_app"]);
  const [inAppBody, setInAppBody] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [segmentType, setSegmentType] = useState<"all" | "plan" | "tenants">("all");
  const [planTiers, setPlanTiers] = useState<string[]>([]);
  const [tenantIds, setTenantIds] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMessage = useMutation(api.platform.communications.mutations.createPlatformMessage);
  const sendMessageNow = useMutation(api.platform.communications.mutations.sendPlatformMessageNow);
  const scheduleMessage = useMutation(api.platform.communications.mutations.schedulePlatformMessage);

  const toggleChannel = (ch: Channel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const buildSegment = () => {
    if (segmentType === "plan" && planTiers.length > 0) {
      return { planTiers };
    }
    if (segmentType === "tenants" && tenantIds.trim()) {
      return {
        tenantIds: tenantIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    }
    return {};
  };

  const resetForm = () => {
    setType("broadcast");
    setSubject("");
    setChannels(["in_app"]);
    setInAppBody("");
    setEmailBody("");
    setSmsBody("");
    setSegmentType("all");
    setPlanTiers([]);
    setTenantIds("");
    setScheduleEnabled(false);
    setScheduledAt("");
    setError(null);
  };

  const handleSaveAsDraft = async () => {
    if (!sessionToken) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createMessage({
        sessionToken,
        type,
        subject,
        channels: channels as any,
        inAppBody: channels.includes("in_app") ? inAppBody : undefined,
        emailBody: channels.includes("email") ? emailBody : undefined,
        smsBody: channels.includes("sms") ? smsBody : undefined,
        segment: buildSegment(),
        status: "draft",
      });
      toast.success("Message saved as draft.");
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!sessionToken || !scheduledAt) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const messageId = await createMessage({
        sessionToken,
        type,
        subject,
        channels: channels as any,
        inAppBody: channels.includes("in_app") ? inAppBody : undefined,
        emailBody: channels.includes("email") ? emailBody : undefined,
        smsBody: channels.includes("sms") ? smsBody : undefined,
        segment: buildSegment(),
        status: "draft",
      });
      await scheduleMessage({
        sessionToken,
        messageId,
        scheduledAt: new Date(scheduledAt).getTime(),
      });
      toast.success("Message scheduled.");
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to schedule message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNow = async () => {
    if (!sessionToken) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const messageId = await createMessage({
        sessionToken,
        type,
        subject,
        channels: channels as any,
        inAppBody: channels.includes("in_app") ? inAppBody : undefined,
        emailBody: channels.includes("email") ? emailBody : undefined,
        smsBody: channels.includes("sms") ? smsBody : undefined,
        segment: buildSegment(),
        status: "draft",
      });
      await sendMessageNow({ sessionToken, messageId });
      toast.success("Message sent.");
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose New Message</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Type */}
          <div className="grid gap-2">
            <Label>Message Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MessageType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Channels */}
          <div className="grid gap-2">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.includes("in_app")}
                  onCheckedChange={() => toggleChannel("in_app")}
                />
                <Bell className="h-4 w-4" />
                <span className="text-sm">In-App</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.includes("email")}
                  onCheckedChange={() => toggleChannel("email")}
                />
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={channels.includes("sms")}
                  onCheckedChange={() => toggleChannel("sms")}
                />
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>

          {/* Channel Bodies */}
          {channels.includes("in_app") && (
            <div className="grid gap-2">
              <Label htmlFor="inapp-body">
                <Bell className="h-4 w-4 inline mr-1" />
                In-App Body
              </Label>
              <Textarea
                id="inapp-body"
                placeholder="In-app notification text"
                rows={3}
                value={inAppBody}
                onChange={(e) => setInAppBody(e.target.value)}
              />
            </div>
          )}
          {channels.includes("email") && (
            <div className="grid gap-2">
              <Label htmlFor="email-body">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Body
              </Label>
              <Textarea
                id="email-body"
                placeholder="Email message body"
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          )}
          {channels.includes("sms") && (
            <div className="grid gap-2">
              <Label htmlFor="sms-body">
                <Smartphone className="h-4 w-4 inline mr-1" />
                SMS Body
              </Label>
              <Textarea
                id="sms-body"
                placeholder="SMS text (keep under 160 characters)"
                rows={2}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
              />
            </div>
          )}

          {/* Segment */}
          <div className="grid gap-2">
            <Label>Target Audience</Label>
            <Select value={segmentType} onValueChange={(v) => setSegmentType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="plan">Specific Plan Tier</SelectItem>
                <SelectItem value="tenants">Specific Tenants</SelectItem>
              </SelectContent>
            </Select>

            {segmentType === "plan" && (
              <div className="flex flex-wrap gap-3 pt-1">
                {PLAN_TIERS.map((tier) => (
                  <label key={tier} className="flex items-center gap-2 cursor-pointer capitalize">
                    <Checkbox
                      checked={planTiers.includes(tier)}
                      onCheckedChange={(checked) =>
                        setPlanTiers((prev) =>
                          checked ? [...prev, tier] : prev.filter((t) => t !== tier)
                        )
                      }
                    />
                    <span className="text-sm capitalize">{tier}</span>
                  </label>
                ))}
              </div>
            )}

            {segmentType === "tenants" && (
              <Input
                placeholder="Comma-separated tenant IDs"
                value={tenantIds}
                onChange={(e) => setTenantIds(e.target.value)}
              />
            )}
          </div>

          {/* Schedule toggle */}
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
                id="schedule-toggle"
              />
              <Label htmlFor="schedule-toggle" className="cursor-pointer">
                Schedule for later
              </Label>
            </div>
            {scheduleEnabled && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveAsDraft} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-1" />
            Save Draft
          </Button>
          {scheduleEnabled ? (
            <Button onClick={handleSchedule} disabled={isSubmitting || !scheduledAt}>
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          ) : (
            <Button onClick={handleSendNow} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-1" />
              Send Now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
