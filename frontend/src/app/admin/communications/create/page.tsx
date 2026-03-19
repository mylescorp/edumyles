"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "students", label: "Students Only" },
  { value: "parents", label: "Parents Only" },
  { value: "staff", label: "Staff Only" },
  { value: "teachers", label: "Teachers Only" },
];

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createAnnouncement = useMutation(api.modules.communications.mutations.createAnnouncement);
  const publishAnnouncement = useMutation(api.modules.communications.mutations.publishAnnouncement);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(searchParams.get("compose") ?? "");
  const [audience, setAudience] = useState("all");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const id = await createAnnouncement({
        title: subject,
        body,
        audience,
        priority: "normal",
        status: "draft",
      });
      await publishAnnouncement({ announcementId: id as any });
      toast.success("Announcement sent successfully.");
      router.push("/admin/communications");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Announcement"
        description="Broadcast a message to selected groups"
        actions={
          <Link href="/admin/communications">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Compose Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g. School Closure Notice"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                placeholder="Type your announcement here…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Send To</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Delivery Channels</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(v) => setSendEmail(!!v)}
                  />
                  <Label htmlFor="sendEmail" className="cursor-pointer">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendSms"
                    checked={sendSms}
                    onCheckedChange={(v) => setSendSms(!!v)}
                  />
                  <Label htmlFor="sendSms" className="cursor-pointer">SMS</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/admin/communications">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Send className="h-4 w-4" />
            {isSubmitting ? "Sending…" : "Send Announcement"}
          </Button>
        </div>
      </form>
    </div>
  );
}
