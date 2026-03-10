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
  MoonIcon as Venus,
  SpaceIcon as Mars,
  CircleDot,
} from "lucide-react"

// Define the Teacher type based on the provided backend schema
type Sex = "MALE" | "FEMALE" | "OTHER"
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

interface Teacher {
  id: string // This is the userId linked to the teacher record
  bloodType: string | null
  sex: Sex | null
  birthday: string | null // ISO string
  bio: string | null
  qualifications: string | null
  createdAt: string
  updatedAt: string
  approvalStatus: ApprovalStatus | null
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
  subjects: {
    id: string
    name: string
  }[]
  supervisedClasses: {
    id: string
    name: string
  }[]
  approval: {
    status: ApprovalStatus
  } | null // Teacher might not have an approval record yet
  _count?: {
    subjects: number
    supervisedClasses: number
    lessons: number
  }
}

// Mock data for subjects and schools for the form selects
const mockSubjects = [
  { id: "sub1", name: "Mathematics" },
  { id: "sub2", name: "Science" },
  { id: "sub3", name: "History" },
  { id: "sub4", name: "English" },
  { id: "sub5", name: "Art" },
]

// NOTE: In a real application, you would fetch these schools from your API
// For now, we'll use the availableSchools from useAuth or mock data if not available.
// const mockSchools = [
//   { id: "school1", name: "Central High School" },
//   { id: "school2", name: "Riverside Primary" },
//   { id: "school3", name: "Greenwood University" },
// ]

export default function TeachersPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("all")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [uploadingProfileImage, setUploadingProfileImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // User creation fields
    email: "",
    name: "",
    surname: "",
    username: "",
    // Teacher-specific fields
    schoolId: "", // Will be set by useEffect
    sex: "" as Sex | "",
    birthday: "", // YYYY-MM-DD format for input type="date"
    profileImageUrl: "", // For direct URL input or display after upload
    profileImage: null as File | null, // Profile image file
  })
  const [createdTeacherCredentials, setCreatedTeacherCredentials] = useState<{
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
    fetchTeachers()
  }, [searchTerm, selectedSubject, selectedApprovalStatus, selectedSchoolFilter]) // Depend on filters

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedSubject !== "all") params.append("subjectId", selectedSubject) // Assuming backend filters by subjectId
      if (selectedApprovalStatus !== "all") params.append("approvalStatus", selectedApprovalStatus)

      // Apply school filter based on user role and selected filter
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter !== "all") {
        params.append("schoolId", selectedSchoolFilter)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/teachers?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch teachers")
      }
      const data = await response.json()
      setTeachers(data.teachers || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch teachers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeacher = async () => {
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
      const teacherData: any = {
        email: formData.email,
        name: formData.name,
        surname: formData.surname,
        username: formData.username,
        schoolId: formData.schoolId,
        sex: formData.sex || undefined,
        birthday: formData.birthday ? new Date(formData.birthday).toISOString() : undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      }

      // Filter out empty string fields
      Object.keys(teacherData).forEach(key => {
        if (teacherData[key] === "") {
          delete teacherData[key]
        }
      })

      let response

      if (formData.profileImage) {
        // Use FormData for file upload
        const formDataToSend = new FormData()

        // Add all teacher data fields
        Object.keys(teacherData).forEach(key => {
          if (key !== 'profileImage' && teacherData[key] !== null && teacherData[key] !== undefined) {
            formDataToSend.append(key, teacherData[key].toString())
          }
        })

        // Add profile image file
        formDataToSend.append('profileImage', formData.profileImage)

        response = await fetch("/api/teachers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataToSend,
        })
      } else {
        // Use JSON for regular creation
        response = await fetch("/api/teachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(teacherData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create teacher")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Teacher created successfully",
      })

      // Show generated credentials if they were created
      if (data.generatedCredentials) {
        setCreatedTeacherCredentials(data.generatedCredentials)
      }

      setIsCreateDialogOpen(false)
      resetForm()
      fetchTeachers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return
    try {
      const teacherData = {
        sex: formData.sex || undefined,
        birthday: formData.birthday ? new Date(formData.birthday).toISOString() : undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
      }
      const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(teacherData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update teacher")
      }
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      })
      setEditingTeacher(null)
      resetForm()
      fetchTeachers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete teacher")
      }
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      })
      fetchTeachers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      })
    }
  }

  const handleVerifyTeacher = async (teacherId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to verify teacher")
      }
      const data = await response.json()
      toast({
        title: "Success",
        description: data.message || `Teacher ${status.toLowerCase()} successfully`,
      })
      fetchTeachers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify teacher",
        variant: "destructive",
      })
    }
  }

  const handleProfileImageUpload = async (teacherId: string, files: FileList) => {
    if (files.length === 0) return
    try {
      setUploadingProfileImage(teacherId)
      const imageFile = files[0]
      const formData = new FormData()
      formData.append("profileImage", imageFile) // Assuming backend expects "profileImage"
      const response = await fetch(`/api/teachers/${teacherId}/profile-image`, {
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
        description: "Teacher profile image uploaded successfully",
      })
      fetchTeachers()
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
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""), // Reset based on user role
      sex: "",
      birthday: "",
      profileImageUrl: "",
      profileImage: null,
    })
    setCreatedTeacherCredentials(null)
  }

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      email: teacher.user.email,
      name: teacher.user.name || "",
      surname: teacher.user.surname || "",
      username: teacher.user.username,
      schoolId: teacher.school.id,
      sex: teacher.sex || "",
      birthday: teacher.birthday ? new Date(teacher.birthday).toISOString().split("T")[0] : "", // Format for input type="date"
      profileImageUrl: teacher.user.profileImageUrl || "",
      profileImage: null, // Profile image is for creation only, not update
    })
  }

  const getTeacherApprovalStatus = (teacher: Teacher) => {
    return teacher.approvalStatus || teacher.approval?.status || "PENDING"
  }

  const canManageTeachers = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Teachers Management" subtitle="Manage educators and their profiles" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search teachers..."
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
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Subjects">
                      {selectedSubject === "all" ? "All Subjects" : "Select subject"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {mockSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {canManageTeachers && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Teacher</DialogTitle>
                      <DialogDescription>Create a new teacher account and profile.</DialogDescription>
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
                      {user?.role === "SUPER_ADMIN" && (
                        <>
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
                        </>
                      )}
                      {/* Teacher Profile Fields */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Profile Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sex">Sex</Label>
                            <Select
                              value={formData.sex}
                              onValueChange={(value: Sex) => setFormData({ ...formData, sex: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sex" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="birthday">Birthday</Label>
                            <Input
                              id="birthday"
                              type="date"
                              value={formData.birthday}
                              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileImage">Profile Image</Label>
                          <FileUpload
                            accept="image/*"
                            maxSize={5}
                            maxFiles={1}
                            onFileSelect={(files) => {
                              const file = files[0]
                              setFormData({ ...formData, profileImage: file || null })
                            }}
                            variant="default"
                            className="w-full"
                          >
                            {formData.profileImage ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{formData.profileImage.name}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setFormData({ ...formData, profileImage: null })}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Click to upload profile image (optional)</span>
                            )}
                          </FileUpload>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTeacher}>Create Teacher</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Teachers Grid */}
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
            ) : teachers.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No teachers found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedSubject !== "all" || selectedApprovalStatus !== "all" || selectedSchoolFilter !== "all"
                      ? "We couldn't find any teachers matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your educational network by adding your first teacher to the platform."}
                  </p>
                  {canManageTeachers && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Teacher
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {teachers.map((teacher) => {
                  const approvalStatus = getTeacherApprovalStatus(teacher)
                  return (
                    <Card
                      key={teacher.id}
                      className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {canManageTeachers ? (
                                <FileUpload
                                  accept="image/*"
                                  maxSize={5}
                                  maxFiles={1}
                                  onFileSelect={(files) => handleProfileImageUpload(teacher.id, files)}
                                  disabled={uploadingProfileImage === teacher.id}
                                  variant="avatar"
                                  className="w-16 h-16"
                                  showPreview={false}
                                >
                                  <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                    <AvatarImage
                                      src={teacher.user.profileImageUrl || "/placeholder.svg"}
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
                                    src={teacher.user.profileImageUrl || "/placeholder.svg"}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {uploadingProfileImage === teacher.id && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {teacher.user.name} {teacher.user.surname}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  @{teacher.user.username}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                                >
                                  {teacher.school.name}
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
                          {canManageTeachers && (
                            <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(teacher)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {approvalStatus === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerifyTeacher(teacher.id, "APPROVED")}
                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                    title="Approve Teacher"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVerifyTeacher(teacher.id, "REJECTED")}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                    title="Reject Teacher"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTeacher(teacher.id)}
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
                          {teacher.user.email && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium truncate">{teacher.user.email}</p>
                            </div>
                          )}
                          {teacher.qualifications && (
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center">
                                <BookOpen className="w-3 h-3 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {teacher.qualifications}
                              </p>
                            </div>
                          )}
                          {teacher.bloodType && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                <HeartPulse className="w-3 h-3 text-red-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">Blood Type: {teacher.bloodType}</p>
                            </div>
                          )}
                          {teacher.sex && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                {teacher.sex === "MALE" ? (
                                  <Mars className="w-3 h-3 text-purple-600" />
                                ) : teacher.sex === "FEMALE" ? (
                                  <Venus className="w-3 h-3 text-purple-600" />
                                ) : (
                                  <CircleDot className="w-3 h-3 text-purple-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-700 font-medium">Sex: {teacher.sex}</p>
                            </div>
                          )}
                          {teacher.birthday && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                                <CalendarDays className="w-3 h-3 text-orange-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">
                                Birthday: {new Date(teacher.birthday).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Bio */}
                        {teacher.bio && (
                          <div className="mb-6">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">
                                "{teacher.bio}"
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Statistics Section */}
                        {teacher._count && (
                          <div className="mb-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-blue-500 p-1.5 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-blue-700">{teacher._count.subjects}</p>
                                <p className="text-xs text-blue-600 font-medium">Subjects</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-emerald-500 p-1.5 rounded-lg">
                                    <Users className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-emerald-700">{teacher._count.supervisedClasses}</p>
                                <p className="text-xs text-emerald-600 font-medium">Classes</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-purple-500 p-1.5 rounded-lg">
                                    <UserCheck className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-purple-700">{teacher._count.lessons}</p>
                                <p className="text-xs text-purple-600 font-medium">Lessons</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500 font-medium">
                            Created: {new Date(teacher.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            ID: {teacher.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingTeacher} onOpenChange={() => setEditingTeacher(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Teacher</DialogTitle>
                  <DialogDescription>Update teacher profile information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-sex">Sex</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value: Sex) => setFormData({ ...formData, sex: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-birthday">Birthday</Label>
                    <Input
                      id="edit-birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
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
                  <Button variant="outline" onClick={() => setEditingTeacher(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTeacher}>Update Teacher</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Teacher Credentials Dialog */}
            <Dialog open={!!createdTeacherCredentials} onOpenChange={() => setCreatedTeacherCredentials(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Teacher Created Successfully</DialogTitle>
                  <DialogDescription>
                    The teacher account has been created. Here are the login credentials:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      {createdTeacherCredentials?.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                      {createdTeacherCredentials?.password}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• A welcome email has been sent to the teacher with login instructions</p>
                    <p>• The teacher should change their password after first login</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setCreatedTeacherCredentials(null)}>
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
