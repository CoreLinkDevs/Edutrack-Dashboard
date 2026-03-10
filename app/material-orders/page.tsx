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
  ShoppingCart,
  Loader2,
  DollarSign,
} from "lucide-react"

// Define the Order type
interface Order {
  id: string
  parentId: string
  schoolId: string
  totalAmount: number
  status: string
  deliveryMethod?: string
  deliveryAddress?: string
  deliveryNotes?: string
  createdAt: string
  updatedAt: string
}

export default function MaterialOrdersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState({
    parentId: "",
    schoolId: "",
    deliveryMethod: "",
    deliveryAddress: "",
    deliveryNotes: "",
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const { accessToken } = useAuth()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)

      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    try {
      const orderData: any = {
        ...formData,
      }

      // Filter out empty string fields
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === "") {
          delete orderData[key]
        }
      })

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Order created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchOrders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      })
    }
  }

  const handleUpdateOrder = async () => {
    if (!editingOrder) return
    try {
      const orderData = {
        ...formData,
      }

      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update order")
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      setEditingOrder(null)
      resetForm()
      fetchOrders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete order")
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
      fetchOrders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      parentId: "",
      schoolId: "",
      deliveryMethod: "",
      deliveryAddress: "",
      deliveryNotes: "",
    })
  }

  const openEditDialog = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      parentId: order.parentId,
      schoolId: order.schoolId,
      deliveryMethod: order.deliveryMethod || "",
      deliveryAddress: order.deliveryAddress || "",
      deliveryNotes: order.deliveryNotes || "",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Material Orders Management" subtitle="Manage material orders and deliveries" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>Add a new material order</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parentId">Parent ID *</Label>
                        <Input
                          id="parentId"
                          value={formData.parentId}
                          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                          placeholder="Enter parent ID"
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
                    <div className="space-y-2">
                      <Label htmlFor="deliveryMethod">Delivery Method</Label>
                      <Select
                        value={formData.deliveryMethod}
                        onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PICKUP">Pickup</SelectItem>
                          <SelectItem value="DELIVERY">Delivery</SelectItem>
                          <SelectItem value="MAIL">Mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        placeholder="Delivery address"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                      <Textarea
                        id="deliveryNotes"
                        value={formData.deliveryNotes}
                        onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                        placeholder="Special delivery instructions"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrder}>Create Order</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Orders Grid */}
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
            ) : orders.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <ShoppingCart className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No orders found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedStatus !== "ALL"
                      ? "We couldn't find any orders matching your criteria. Try adjusting your filters or search terms."
                      : "Start managing material orders by adding your first order to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                ${order.totalAmount.toFixed(2)}
                              </Badge>
                              <Badge
                                variant={order.status === "DELIVERED" ? "default" : order.status === "PROCESSING" ? "secondary" : "outline"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  order.status === "DELIVERED"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : order.status === "PROCESSING"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {order.deliveryMethod && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Delivery:</span> {order.deliveryMethod}
                          </p>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            <span className="font-medium">Address:</span> {order.deliveryAddress}
                          </p>
                        </div>
                      )}
                      {order.deliveryNotes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            <span className="font-medium">Notes:</span> {order.deliveryNotes}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          Created: {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Order</DialogTitle>
                  <DialogDescription>Update order information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-parentId">Parent ID *</Label>
                      <Input
                        id="edit-parentId"
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        placeholder="Enter parent ID"
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryMethod">Delivery Method</Label>
                    <Select
                      value={formData.deliveryMethod}
                      onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PICKUP">Pickup</SelectItem>
                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                        <SelectItem value="MAIL">Mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryAddress">Delivery Address</Label>
                    <Textarea
                      id="edit-deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      placeholder="Delivery address"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryNotes">Delivery Notes</Label>
                    <Textarea
                      id="edit-deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                      placeholder="Special delivery instructions"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingOrder(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateOrder}>Update Order</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}