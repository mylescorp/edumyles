"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, FileText, Pin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

type Note = {
  id: string;
  title: string;
  content: string;
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
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "School Calendar Reminders",
      content:
        "Term 2 starts April 28. Parent-teacher meeting scheduled for May 10. Sports Day on June 3.",
      pinned: true,
      color: NOTE_COLORS[0],
      updatedAt: Date.now() - 3600000,
    },
    {
      id: "2",
      title: "Budget Notes",
      content:
        "Review Q1 expenditure. Library renovation budget: KES 250,000. Staff training allocation pending approval.",
      pinned: false,
      color: NOTE_COLORS[1],
      updatedAt: Date.now() - 86400000,
    },
  ]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const openAddDialog = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setShowDialog(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Note title is required", variant: "destructive" });
      return;
    }
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? { ...n, title, content, color: selectedColor, updatedAt: Date.now() }
            : n
        )
      );
      toast({ title: "Note updated" });
    } else {
      const note: Note = {
        id: `note-${Date.now()}`,
        title,
        content,
        pinned: false,
        color: selectedColor,
        updatedAt: Date.now(),
      };
      setNotes((prev) => [note, ...prev]);
      toast({ title: "Note created" });
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Note deleted" });
  };

  const handleTogglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

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

      {/* Search */}
      <Input
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {/* Pinned Notes */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
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
                key={note.id}
                note={note}
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

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingNote ? "Update" : "Create Note"}
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
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
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
            onClick={() => onTogglePin(note.id)}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin
              className={`h-3.5 w-3.5 ${note.pinned ? "text-primary fill-primary" : "text-muted-foreground"}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(note)}
          >
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(note.id)}
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
