"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, FileText, Pin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Note = {
  _id: Id<"adminNotes">;
  title: string;
  content?: string;
  pinned: boolean;
  color: string;
  updatedAt: number;
};

const NOTE_COLORS = [
  "bg-yellow-50 border-yellow-200",
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-pink-50 border-pink-200",
  "bg-purple-50 border-purple-200",
];

export default function NotesPage() {
  const modulesApi = api as any;
  const notes = useQuery(modulesApi.modules.notes.queries.listNotes, {}) as Note[] | undefined;
  const createNote = useMutation(modulesApi.modules.notes.mutations.createNote);
  const updateNote = useMutation(modulesApi.modules.notes.mutations.updateNote);
  const deleteNote = useMutation(modulesApi.modules.notes.mutations.deleteNote);
  const togglePin = useMutation(modulesApi.modules.notes.mutations.togglePin);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<Id<"adminNotes"> | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const openAddDialog = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setShowDialog(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content ?? "");
    setSelectedColor(note.color);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Note title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateNote({ id: editingId, title, content: content || undefined, color: selectedColor });
        toast.success("Note updated");
      } else {
        await createNote({ title, content: content || undefined, color: selectedColor });
        toast.success("Note created");
      }
      setShowDialog(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"adminNotes">) => {
    try {
      await deleteNote({ id });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleTogglePin = async (id: Id<"adminNotes">) => {
    try {
      await togglePin({ id });
    } catch {
      toast.error("Failed to update note");
    }
  };

  const filtered = (notes ?? []).filter(
    (n: Note) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter((n: Note) => n.pinned);
  const unpinned = filtered.filter((n: Note) => !n.pinned);

  const isLoading = notes === undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Keep track of important information and reminders"
        actions={
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        }
      />

      <Input
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Pin className="h-3.5 w-3.5" />
                Pinned
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note as Note}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinned.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Other Notes
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note as Note}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notes found. Create your first note!</p>
            </div>
          )}
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Note" : "New Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
              />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={5}
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 ${color} ${
                      selectedColor === color ? "ring-2 ring-offset-1 ring-primary" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (id: Id<"adminNotes">) => void;
  onTogglePin: (id: Id<"adminNotes">) => void;
}) {
  return (
    <Card className={`border ${note.color} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-start justify-between">
        <CardTitle className="text-sm font-semibold leading-tight flex-1 mr-2">
          {note.title}
        </CardTitle>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onTogglePin(note._id)}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin
              className={`h-3.5 w-3.5 ${note.pinned ? "text-primary fill-primary" : "text-muted-foreground"}`}
            />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(note)}>
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(note._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-4">{note.content}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
