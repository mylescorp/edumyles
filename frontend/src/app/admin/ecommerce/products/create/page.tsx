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
import { ArrowLeft, Save, Package, Plus, X, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export default function CreateProductPage() {
  const { isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    costPrice: 0,
    sku: "",
    barcode: "",
    trackInventory: true,
    stock: 0,
    minStock: 5,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    tags: [] as string[],
    status: "active",
  });
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newVariant, setNewVariant] = useState({ name: "", price: 0, stock: 0, sku: "" });
  const [newTag, setNewTag] = useState("");
  const [tagInput, setTagInput] = useState("");

  const categories = [
    "Uniforms", "Books", "Stationery", "Sports Equipment", "Lab Supplies",
    "Electronics", "Accessories", "Food & Snacks", "Health & Safety", "Other"
  ];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (dimension: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value }
    }));
  };

  const addVariant = () => {
    if (newVariant.name && newVariant.sku) {
      const variant: ProductVariant = {
        id: Date.now().toString(),
        name: newVariant.name,
        price: newVariant.price,
        stock: newVariant.stock,
        sku: newVariant.sku,
      };
      setVariants([...variants, variant]);
      setNewVariant({ name: "", price: 0, stock: 0, sku: "" });
    }
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to createProduct mutation when ecommerce module is configured
    alert("Product creation will be available once the ecommerce module is configured.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Product"
        description="Add a new product to the school store catalog"
        actions={
          <Link href="/admin/ecommerce/products">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
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
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter product name"
                      required
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
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter product description"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      placeholder="PROD-001"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange("barcode", e.target.value)}
                      placeholder="1234567890123"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="price">Selling Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange("costPrice", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange("stock", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Low Stock Alert</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => handleInputChange("minStock", parseInt(e.target.value) || 0)}
                      placeholder="5"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      min="0"
                      value={formData.dimensions.length}
                      onChange={(e) => handleDimensionChange("length", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      value={formData.dimensions.width}
                      onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      value={formData.dimensions.height}
                      onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Add Variant</h4>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label htmlFor="variantName">Variant Name</Label>
                      <Input
                        id="variantName"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        placeholder="e.g., Size M, Blue"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variantPrice">Price</Label>
                      <Input
                        id="variantPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variantStock">Stock</Label>
                      <Input
                        id="variantStock"
                        type="number"
                        min="0"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variantSku">SKU</Label>
                      <Input
                        id="variantSku"
                        value={newVariant.sku}
                        onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                        placeholder="PROD-001-M"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={addVariant} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                <div className="space-y-2">
                  {variants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No variants added. Add variants for different sizes, colors, etc.
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h5 className="font-medium">{variant.name}</h5>
                          <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Price: KES {variant.price.toFixed(2)}</span>
                          <span>Stock: {variant.stock}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeVariant(variant.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Drag and drop images here or click to browse</p>
                  <Button type="button" variant="outline" className="mt-4">
                    Select Images
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Upload up to 5 images. Supported formats: JPG, PNG, GIF (Max 5MB each)
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Name:</span>
                    <span className="font-medium">{formData.name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Category:</span>
                    <span className="font-medium">{formData.category || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price:</span>
                    <span className="font-medium">KES {formData.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stock:</span>
                    <span className="font-medium">{formData.stock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Variants:</span>
                    <span className="font-medium">{variants.length}</span>
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
                  <p>• Use clear, descriptive product names</p>
                  <p>• Set competitive pricing based on market research</p>
                  <p>• Maintain accurate inventory levels</p>
                  <p>• Use high-quality images for better sales</p>
                  <p>• Add relevant tags for better searchability</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                Create Product
              </Button>
              <Link href="/admin/ecommerce/products">
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
