"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { createBookSchema } from "@shared/validators";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateBookPage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const createBook = useMutation(api.modules.library.mutations.createBook);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    isbn: "",
    title: "",
    author: "",
    category: "",
    quantity: "1",
  });

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const parsed = createBookSchema.safeParse({
      isbn: form.isbn.trim() || undefined,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      quantity: Number(form.quantity),
    });

    if (!parsed.success) {
      setSubmitError(parsed.error.errors[0]?.message ?? "Book details are invalid.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBook(parsed.data);
      router.push("/admin/library/books");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to add book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Book"
        description="Create a real library catalog record"
        actions={
          <Link href="/admin/library/books">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Competency Based Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
                  placeholder="Jane Wanjiru"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={form.isbn}
                  onChange={(event) => setForm((prev) => ({ ...prev, isbn: event.target.value }))}
                  placeholder="9789966123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available copies</span>
                <span className="font-medium">{form.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{form.category || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Book"}
            </Button>
            <Link href="/admin/library/books">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
