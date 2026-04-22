"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PmProjectRail } from "@/components/platform/PmProjectRail";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { toast } from "sonner";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [memberId, setMemberId] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const updateProject = useMutation(api.modules.pm.projects.updateProject);
  const manageProjectMembers = useMutation(api.modules.pm.projects.manageProjectMembers);
  const shareProject = useMutation(api.modules.pm.projects.shareProject);
  const archiveProject = useMutation(api.modules.pm.projects.archiveProject);
  const deleteProject = useMutation(api.modules.pm.projects.deleteProject);

  if (authLoading || (sessionToken && project === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }
  if (!sessionToken || !project) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} Settings`}
        description="General settings, members, integrations, and high-risk controls for this PM project."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
          { label: project.name, href: `/platform/pm/${workspaceSlug}/${projectId}` },
          { label: "Settings" },
        ]}
        actions={
          <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
            <Button variant="outline">Back to Board</Button>
          </Link>
        }
      />

      <PmProjectRail workspaceSlug={workspaceSlug} projectId={projectId} currentHref={`/platform/pm/${workspaceSlug}/${projectId}/settings`} />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Project name" defaultValue={project.name} onSave={(value) => updateProject({ sessionToken, projectId: project._id, name: value } as any)} />
              <Field label="Description" textarea defaultValue={project.description} onSave={(value) => updateProject({ sessionToken, projectId: project._id, description: value } as any)} />
              <Field label="GitHub repository" defaultValue={project.githubRepo ?? ""} onSave={(value) => updateProject({ sessionToken, projectId: project._id, githubRepo: value } as any)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="user id" />
                <Button
                  onClick={async () => {
                    try {
                      await manageProjectMembers({
                        sessionToken,
                        projectId: project._id,
                        action: "add",
                        memberIds: [memberId],
                      } as any);
                      setMemberId("");
                      toast.success("Member added.");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to add member.");
                    }
                  }}
                >
                  Add Member
                </Button>
              </div>
              <div className="space-y-2">
                {(project.memberIds ?? []).map((entry: string) => (
                  <div key={entry} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <span className="text-sm">{entry}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await manageProjectMembers({
                            sessionToken,
                            projectId: project._id,
                            action: "remove",
                            memberIds: [entry],
                          } as any);
                          toast.success("Member removed.");
                          router.refresh();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to remove member.");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Share this project</Label>
                <Input value={shareUserId} onChange={(event) => setShareUserId(event.target.value)} placeholder="user id" />
                <Textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} placeholder="Optional message" />
                <Button
                  onClick={async () => {
                    try {
                      await shareProject({
                        sessionToken,
                        projectId: project._id,
                        sharedWithUserId: shareUserId,
                        accessLevel: "comment",
                        message: shareMessage,
                      } as any);
                      toast.success("Project shared.");
                      setShareUserId("");
                      setShareMessage("");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to share project.");
                    }
                  }}
                >
                  Share Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium">Archive project</p>
                <p className="mt-1 text-sm text-muted-foreground">Hide this project from active PM views without deleting it.</p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await archiveProject({ sessionToken, projectId: project._id } as any);
                      toast.success("Project archived.");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to archive project.");
                    }
                  }}
                >
                  Archive Project
                </Button>
              </div>

              <div className="rounded-2xl border border-red-200 p-4">
                <p className="font-medium text-red-700">Delete project</p>
                <p className="mt-1 text-sm text-muted-foreground">Soft-delete this project and remove it from active PM access.</p>
                <Textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Reason for deletion" className="mt-3" />
                <Button
                  className="mt-3"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteProject({
                        sessionToken,
                        projectId: project._id,
                        reason: deleteReason || "Removed from PM",
                      } as any);
                      toast.success("Project deleted.");
                      router.push(`/platform/pm/${workspaceSlug}`);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to delete project.");
                    }
                  }}
                >
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  textarea,
  onSave,
}: {
  label: string;
  defaultValue: string;
  textarea?: boolean;
  onSave: (value: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(event) => setValue(event.target.value)} />
      ) : (
        <Input value={value} onChange={(event) => setValue(event.target.value)} />
      )}
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await onSave(value);
            toast.success(`${label} updated.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to update ${label.toLowerCase()}.`);
          }
        }}
      >
        Save {label}
      </Button>
    </div>
  );
}
