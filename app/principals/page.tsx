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
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  BookOpen,
  UserCheck,
  User,
  Mail,
  Loader2,
  CalendarDays,
  HeartPulse,
  CircleDot,
} from "lucide-react"

// Define the Principal type based on the provided backend schema
interface Principal {
  id: string
  user: {
    id: string
    email: string
    name: string | null
    surname: string | null
    username: string
    profileImageUrl: string | null
  }
  school: {
    id: string
    name: string
  }
  qualifications: string | null
  bio: string | null
  approval: {
    status: "PENDING" | "APPROVED" | "REJECTED"
  } | null
  createdAt: string
  updatedAt: string
}

export default function PrincipalsPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [principals, setPrincipals] = useState<Principal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("all")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null)
  const [uploadingProfileImage, setUploadingProfileImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // User creation fields
    email: "",
    name: "",
    surname: "",
    username: "",
    // Principal-specific fields
    schoolId: "", // Will be set by useEffect
    qualifications: "",
    bio: "",
    profileImageUrl: "", // For direct URL input or display after upload
  })
  const [createdPrincipalCredentials, setCreatedPrincipalCredentials] = useState<{
    email: string
    password: string
  } | null>(null)

  // Initialize formData based on user role and currentSchool
  useEffect(() => {
    if (user) {
      if (user.role === "SUPER_ADMIN") {
        setFormData((prev) => ({ ...prev, schoolId: "" }))
      } else if (currentSchool) {
        setFormData((prev) => ({ ...prev, schoolId: currentSchool }))
      }
    }
  }, [user, currentSchool])

  useEffect(() => {
    fetchPrincipals()
  }, [searchTerm, selectedApprovalStatus, selectedSchoolFilter])

  const fetchPrincipals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedApprovalStatus !== "all") params.append("status", selectedApprovalStatus)

      // Apply school filter based on user role and selected filter
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter !== "all") {
        params.append("schoolId", selectedSchoolFilter)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/principals?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch principals")
      }
      const data = await response.json()
      setPrincipals(data.principals || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch principals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrincipal = async () => {
    try {
      // Validate required fields
      if (
        !formData.email ||
        !formData.name ||
        !formData.surname ||
        !formData.username ||
        !formData.schoolId
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Filter out empty string fields to avoid validation errors
      const principalData: any = {
        email: formData.email,
        name: formData.name,
        surname: formData.surname,
        username: formData.username,
        schoolId: formData.schoolId,
        qualifications: formData.qualifications || undefined,
        bio: formData.bio || undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      }

      // Filter out empty string fields
      Object.keys(principalData).forEach(key => {
        if (principalData[key] === "") {
          delete principalData[key]
        }
      })

      const response = await fetch("/api/principals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(principalData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create principal")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Principal created successfully",
      })

      // Show generated credentials if they were created
      if (data.generatedCredentials) {
        setCreatedPrincipalCredentials(data.generatedCredentials)
      }

      setIsCreateDialogOpen(false)
      resetForm()
      fetchPrincipals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create principal",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePrincipal = async () => {
    if (!editingPrincipal) return
    try {
      const principalData = {
        qualifications: formData.qualifications || undefined,
        bio: formData.bio || undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      }

      const response = await fetch(`/api/principals/${editingPrincipal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(principalData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update principal")
      }
      toast({
        title: "Success",
        description: "Principal updated successfully",
      })
      setEditingPrincipal(null)
      resetForm()
      fetchPrincipals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update principal",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrincipal = async (principalId: string) => {
    if (!confirm("Are you sure you want to delete this principal? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/principals/${principalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete principal")
      }
      toast({
        title: "Success",
        description: "Principal deleted successfully",
      })
      fetchPrincipals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete principal",
        variant: "destructive",
      })
    }
  }

  const handleVerifyPrincipal = async (principalId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/principals/${principalId}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify principal")
      }
      const data = await response.json()
      toast({
        title: "Success",
        description: data.message || `Principal ${status.toLowerCase()} successfully`,
      })
      fetchPrincipals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify principal",
        variant: "destructive",
      })
    }
  }

  const handleProfileImageUpload = async (principalId: string, files: FileList) => {
    if (files.length === 0) return
    try {
      setUploadingProfileImage(principalId)
      const imageFile = files[0]
      const formData = new FormData()
      formData.append("profileImage", imageFile)
      const response = await fetch(`/api/principals/${principalId}/profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload profile image")
      }
      toast({
        title: "Success",
        description: "Principal profile image uploaded successfully",
      })
      fetchPrincipals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile image",
        variant: "destructive",
      })
    } finally {
      setUploadingProfileImage(null)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      surname: "",
      username: "",
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""),
      qualifications: "",
      bio: "",
      profileImageUrl: "",
    })
    setCreatedPrincipalCredentials(null)
  }

  const openEditDialog = (principal: Principal) => {
    setEditingPrincipal(principal)
    setFormData({
      email: principal.user.email,
      name: principal.user.name || "",
      surname: principal.user.surname || "",
      username: principal.user.username,
      schoolId: principal.school.id,
      qualifications: principal.qualifications || "",
      bio: principal.bio || "",
      profileImageUrl: principal.user.profileImageUrl || "",
    })
  }

  const getPrincipalApprovalStatus = (principal: Principal) => {
    return principal.approval?.status || "PENDING"
  }

  const canManagePrincipals = user?.role === "SUPER_ADMIN"

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Principal Management" subtitle="Manage school principals and their profiles" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search principals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                {user?.role === "SUPER_ADMIN" && (
                  <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by school">
                        {selectedSchoolFilter === "all" ? "All Schools" : "Select school"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {availableSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedApprovalStatus} onValueChange={setSelectedApprovalStatus}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All Status">
                      {selectedApprovalStatus === "all" ? "All Status" : "Select status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canManagePrincipals && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Principal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Principal</DialogTitle>
                      <DialogDescription>Create a new principal account and profile.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* User Account Fields */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Account Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">First Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="John"
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
                          <Label htmlFor="username">Username *</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="john.doe"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john.doe@school.edu"
                            required
                          />
                        </div>
                      </div>
                      {/* School Assignment */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">School Assignment</h4>
                        <div className="space-y-2">
                          <Label htmlFor="schoolId">School *</Label>
                          <Select
                            value={formData.schoolId}
                            onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a school">
                                {availableSchools.find(s => s.id === formData.schoolId)?.name || "Select a school"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availableSchools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Principal Profile Fields */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Profile Information</h4>
                        <div className="space-y-2">
                          <Label htmlFor="qualifications">Qualifications</Label>
                          <Textarea
                            id="qualifications"
                            value={formData.qualifications}
                            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                            placeholder="e.g., Master's in Education, PhD in Educational Leadership"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="A short biography about the principal."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                          <Input
                            id="profileImageUrl"
                            value={formData.profileImageUrl}
                            onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePrincipal}>Create Principal</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Principals Grid */}
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
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : principals.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No principals found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedApprovalStatus !== "all" || selectedSchoolFilter !== "all"
                      ? "We couldn't find any principals matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your leadership team by adding your first principal to the platform."}
                  </p>
                  {canManagePrincipals && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Principal
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {principals.map((principal) => {
                  const approvalStatus = getPrincipalApprovalStatus(principal)
                  return (
                    <Card
                      key={principal.id}
                      className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {canManagePrincipals ? (
                                <FileUpload
                                  accept="image/*"
                                  maxSize={5}
                                  maxFiles={1}
                                  onFileSelect={(files) => handleProfileImageUpload(principal.id, files)}
                                  disabled={uploadingProfileImage === principal.id}
                                  variant="avatar"
                                  className="w-16 h-16"
                                  showPreview={false}
                                >
                                  <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                    <AvatarImage
                                      src={principal.user.profileImageUrl || "/placeholder.svg"}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                      <User className="w-6 h-6" />
                                    </AvatarFallback>
                                  </Avatar>
                                </FileUpload>
                              ) : (
                                <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                  <AvatarImage
                                    src={principal.user.profileImageUrl || "/placeholder.svg"}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {uploadingProfileImage === principal.id && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {principal.user.name} {principal.user.surname}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  @{principal.user.username}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                                >
                                  {principal.school.name}
                                </Badge>
                                <Badge
                                  variant={approvalStatus === "APPROVED" ? "default" : "secondary"}
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    approvalStatus === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {approvalStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {canManagePrincipals && (
                            <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(principal)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {approvalStatus === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerifyPrincipal(principal.id, "APPROVED")}
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                    title="Approve Principal"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerifyPrincipal(principal.id, "REJECTED")}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                    title="Reject Principal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePrincipal(principal.id)}
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
                          {principal.user.email && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium truncate">{principal.user.email}</p>
                            </div>
                          )}
                          {principal.qualifications && (
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center">
                                <BookOpen className="w-3 h-3 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {principal.qualifications}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Bio */}
                        {principal.bio && (
                          <div className="mb-6">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">
                                "{principal.bio}"
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500 font-medium">
                            Created: {new Date(principal.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            ID: {principal.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingPrincipal} onOpenChange={() => setEditingPrincipal(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Principal</DialogTitle>
                  <DialogDescription>Update principal profile information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-qualifications">Qualifications</Label>
                    <Textarea
                      id="edit-qualifications"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      placeholder="e.g., Master's in Education, PhD in Educational Leadership"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="A short biography about the principal."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-profileImageUrl">Profile Image URL</Label>
                    <Input
                      id="edit-profileImageUrl"
                      value={formData.profileImageUrl}
                      onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingPrincipal(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePrincipal}>Update Principal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Principal Credentials Dialog */}
            <Dialog open={!!createdPrincipalCredentials} onOpenChange={() => setCreatedPrincipalCredentials(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Principal Created Successfully</DialogTitle>
                  <DialogDescription>
                    The principal account has been created. Here are the login credentials:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      {createdPrincipalCredentials?.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      {createdPrincipalCredentials?.password}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• A welcome email has been sent to the principal with login instructions</p>
                    <p>• The principal should change their password after first login</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setCreatedPrincipalCredentials(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}