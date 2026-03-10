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
  GraduationCap,
  UserCheck,
  Building,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Globe,
  Link,
} from "lucide-react"

// Define the School type to match backend schema
type SchoolType = "PRIMARY" | "SECONDARY" | "MONTESSORI" | "INTERNATIONAL" | "TECHNICAL" | "UNIVERSITY" | "OTHER"
type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED"

interface School {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  website: string | null
  schoolType: SchoolType
  missionStatement: string | null
  virtualTourUrl: string | null
  logoUrl: string | null
  registrationStatus: RegistrationStatus
  isVerified: boolean
  establishedYear: number | null
  createdAt: string
  updatedAt: string
  _count?: {
    students: number
    teachers: number
    classes?: number
    grades?: number
  }
}

export default function SchoolsPage() {
  const { user, currentSchool } = useAuth()
  const { toast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
    schoolType: "PRIMARY" as SchoolType,
    missionStatement: "",
    establishedYear: "",
    // Admin options
    adminUserId: "", // For linking existing user
    adminEmail: "", // For creating new admin
    adminUsername: "",
    adminName: "",
    adminSurname: "",
    logo: null as File | null, // Logo file
  })
  const [adminCreationMode, setAdminCreationMode] = useState<"existing" | "new">("new")

  useEffect(() => {
    fetchSchools()
  }, [])


// At the top of your component
const { accessToken } = useAuth()

const fetchSchools = async () => {
  try {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchTerm) params.append("search", searchTerm)
    if (selectedType !== "ALL") params.append("schoolType", selectedType)
    if (selectedStatus !== "ALL") params.append("status", selectedStatus === "ACTIVE" ? "APPROVED" : "PENDING")

    const response = await fetch(`/api/schools?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`, // Add this line
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to fetch schools")
    }

    const data = await response.json()
    setSchools(data.schools || [])
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to fetch schools",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}

const handleCreateSchool = async () => {
  try {
    const schoolData: any = {
      ...formData,
      establishedYear: formData.establishedYear ? Number.parseInt(formData.establishedYear) : undefined,
    }

    // Remove fields based on admin creation mode
    if (adminCreationMode === "existing") {
      // Keep only adminUserId, remove new admin fields
      delete schoolData.adminEmail
      delete schoolData.adminUsername
      delete schoolData.adminName
      delete schoolData.adminSurname
    } else {
      // Keep new admin fields, remove adminUserId
      delete schoolData.adminUserId
    }

    // Filter out empty string fields to avoid validation errors
    Object.keys(schoolData).forEach(key => {
      if (schoolData[key] === "") {
        delete schoolData[key]
      }
    })

    let response

    if (formData.logo) {
      // Use FormData for file upload
      const formDataToSend = new FormData()

      // Add all school data fields
      Object.keys(schoolData).forEach(key => {
        if (key !== 'logo' && schoolData[key] !== null && schoolData[key] !== undefined) {
          formDataToSend.append(key, schoolData[key].toString())
        }
      })

      // Add logo file
      formDataToSend.append('logo', formData.logo)

      response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      })
    } else {
      // Use JSON for regular creation
      response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(schoolData),
      })
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create school")
    }

    const data = await response.json()

    toast({
      title: "Success",
      description: data.message || "School created successfully",
    })

    setIsCreateDialogOpen(false)
    resetForm()
    fetchSchools()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to create school",
      variant: "destructive",
    })
  }
}

const handleUpdateSchool = async () => {
  if (!editingSchool) return
  try {
    const schoolData = {
      ...formData,
      establishedYear: formData.establishedYear ? Number.parseInt(formData.establishedYear) : undefined,
    }

    const response = await fetch(`/api/schools/${editingSchool.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`, // Add this line
      },
      body: JSON.stringify(schoolData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update school")
    }

    toast({
      title: "Success",
      description: "School updated successfully",
    })
    setEditingSchool(null)
    resetForm()
    fetchSchools()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to update school",
      variant: "destructive",
    })
  }
}

const handleDeleteSchool = async (schoolId: string) => {
  if (!confirm("Are you sure you want to delete this school? This action cannot be undone.")) {
    return
  }
  try {
    const response = await fetch(`/api/schools/${schoolId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete school")
    }

    toast({
      title: "Success",
      description: "School deleted successfully",
    })
    fetchSchools()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete school",
      variant: "destructive",
    })
  }
}

const handleVerifySchool = async (schoolId: string, isVerified: boolean) => {
  try {
    const response = await fetch(`/api/schools/${schoolId}/verify`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: isVerified ? "APPROVED" : "REJECTED" }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to verify school")
    }

    const data = await response.json()
    toast({
      title: "Success",
      description: data.message || "School verification updated successfully",
    })
    fetchSchools()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to verify school",
      variant: "destructive",
    })
  }
}
const handleLogoUpload = async (schoolId: string, files: FileList) => {
  if (files.length === 0) return
  try {
    setUploadingLogo(schoolId)
    const logoFile = files[0]

    const formData = new FormData()
    formData.append("logo", logoFile) // Change "file" to "logo" (or whatever your backend expects)

    const response = await fetch(`/api/schools/${schoolId}/logo`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload logo")
    }

    toast({
      title: "Success",
      description: "School logo uploaded successfully",
    })
    fetchSchools()
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to upload logo",
      variant: "destructive",
    })
  } finally {
    setUploadingLogo(null)
  }
}
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      email: "",
      schoolType: "PRIMARY",
      missionStatement: "",
      establishedYear: "",
      adminUserId: "",
      adminEmail: "",
      adminUsername: "",
      adminName: "",
      adminSurname: "",
      logo: null,
    })
    setAdminCreationMode("new")
  }

  const openEditDialog = (school: School) => {
    setEditingSchool(school)
    setFormData({
      name: school.name,
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      country: school.country || "",
      postalCode: school.postalCode || "",
      phone: school.phone || "",
      email: school.email || "",
      schoolType: school.schoolType,
      missionStatement: school.missionStatement || "",
      establishedYear: school.establishedYear?.toString() || "",
      adminUserId: "", // Admin details are for creation only, not update
      adminEmail: "",
      adminUsername: "",
      adminName: "",
      adminSurname: "",
      logo: null, // Logo is for creation only, not update
    })
  }

  const getSchoolStatus = (school: School) => {
    return school.registrationStatus === "APPROVED" ? "ACTIVE" : "INACTIVE"
  }

  const canManageSchools = user?.role === "SUPER_ADMIN"

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Schools Management" subtitle="Manage educational institutions" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="PRIMARY">Primary</SelectItem>
                    <SelectItem value="SECONDARY">Secondary</SelectItem>
                    <SelectItem value="MONTESSORI">Montessori</SelectItem>
                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="UNIVERSITY">University</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canManageSchools && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add School
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New School</DialogTitle>
                      <DialogDescription>Add a new school to the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">School Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter school name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">School Type *</Label>
                          <Select
                            value={formData.schoolType}
                            onValueChange={(value: SchoolType) => setFormData({ ...formData, schoolType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRIMARY">Primary</SelectItem>
                              <SelectItem value="SECONDARY">Secondary</SelectItem>
                              <SelectItem value="MONTESSORI">Montessori</SelectItem>
                              <SelectItem value="INTERNATIONAL">International</SelectItem>
                              <SelectItem value="TECHNICAL">Technical</SelectItem>
                              <SelectItem value="UNIVERSITY">University</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="establishedYear">Established Year</Label>
                          <Input
                            id="establishedYear"
                            type="number"
                            value={formData.establishedYear}
                            onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                            placeholder="2000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="School address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="Country"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            placeholder="Postal Code"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="info@school.edu"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missionStatement">Mission Statement</Label>
                        <Textarea
                          id="missionStatement"
                          value={formData.missionStatement}
                          onChange={(e) => setFormData({ ...formData, missionStatement: e.target.value })}
                          placeholder="School mission statement"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo">School Logo</Label>
                        <FileUpload
                          accept="image/*"
                          maxSize={5}
                          maxFiles={1}
                          onFileSelect={(files) => {
                            const file = files[0]
                            setFormData({ ...formData, logo: file || null })
                          }}
                          variant="default"
                          className="w-full"
                        >
                          {formData.logo ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{formData.logo.name}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({ ...formData, logo: null })}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Click to upload school logo (optional)</span>
                          )}
                        </FileUpload>
                      </div>

                      {/* Admin User Details */}
                      <h3 className="text-lg font-semibold mt-4 col-span-full">School Admin Setup *</h3>
                      <p className="text-sm text-muted-foreground col-span-full">
                        Choose how to set up the school administrator.
                      </p>

                      {/* Admin Creation Mode Selection */}
                      <div className="space-y-3 col-span-full">
                        <Label>Admin Setup Option *</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="adminMode"
                              value="new"
                              checked={adminCreationMode === "new"}
                              onChange={(e) => setAdminCreationMode(e.target.value as "new")}
                            />
                            <span>Create New Admin User</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="adminMode"
                              value="existing"
                              checked={adminCreationMode === "existing"}
                              onChange={(e) => setAdminCreationMode(e.target.value as "existing")}
                            />
                            <span>Link Existing User</span>
                          </label>
                        </div>
                      </div>

                      {adminCreationMode === "existing" ? (
                        <div className="space-y-2 col-span-full">
                          <Label htmlFor="adminUserId">Existing User ID *</Label>
                          <Input
                            id="adminUserId"
                            value={formData.adminUserId}
                            onChange={(e) => setFormData({ ...formData, adminUserId: e.target.value })}
                            placeholder="Enter existing user UUID"
                            required
                          />
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4 col-span-full">
                            <div className="space-y-2">
                              <Label htmlFor="adminName">Admin First Name *</Label>
                              <Input
                                id="adminName"
                                value={formData.adminName}
                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="John"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="adminSurname">Admin Last Name *</Label>
                              <Input
                                id="adminSurname"
                                value={formData.adminSurname}
                                onChange={(e) => setFormData({ ...formData, adminSurname: e.target.value })}
                                placeholder="Doe"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2 col-span-full">
                            <Label htmlFor="adminEmail">Admin Email *</Label>
                            <Input
                              id="adminEmail"
                              type="email"
                              value={formData.adminEmail}
                              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                              placeholder="admin@school.edu"
                              required
                            />
                          </div>
                          <div className="space-y-2 col-span-full">
                            <Label htmlFor="adminUsername">Admin Username *</Label>
                            <Input
                              id="adminUsername"
                              value={formData.adminUsername}
                              onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                              placeholder="admin.school"
                              required
                            />
                          </div>
                        </>
                      )}

                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSchool}>Create School</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Schools Grid */}
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
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"></div>
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
            ) : schools.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Building className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No schools found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedType !== "ALL" || selectedStatus !== "ALL"
                      ? "We couldn't find any schools matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your educational network by adding your first school to the platform."}
                  </p>
                  {canManageSchools && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First School
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {schools.map((school) => {
                  const schoolStatus = getSchoolStatus(school)
                  return (
                    <Card
                      key={school.id}
                      className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {canManageSchools ? (
                                <FileUpload
                                  accept="image/*"
                                  maxSize={5}
                                  maxFiles={1}
                                  onFileSelect={(files) => handleLogoUpload(school.id, files)}
                                  disabled={uploadingLogo === school.id}
                                  variant="avatar"
                                  className="w-16 h-16"
                                  showPreview={false}
                                >
                                  <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                    <AvatarImage src={school.logoUrl || "/placeholder.svg"} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                      <Building className="w-6 h-6" />
                                    </AvatarFallback>
                                  </Avatar>
                                </FileUpload>
                              ) : (
                                <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                  <AvatarImage src={school.logoUrl || "/placeholder.svg"} className="object-cover" />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                    <Building className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {uploadingLogo === school.id && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {school.name}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  {school.schoolType}
                                </Badge>
                                <Badge
                                  variant={schoolStatus === "ACTIVE" ? "default" : "secondary"}
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    schoolStatus === "ACTIVE"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {schoolStatus === "ACTIVE" ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {canManageSchools && (
                            <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(school)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {!school.isVerified && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerifySchool(school.id, true)}
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                  title="Verify School"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSchool(school.id)}
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
                          {(school.address || school.city || school.state || school.country || school.postalCode) && (
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {[school.address, school.city, school.state, school.country, school.postalCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                <Phone className="w-3 h-3 text-blue-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{school.phone}</p>
                            </div>
                          )}
                          {school.email && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium truncate">{school.email}</p>
                            </div>
                          )}
                          {school.website && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                <Globe className="w-3 h-3 text-purple-600" />
                              </div>
                              <a
                                href={school.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors truncate"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                          {school.virtualTourUrl && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Link className="w-3 h-3 text-indigo-600" />
                              </div>
                              <a
                                href={school.virtualTourUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors"
                              >
                                Take Virtual Tour
                              </a>
                            </div>
                          )}
                        </div>
                        {/* Mission Statement */}
                        {school.missionStatement && (
                          <div className="mb-6">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">
                                "{school.missionStatement}"
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Statistics Section */}
                        {school._count && (
                          <div className="mb-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-blue-500 p-1.5 rounded-lg">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-blue-700">{school._count.students}</p>
                                <p className="text-xs text-blue-600 font-medium">Students</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-emerald-500 p-1.5 rounded-lg">
                                    <UserCheck className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-emerald-700">{school._count.teachers}</p>
                                <p className="text-xs text-emerald-600 font-medium">Teachers</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-purple-500 p-1.5 rounded-lg">
                                    <Users className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-purple-700">{school._count.classes}</p>
                                <p className="text-xs text-purple-600 font-medium">Classes</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          {school.establishedYear && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-500 font-medium">Est. {school.establishedYear}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 font-medium">
                            ID: {school.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingSchool} onOpenChange={() => setEditingSchool(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit School</DialogTitle>
                  <DialogDescription>Update school information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">School Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">School Type *</Label>
                      <Select
                        value={formData.schoolType}
                        onValueChange={(value: SchoolType) => setFormData({ ...formData, schoolType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIMARY">Primary</SelectItem>
                          <SelectItem value="SECONDARY">Secondary</SelectItem>
                          <SelectItem value="MONTESSORI">Montessori</SelectItem>
                          <SelectItem value="INTERNATIONAL">International</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="UNIVERSITY">University</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-establishedYear">Established Year</Label>
                      <Input
                        id="edit-establishedYear"
                        type="number"
                        value={formData.establishedYear}
                        onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                        placeholder="2000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="School address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-country">Country</Label>
                      <Input
                        id="edit-country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-postalCode">Postal Code</Label>
                      <Input
                        id="edit-postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@school.edu"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-missionStatement">Mission Statement</Label>
                    <Textarea
                      id="edit-missionStatement"
                      value={formData.missionStatement}
                      onChange={(e) => setFormData({ ...formData, missionStatement: e.target.value })}
                      placeholder="School mission statement"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingSchool(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSchool}>Update School</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  )
}
