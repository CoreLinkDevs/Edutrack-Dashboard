"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Loader2,
  DollarSign,
} from "lucide-react"

// Define the Material type
interface Material {
  id: string
  name: string
  description?: string
  price: number
  stockQuantity: number
  minOrderQty?: number
  maxOrderQty?: number
  categoryId: string
  brand?: string
  model?: string
  specifications?: object
  schoolId: string
  createdAt: string
  updatedAt: string
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    minOrderQty: "",
    maxOrderQty: "",
    categoryId: "",
    brand: "",
    model: "",
    schoolId: "",
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  const { accessToken } = useAuth()

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory)

      const response = await fetch(`/api/materials?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch materials")
      }

      const data = await response.json()
      setMaterials(data.materials || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch materials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = async () => {
    try {
      const materialData: any = {
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        minOrderQty: formData.minOrderQty ? Number(formData.minOrderQty) : undefined,
        maxOrderQty: formData.maxOrderQty ? Number(formData.maxOrderQty) : undefined,
      }

      // Filter out empty string fields
      Object.keys(materialData).forEach(key => {
        if (materialData[key] === "") {
          delete materialData[key]
        }
      })

      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(materialData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create material")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Material created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchMaterials()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create material",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return
    try {
      const materialData = {
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        minOrderQty: formData.minOrderQty ? Number(formData.minOrderQty) : undefined,
        maxOrderQty: formData.maxOrderQty ? Number(formData.maxOrderQty) : undefined,
      }

      const response = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(materialData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update material")
      }

      toast({
        title: "Success",
        description: "Material updated successfully",
      })
      setEditingMaterial(null)
      resetForm()
      fetchMaterials()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update material",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete material")
      }

      toast({
        title: "Success",
        description: "Material deleted successfully",
      })
      fetchMaterials()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stockQuantity: "",
      minOrderQty: "",
      maxOrderQty: "",
      categoryId: "",
      brand: "",
      model: "",
      schoolId: "",
    })
  }

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      description: material.description || "",
      price: material.price.toString(),
      stockQuantity: material.stockQuantity.toString(),
      minOrderQty: material.minOrderQty?.toString() || "",
      maxOrderQty: material.maxOrderQty?.toString() || "",
      categoryId: material.categoryId,
      brand: material.brand || "",
      model: material.model || "",
      schoolId: material.schoolId,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Materials Management" subtitle="Manage school materials and inventory" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {/* Categories would be fetched dynamically */}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Material</DialogTitle>
                    <DialogDescription>Add a new material to the inventory</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Material Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter material name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Material description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          value={formData.stockQuantity}
                          onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minOrderQty">Min Order Qty</Label>
                        <Input
                          id="minOrderQty"
                          type="number"
                          value={formData.minOrderQty}
                          onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxOrderQty">Max Order Qty</Label>
                        <Input
                          id="maxOrderQty"
                          type="number"
                          value={formData.maxOrderQty}
                          onChange={(e) => setFormData({ ...formData, maxOrderQty: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category ID *</Label>
                        <Input
                          id="categoryId"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          placeholder="Enter category ID"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schoolId">School ID *</Label>
                        <Input
                          id="schoolId"
                          value={formData.schoolId}
                          onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                          placeholder="Enter school ID"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="Brand name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="Model name"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMaterial}>Create Material</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Materials Grid */}
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : materials.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Package className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No materials found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedCategory !== "ALL"
                      ? "We couldn't find any materials matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your materials inventory by adding your first material to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Material
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {materials.map((material) => (
                  <Card
                    key={material.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {material.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                ${material.price.toFixed(2)}
                              </Badge>
                              <Badge
                                variant={material.stockQuantity > 0 ? "default" : "secondary"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  material.stockQuantity > 0
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {material.stockQuantity} in stock
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(material)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {material.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {material.description}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2 mb-4">
                        {material.brand && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Brand: {material.brand}</span>
                          </div>
                        )}
                        {material.model && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Model: {material.model}</span>
                          </div>
                        )}
                        {(material.minOrderQty || material.maxOrderQty) && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              Order: {material.minOrderQty || 0} - {material.maxOrderQty || '∞'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {material.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Material</DialogTitle>
                  <DialogDescription>Update material information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Material Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter material name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Material description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-stockQuantity">Stock Quantity *</Label>
                      <Input
                        id="edit-stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-minOrderQty">Min Order Qty</Label>
                      <Input
                        id="edit-minOrderQty"
                        type="number"
                        value={formData.minOrderQty}
                        onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-maxOrderQty">Max Order Qty</Label>
                      <Input
                        id="edit-maxOrderQty"
                        type="number"
                        value={formData.maxOrderQty}
                        onChange={(e) => setFormData({ ...formData, maxOrderQty: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-categoryId">Category ID *</Label>
                      <Input
                        id="edit-categoryId"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        placeholder="Enter category ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-schoolId">School ID *</Label>
                      <Input
                        id="edit-schoolId"
                        value={formData.schoolId}
                        onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                        placeholder="Enter school ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-brand">Brand</Label>
                      <Input
                        id="edit-brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Brand name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-model">Model</Label>
                      <Input
                        id="edit-model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Model name"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingMaterial(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateMaterial}>Update Material</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}