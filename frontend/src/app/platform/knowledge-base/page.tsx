"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  FileText,
  Plus,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Clock,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

interface Article {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  author: string;
  authorName?: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tenantId?: string;
  createdAt: number;
  updatedAt: number;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
  parentId?: string;
  articleCount: number;
  createdAt?: number;
}

export default function KnowledgeBasePage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

  // Form state for article
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    status: "draft" as "draft" | "published",
  });

  // Form state for category
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "",
  });

  // Queries
  const articlesData = usePlatformQuery(
    api.platform.knowledgeBase.queries.listArticles,
    {
      sessionToken: sessionToken || "",
      category: selectedCategory || undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as "draft" | "published"),
      search: searchQuery || undefined,
    }
  );

  const categoriesData = usePlatformQuery(
    api.platform.knowledgeBase.queries.listCategories,
    { sessionToken: sessionToken || "" }
  );

  const statsData = usePlatformQuery(
    api.platform.knowledgeBase.queries.getStats,
    { sessionToken: sessionToken || "" }
  );

  const popularArticles = usePlatformQuery(
    api.platform.knowledgeBase.queries.getPopularArticles,
    { sessionToken: sessionToken || "", limit: 5 }
  );

  // Mutations
  const createArticleMutation = useMutation(
    api.platform.knowledgeBase.mutations.createArticle
  );
  const updateArticleMutation = useMutation(
    api.platform.knowledgeBase.mutations.updateArticle
  );
  const deleteArticleMutation = useMutation(
    api.platform.knowledgeBase.mutations.deleteArticle
  );
  const publishArticleMutation = useMutation(
    api.platform.knowledgeBase.mutations.publishArticle
  );
  const createCategoryMutation = useMutation(
    api.platform.knowledgeBase.mutations.createCategory
  );
  const recordFeedbackMutation = useMutation(
    api.platform.knowledgeBase.mutations.recordArticleFeedback
  );

  if (!articlesData || !categoriesData || !statsData) {
    return <LoadingSkeleton variant="page" />;
  }

  const articles: Article[] = (articlesData.articles || []).map((a: any) => ({
    _id: a._id,
    title: a.title,
    content: a.content,
    category: a.category,
    tags: a.tags || [],
    status: a.status,
    author: a.author,
    authorName: a.authorName,
    viewCount: a.viewCount || 0,
    helpfulCount: a.helpfulCount || 0,
    notHelpfulCount: a.notHelpfulCount || 0,
    tenantId: a.tenantId,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  const categories: Category[] = (categoriesData || []).map((c: any) => ({
    _id: c._id,
    name: c.name,
    description: c.description || "",
    icon: c.icon,
    order: c.order,
    parentId: c.parentId,
    articleCount: c.articleCount || 0,
  }));

  const stats = statsData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleCreateArticle = async () => {
    if (!sessionToken || !articleForm.title || !articleForm.content) return;
    try {
      await createArticleMutation({
        sessionToken,
        title: articleForm.title,
        content: articleForm.content,
        category: articleForm.category || "General",
        tags: articleForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: articleForm.status,
      });
      setIsCreateArticleOpen(false);
      setArticleForm({
        title: "",
        content: "",
        category: "",
        tags: "",
        status: "draft",
      });
    } catch (err) {
      console.error("Failed to create article:", err);
    }
  };

  const handleUpdateArticle = async () => {
    if (!sessionToken || !editingArticle) return;
    try {
      await updateArticleMutation({
        sessionToken,
        articleId: editingArticle._id,
        title: articleForm.title,
        content: articleForm.content,
        category: articleForm.category || undefined,
        tags: articleForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: articleForm.status,
      });
      setEditingArticle(null);
      setArticleForm({
        title: "",
        content: "",
        category: "",
        tags: "",
        status: "draft",
      });
    } catch (err) {
      console.error("Failed to update article:", err);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!sessionToken) return;
    try {
      await deleteArticleMutation({ sessionToken, articleId });
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const handlePublishArticle = async (articleId: string) => {
    if (!sessionToken) return;
    try {
      await publishArticleMutation({ sessionToken, articleId });
    } catch (err) {
      console.error("Failed to publish article:", err);
    }
  };

  const handleCreateCategory = async () => {
    if (!sessionToken || !categoryForm.name) return;
    try {
      await createCategoryMutation({
        sessionToken,
        name: categoryForm.name,
        description: categoryForm.description,
        icon: categoryForm.icon || undefined,
      });
      setIsCreateCategoryOpen(false);
      setCategoryForm({ name: "", description: "", icon: "" });
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  const handleFeedback = async (articleId: string, helpful: boolean) => {
    if (!sessionToken) return;
    try {
      await recordFeedbackMutation({ sessionToken, articleId, helpful });
    } catch (err) {
      console.error("Failed to record feedback:", err);
    }
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(", "),
      status: article.status,
    });
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ── Article detail view ─────────────────────────────────────────────
  if (viewingArticle) {
    const totalFeedback =
      viewingArticle.helpfulCount + viewingArticle.notHelpfulCount;
    const helpfulPct =
      totalFeedback > 0
        ? Math.round((viewingArticle.helpfulCount / totalFeedback) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <PageHeader
          title={viewingArticle.title}
          breadcrumbs={[
            { label: "Knowledge Base", href: "/platform/knowledge-base" },
            { label: viewingArticle.title },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(viewingArticle)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingArticle(null)}
              >
                Back to List
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(viewingArticle.status)}>
                    {viewingArticle.status}
                  </Badge>
                  <Badge variant="outline">{viewingArticle.category}</Badge>
                  {viewingArticle.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="prose max-w-none whitespace-pre-wrap">
                  {viewingArticle.content}
                </div>
              </CardContent>
            </Card>

            {/* Feedback section */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">
                  Was this article helpful?
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(viewingArticle._id, true)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Yes ({viewingArticle.helpfulCount})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback(viewingArticle._id, false)}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    No ({viewingArticle.notHelpfulCount})
                  </Button>
                  {totalFeedback > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {helpfulPct}% found helpful
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Article Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Author</span>
                  <span>{viewingArticle.authorName || "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(viewingArticle.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(viewingArticle.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {viewingArticle.viewCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Main list view ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Create, manage, and organize help articles for the platform."
        actions={
          <div className="flex items-center gap-2">
            <Dialog
              open={isCreateCategoryOpen}
              onOpenChange={setIsCreateCategoryOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="cat-name">Name</Label>
                    <Input
                      id="cat-name"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                      placeholder="e.g. Getting Started"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cat-desc">Description</Label>
                    <Textarea
                      id="cat-desc"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="cat-icon">Icon (optional)</Label>
                    <Input
                      id="cat-icon"
                      value={categoryForm.icon}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, icon: e.target.value })
                      }
                      placeholder="e.g. book-open"
                    />
                  </div>
                  <Button onClick={handleCreateCategory} className="w-full">
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isCreateArticleOpen}
              onOpenChange={(open) => {
                setIsCreateArticleOpen(open);
                if (!open) {
                  setArticleForm({
                    title: "",
                    content: "",
                    category: "",
                    tags: "",
                    status: "draft",
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Article</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="art-title">Title</Label>
                    <Input
                      id="art-title"
                      value={articleForm.title}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, title: e.target.value })
                      }
                      placeholder="Article title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="art-category">Category</Label>
                    <Select
                      value={articleForm.category}
                      onValueChange={(val) =>
                        setArticleForm({ ...articleForm, category: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="art-content">Content</Label>
                    <Textarea
                      id="art-content"
                      value={articleForm.content}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          content: e.target.value,
                        })
                      }
                      placeholder="Write your article content..."
                      rows={12}
                    />
                  </div>
                  <div>
                    <Label htmlFor="art-tags">Tags (comma-separated)</Label>
                    <Input
                      id="art-tags"
                      value={articleForm.tags}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, tags: e.target.value })
                      }
                      placeholder="e.g. setup, onboarding, billing"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={articleForm.status}
                      onValueChange={(val) =>
                        setArticleForm({
                          ...articleForm,
                          status: val as "draft" | "published",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateArticle} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Create Article
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{stats.totalArticles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.publishedCount} published, {stats.draftCount} drafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Across all articles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Helpful Rate</p>
                <p className="text-2xl font-bold">{stats.helpfulRate}%</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.totalHelpful} helpful, {stats.totalNotHelpful} not helpful
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{stats.categoryCount}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Organizing your content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles">
            <FileText className="mr-2 h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="categories">
            <FolderOpen className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="popular">
            <TrendingUp className="mr-2 h-4 w-4" />
            Popular
          </TabsTrigger>
        </TabsList>

        {/* Articles tab */}
        <TabsContent value="articles" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Category sidebar */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Filter by Category</h3>
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                All Categories
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat._id}
                  variant={
                    selectedCategory === cat.name ? "secondary" : "ghost"
                  }
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <span className="truncate">{cat.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {cat.articleCount}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Article list */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search & filter bar */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {articles.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      No articles found. Create your first article to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <Card
                      key={article._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setViewingArticle(article)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {article.title}
                              </h3>
                              <Badge
                                className={getStatusColor(article.status)}
                              >
                                {article.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.content.substring(0, 200)}
                              {article.content.length > 200 ? "..." : ""}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {article.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.viewCount} views
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {article.helpfulCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(article.updatedAt)}
                              </span>
                            </div>
                            {article.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {article.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-1 ml-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {article.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePublishArticle(article._id)
                                }
                                title="Publish"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(article)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteArticle(article._id)
                              }
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {articlesData.total > articles.length && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Showing {articles.length} of {articlesData.total} articles
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Categories tab */}
        <TabsContent value="categories" className="mt-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  No categories yet. Create a category to organize your articles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Card key={cat._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <Badge variant="outline">
                        {cat.articleCount} article
                        {cat.articleCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {cat.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Order: {cat.order}</span>
                      <span>Created {cat.createdAt ? formatDate(cat.createdAt) : "Unknown"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setActiveTab("articles");
                      }}
                    >
                      View Articles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Popular tab */}
        <TabsContent value="popular" className="mt-4">
          {!popularArticles || popularArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  No published articles yet. Popular articles will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(popularArticles as Article[]).map((article, index) => (
                <Card
                  key={article._id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setViewingArticle(article)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.viewCount} views
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpfulCount} helpful
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit article dialog */}
      <Dialog
        open={!!editingArticle}
        onOpenChange={(open) => {
          if (!open) {
            setEditingArticle(null);
            setArticleForm({
              title: "",
              content: "",
              category: "",
              tags: "",
              status: "draft",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={articleForm.title}
                onChange={(e) =>
                  setArticleForm({ ...articleForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={articleForm.category}
                onValueChange={(val) =>
                  setArticleForm({ ...articleForm, category: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={articleForm.content}
                onChange={(e) =>
                  setArticleForm({ ...articleForm, content: e.target.value })
                }
                rows={12}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={articleForm.tags}
                onChange={(e) =>
                  setArticleForm({ ...articleForm, tags: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={articleForm.status}
                onValueChange={(val) =>
                  setArticleForm({
                    ...articleForm,
                    status: val as "draft" | "published",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateArticle} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
