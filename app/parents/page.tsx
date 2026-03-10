"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Users,
  Mail,
  Phone,
  Home,
  CheckCircle,
  Clock,
  XCircle,
  User,
  BabyIcon as Child,
} from "lucide-react"

// Define the Parent type based on the provided backend schema
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED"

interface Parent {
  id: string // This is the userId linked to the parent record
  verificationStatus: VerificationStatus
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string | null
    surname: string | null
    phone: string | null
    address: string | null
    profileImageUrl: string | null
    createdAt: string
  }
  children: {
    id: string
    name: string
    schoolId: string
    classId: string | null
    gradeId: string | null
    school: { id: string; name: string; city: string | null; logoUrl: string | null }
    class: { id: string; name: string; grade: { name: string; level: number } | null } | null
    grade: { id: string; name: string } | null
    _count?: {
      attendances: number
      results: number
      assignmentSubmissions: number
    }
  }[]
  _count?: {
    children: number
    payments: number
    feedbacks: number
  }
}

export default function ParentsPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("ALL")
  const [selectedVerificationStatusFilter, setSelectedVerificationStatusFilter] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingParent, setEditingParent] = useState<Parent | null>(null)

  const [formData, setFormData] = useState({
    // User details for new parent creation
    email: "",
    password: "",
    name: "",
    surname: "",
    phone: "",
    address: "",
    // For updating existing parent (verification status)
    verificationStatus: "" as VerificationStatus | "",
  })

  useEffect(() => {
    fetchParents()
  }, [searchTerm, selectedSchoolFilter, selectedVerificationStatusFilter, currentSchool, user?.role])

  const fetchParents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm) // Assuming backend supports search on parents

      // Apply school filter based on user role and selected filter
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter !== "ALL") {
        params.append("schoolId", selectedSchoolFilter)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        // For school admins/principals, the backend's getParents handles filtering by their schoolId
        // No need to explicitly add schoolId param here if currentSchool is already handled by getTenantFilter
      }

      if (selectedVerificationStatusFilter !== "ALL") {
        params.append("verificationStatus", selectedVerificationStatusFilter)
      }

      const response = await fetch(`/api/parents?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch parents")
      }
      const data = await response.json()
      setParents(data.parents || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateParent = async () => {
    try {
      if (!formData.email || !formData.password || !formData.name || !formData.surname) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Email, Password, First Name, Last Name)",
          variant: "destructive",
        })
        return
      }

      const parentData = {
        userDetails: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          surname: formData.surname,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        },
      }

      const response = await fetch("/api/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(parentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create parent")
      }
      toast({
        title: "Success",
        description: "Parent created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchParents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create parent",
        variant: "destructive",
      })
    }
  }

  const handleUpdateParent = async () => {
    if (!editingParent) return
    try {
      const parentData = {
        verificationStatus: formData.verificationStatus || undefined,
      }

      const response = await fetch(`/api/parents/${editingParent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(parentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update parent")
      }
      toast({
        title: "Success",
        description: "Parent updated successfully",
      })
      setEditingParent(null)
      resetForm()
      fetchParents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update parent",
        variant: "destructive",
      })
    }
  }

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm("Are you sure you want to delete this parent? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/parents/${parentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete parent")
      }
      toast({
        title: "Success",
        description: "Parent deleted successfully",
      })
      fetchParents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete parent",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      surname: "",
      phone: "",
      address: "",
      verificationStatus: "",
    })
  }

  const openEditDialog = (parent: Parent) => {
    setEditingParent(parent)
    setFormData({
      ...formData, // Keep other fields as they are not used for update
      verificationStatus: parent.verificationStatus,
    })
  }

  const canManageParents = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Helper to get school name from ID
  const getSchoolName = (schoolId: string) => {
    const school = availableSchools.find((s) => s.id === schoolId)
    return school ? school.name : "Unknown School"
  }

  const getVerificationStatusBadgeVariant = (status: VerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return "default"
      case "PENDING":
        return "secondary"
      case "REJECTED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getVerificationStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="w-3 h-3 text-emerald-600" />
      case "PENDING":
        return <Clock className="w-3 h-3 text-orange-600" />
      case "REJECTED":
        return <XCircle className="w-3 h-3 text-red-600" />
      default:
        return <Clock className="w-3 h-3 text-gray-600" />
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Parents Management" subtitle="Manage parent accounts and their children" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search parents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                {user?.role === "SUPER_ADMIN" && (
                  <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Schools</SelectItem>
                      {availableSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedVerificationStatusFilter} onValueChange={setSelectedVerificationStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canManageParents && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Parent</DialogTitle>
                      <DialogDescription>Create a new parent account.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="parent@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimum 6 characters"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">First Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Jane"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="surname">Last Name *</Label>
                          <Input
                            id="surname"
                            value={formData.surname}
                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="123 Main St, Anytown"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateParent}>Create Parent</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Parents Grid */}
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card
                    key={i}
                    className="group overflow-hidden border-0 shadow-sm bg-white/80 backdrop-blur-sm animate-pulse"
                  >
                    <div className="relative p-8">
                      <div className="flex items-start space-x-6">
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4"></div>
                          <div className="h-4 bg-gradient-to-r from-gray-150 to-gray-100 rounded-md w-1/2"></div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-150 to-gray-100 rounded-md w-4/5"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md w-3/5"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : parents.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No parents found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedSchoolFilter !== "ALL" || selectedVerificationStatusFilter !== "ALL"
                      ? "We couldn't find any parents matching your criteria. Try adjusting your filters or search terms."
                      : "Start managing your school community by adding parent accounts."}
                  </p>
                  {canManageParents && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Parent
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {parents.map((parent) => (
                  <Card
                    key={parent.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                              <AvatarImage
                                src={parent.user.profileImageUrl || "/placeholder.svg?height=64&width=64&query=parent"}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                <User className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {parent.user.name} {parent.user.surname}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={getVerificationStatusBadgeVariant(parent.verificationStatus)}
                                className="text-xs font-semibold px-2 py-1 rounded-full"
                              >
                                {getVerificationStatusIcon(parent.verificationStatus)}
                                <span className="ml-1">{parent.verificationStatus}</span>
                              </Badge>
                              {parent._count?.children !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-purple-200 text-purple-700 bg-purple-50"
                                >
                                  <Child className="w-3 h-3 mr-1" />
                                  {parent._count.children} Children
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManageParents && (
                          <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(parent)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParent(parent.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {/* Contact Information */}
                      <div className="space-y-3 mb-6">
                        {parent.user.email && (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <Mail className="w-3 h-3 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium truncate">{parent.user.email}</p>
                          </div>
                        )}
                        {parent.user.phone && (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <Phone className="w-3 h-3 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{parent.user.phone}</p>
                          </div>
                        )}
                        {parent.user.address && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center">
                              <Home className="w-3 h-3 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed break-words">{parent.user.address}</p>
                          </div>
                        )}
                      </div>

                      {/* Children List */}
                      {parent.children && parent.children.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">Children:</h5>
                          <div className="space-y-2">
                            {parent.children.map((child) => (
                              <div key={child.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <Child className="w-4 h-4 text-blue-500" />
                                <span>
                                  {child.name} ({child.grade?.name || "N/A Grade"} -{" "}
                                  {child.school?.name || "N/A School"})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">
                          Created: {new Date(parent.user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">ID: {parent.id.slice(-8).toUpperCase()}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingParent} onOpenChange={() => setEditingParent(null)}>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Edit Parent: {editingParent?.user.name} {editingParent?.user.surname}
                  </DialogTitle>
                  <DialogDescription>Update parent verification status.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-verificationStatus">Verification Status</Label>
                    <Select
                      value={formData.verificationStatus}
                      onValueChange={(value: VerificationStatus) =>
                        setFormData({ ...formData, verificationStatus: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingParent(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateParent}>Update Parent</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
