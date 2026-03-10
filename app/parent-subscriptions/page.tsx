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
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  Loader2,
  Crown,
} from "lucide-react"

// Define the ParentSubscription type
interface ParentSubscription {
  id: string
  plan: string
  status: string
  startDate: string
  endDate?: string
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

export default function ParentSubscriptionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<ParentSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<ParentSubscription | null>(null)
  const [formData, setFormData] = useState({
    plan: "BASIC",
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const { accessToken } = useAuth()

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)

      const response = await fetch(`/api/parent-subscriptions?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch parent subscriptions")
      }

      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parent subscriptions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    try {
      const subscriptionData: any = {
        ...formData,
      }

      const response = await fetch("/api/parent-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(subscriptionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create parent subscription")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Parent subscription created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchSubscriptions()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create parent subscription",
        variant: "destructive",
      })
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return
    }
    try {
      const response = await fetch(`/api/parent-subscriptions/${subscriptionId}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel subscription")
      }

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      })
      fetchSubscriptions()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      plan: "BASIC",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Parent Subscriptions Management" subtitle="Manage parent subscription plans and billing" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search subscriptions..."
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Parent Subscription</DialogTitle>
                    <DialogDescription>Add a new subscription plan for parents</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan">Subscription Plan *</Label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value) => setFormData({ ...formData, plan: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">Basic Plan</SelectItem>
                          <SelectItem value="PREMIUM">Premium Plan</SelectItem>
                          <SelectItem value="ENTERPRISE">Enterprise Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSubscription}>Create Subscription</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Subscriptions Grid */}
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
            ) : subscriptions.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No parent subscriptions found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedStatus !== "ALL"
                      ? "We couldn't find any subscriptions matching your criteria. Try adjusting your filters or search terms."
                      : "Start managing parent subscriptions by adding your first subscription plan to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Subscription
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {subscriptions.map((subscription) => (
                  <Card
                    key={subscription.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {subscription.plan} Plan
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={subscription.status === "ACTIVE" ? "default" : subscription.status === "CANCELLED" ? "destructive" : "secondary"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  subscription.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : subscription.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {subscription.status}
                              </Badge>
                              {subscription.autoRenew && (
                                <Badge variant="outline" className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50">
                                  Auto Renew
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          {subscription.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelSubscription(subscription.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                              title="Cancel Subscription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Start: {new Date(subscription.startDate).toLocaleDateString()}</span>
                        </div>
                        {subscription.endDate && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">End: {new Date(subscription.endDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {subscription.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}