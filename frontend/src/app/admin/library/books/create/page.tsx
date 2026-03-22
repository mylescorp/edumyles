"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function CreateBookPage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const createBook = useMutation(api.modules.library.mutations.createBook);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    category: "",
    description: "",
    quantity: 1,
    location: "",
    language: "English",
    publicationYear: "",
    pages: "",
    edition: "",
  });

  const categories = [
    "Fiction", "Non-Fiction", "Science", "Mathematics", "History", 
    "Literature", "Geography", "Religion", "Technology", "Arts", "Sports",
    "Reference", "Biography", "Children", "Young Adult", "Other"
  ];

  const languages = [
    "English", "Swahili", "French", "Arabic", "Other"
  ];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.category) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createBook({
        isbn: formData.isbn || undefined,
        title: formData.title,
        author: formData.author,
        category: formData.category,
        quantity: formData.quantity,
      });
      router.push("/admin/library/books");
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to add book");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Book"
        description="Add a new book to the library catalog"
        actions={
          <Link href="/admin/library/books">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter book title"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => handleInputChange("author", e.target.value)}
                      placeholder="Enter author name"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => handleInputChange("isbn", e.target.value)}
                      placeholder="978-0-00-000000-0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter book description"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => handleInputChange("publisher", e.target.value)}
                      placeholder="Enter publisher name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicationYear">Publication Year</Label>
                    <Input
                      id="publicationYear"
                      value={formData.publicationYear}
                      onChange={(e) => handleInputChange("publicationYear", e.target.value)}
                      placeholder="2024"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="edition">Edition</Label>
                    <Input
                      id="edition"
                      value={formData.edition}
                      onChange={(e) => handleInputChange("edition", e.target.value)}
                      placeholder="1st, 2nd, etc."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pages">Pages</Label>
                    <Input
                      id="pages"
                      value={formData.pages}
                      onChange={(e) => handleInputChange("pages", e.target.value)}
                      placeholder="250"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Shelf Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="A-101"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quantity & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of copies to add to inventory
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Copies:</span>
                      <span className="font-medium">{formData.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available:</span>
                      <span className="font-medium text-green-600">{formData.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant="default">Available</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>• ISBN helps identify unique books</p>
                  <p>• Category affects search and reporting</p>
                  <p>• Location helps with physical organization</p>
                  <p>• Description helps users find relevant books</p>
                </div>
              </CardContent>
            </Card>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
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
        </div>
      </form>
    </div>
  );
}
