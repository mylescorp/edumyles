"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Archive,
  BookOpen,
  Eye,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Send,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

type KnowledgeBaseArticle = {
  _id: string;
  title: string;
  slug: string;
  body: string;
  category?: string;
  tags: string[];
  visibility: "public" | "tenants_only" | "staff_only";
  relatedArticleIds: string[];
  status: "draft" | "published" | "archived";
  authorId: string;
  views: number;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
};

type ArticleFormState = {
  title: string;
  slug: string;
  body: string;
  category: string;
  tags: string;
  visibility: KnowledgeBaseArticle["visibility"];
  status: KnowledgeBaseArticle["status"];
};

const initialFormState: ArticleFormState = {
  title: "",
  slug: "",
  body: "",
  category: "",
  tags: "",
  visibility: "public",
  status: "draft",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Not published";
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTone(status: KnowledgeBaseArticle["status"]) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "archived":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function PlatformKnowledgeBasePage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | KnowledgeBaseArticle["status"]>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [formState, setFormState] = useState<ArticleFormState>(initialFormState);

  const articles = usePlatformQuery(
    api.modules.platform.support.getKnowledgeBaseArticles,
    {
      sessionToken: sessionToken || "",
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    },
    !!sessionToken
  ) as KnowledgeBaseArticle[] | undefined;

  const upsertArticle = useMutation(api.modules.platform.support.upsertKnowledgeBaseArticle);

  const articleRows = useMemo(() => articles ?? [], [articles]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(articleRows.map((article) => article.category).filter((category): category is string => Boolean(category)))
    ).sort((a, b) => a.localeCompare(b));
  }, [articleRows]);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return articleRows.filter((article) => {
      const matchesSearch =
        query.length === 0 ||
        article.title.toLowerCase().includes(query) ||
        article.slug.toLowerCase().includes(query) ||
        article.body.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [articleRows, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const published = articleRows.filter((article) => article.status === "published");
    const draft = articleRows.filter((article) => article.status === "draft");
    const archived = articleRows.filter((article) => article.status === "archived");
    const totalViews = articleRows.reduce((sum, article) => sum + article.views, 0);

    return {
      totalArticles: articleRows.length,
      publishedCount: published.length,
      draftCount: draft.length,
      archivedCount: archived.length,
      totalViews,
      topViewed: [...published].sort((a, b) => b.views - a.views).slice(0, 5),
    };
  }, [articleRows]);

  const openCreateDialog = () => {
    setEditingArticle(null);
    setFormState(initialFormState);
    setIsEditorOpen(true);
  };

  const openEditDialog = (article: KnowledgeBaseArticle) => {
    setEditingArticle(article);
    setFormState({
      title: article.title,
      slug: article.slug,
      body: article.body,
      category: article.category ?? "",
      tags: article.tags.join(", "),
      visibility: article.visibility,
      status: article.status,
    });
    setIsEditorOpen(true);
  };

  const handleSubmitArticle = async () => {
    if (!sessionToken || !formState.title.trim() || !formState.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }

    try {
      await upsertArticle({
        sessionToken,
        ...(editingArticle ? { articleId: editingArticle._id as any } : {}),
        title: formState.title.trim(),
        slug: formState.slug.trim() || slugify(formState.title),
        body: formState.body.trim(),
        category: formState.category.trim() || undefined,
        tags: formState.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        visibility: formState.visibility,
        status: formState.status,
        relatedArticleIds: editingArticle?.relatedArticleIds ?? [],
      });

      toast.success(editingArticle ? "Article updated." : "Article created.");
      setIsEditorOpen(false);
      setEditingArticle(null);
      setFormState(initialFormState);
    } catch (error: any) {
      console.error("Failed to save article:", error);
      toast.error(error?.message || "Failed to save article.");
    }
  };

  const handleArchiveArticle = async (article: KnowledgeBaseArticle) => {
    if (!sessionToken) return;

    try {
      await upsertArticle({
        sessionToken,
        articleId: article._id as any,
        title: article.title,
        slug: article.slug,
        body: article.body,
        category: article.category,
        tags: article.tags,
        visibility: article.visibility,
        status: "archived",
        relatedArticleIds: article.relatedArticleIds,
      });
      toast.success("Article archived.");
    } catch (error: any) {
      console.error("Failed to archive article:", error);
      toast.error(error?.message || "Failed to archive article.");
    }
  };

  if (!sessionToken || articles === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Manage platform help articles, publishing state, visibility, and reader engagement."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Knowledge Base", href: "/platform/knowledge-base" },
        ]}
        actions={
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalArticles}</p>
              <p className="text-sm text-muted-foreground">Total articles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draftCount}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Article inventory</CardTitle>
                  <CardDescription>Search, filter, publish, and archive the knowledge base.</CardDescription>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-[250px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search title, slug, content, or tags"
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredArticles.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No articles match this view"
                  description="Create a new article or adjust the search and filter settings."
                />
              ) : (
                <div className="space-y-3">
                  {filteredArticles.map((article) => (
                    <div key={article._id} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{article.title}</p>
                            <Badge className={statusTone(article.status)}>{article.status}</Badge>
                            <Badge variant="outline">{article.visibility.replace("_", " ")}</Badge>
                            {article.category ? <Badge variant="secondary">{article.category}</Badge> : null}
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{article.body}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <span>Slug: /kb/{article.slug}</span>
                            <span>Updated {formatDate(article.updatedAt)}</span>
                            <span>{article.views} views</span>
                          </div>
                          {article.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {article.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedArticle(article)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(article)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          {article.status !== "archived" ? (
                            <Button variant="outline" size="sm" onClick={() => handleArchiveArticle(article)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Derived categories</CardTitle>
              <CardDescription>Categories are inferred from the stored article metadata.</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No categories yet"
                  description="Add categories to articles and they will appear here automatically."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categories.map((category) => {
                    const count = articleRows.filter((article) => article.category === category).length;
                    return (
                      <div key={category} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{category}</p>
                          <Badge variant="outline">
                            {count} article{count === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Used by live knowledge-base articles in this platform workspace.
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular">
          <Card>
            <CardHeader>
              <CardTitle>Most viewed published articles</CardTitle>
              <CardDescription>Live ranking based on the stored article view counters.</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topViewed.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No published articles with views yet"
                  description="Popular article rankings will appear after published content starts getting traffic."
                />
              ) : (
                <div className="space-y-3">
                  {stats.topViewed.map((article, index) => (
                    <div key={article._id} className="flex items-center gap-4 rounded-xl border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{article.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>{article.views} views</span>
                          <span>Published {formatDate(article.publishedAt)}</span>
                          {article.category ? <span>{article.category}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>Live traffic</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Edit article" : "Create article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kb-title">Title</Label>
                <Input
                  id="kb-title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                      slug: editingArticle ? current.slug : slugify(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-slug">Slug</Label>
                <Input
                  id="kb-slug"
                  value={formState.slug}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, slug: slugify(event.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Billing, Onboarding, Security"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={formState.visibility}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      visibility: value as KnowledgeBaseArticle["visibility"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="tenants_only">Tenants only</SelectItem>
                    <SelectItem value="staff_only">Staff only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      status: value as KnowledgeBaseArticle["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-tags">Tags</Label>
              <Input
                id="kb-tags"
                value={formState.tags}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, tags: event.target.value }))
                }
                placeholder="setup, payments, troubleshooting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-body">Body</Label>
              <Textarea
                id="kb-body"
                value={formState.body}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, body: event.target.value }))
                }
                rows={14}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitArticle}>
              {editingArticle ? "Save changes" : "Create article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedArticle)} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          {selectedArticle ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusTone(selectedArticle.status)}>{selectedArticle.status}</Badge>
                <Badge variant="outline">{selectedArticle.visibility.replace("_", " ")}</Badge>
                {selectedArticle.category ? <Badge variant="secondary">{selectedArticle.category}</Badge> : null}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>Slug: /kb/{selectedArticle.slug}</span>
                <span>Published {formatDate(selectedArticle.publishedAt)}</span>
                <span>{selectedArticle.views} views</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm">
                {selectedArticle.body}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
