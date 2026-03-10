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
import { FileUpload } from "@/components/ui/file-upload"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  School,
  Hash,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  HeartPulse,
  MoonIcon as Venus,
  SpaceIcon as Mars,
  CircleDot,
  CalendarDays,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
  FileText,
  ClipboardCheck,
} from "lucide-react"

// Define Student related types
type Sex = "MALE" | "FEMALE" | "OTHER"
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED"

interface SchoolDropdown {
  id: string
  name: string
}

interface GradeDropdown {
  id: string
  name: string
  level: number
}

interface ClassDropdown {
  id: string
  name: string
  grade: { name: string; level: number } | null
}

interface ParentDropdown {
  id: string
  user: {
    name: string | null
    surname: string | null
    email: string
  }
}

interface Student {
  id: string
  registrationNumber: string
  name: string
  surname: string
  address: string | null
  imageUrl: string | null
  bloodType: string | null
  sex: Sex | null
  birthday: string | null // ISO string
  schoolId: string
  classId: string | null
  gradeId: string | null
  verificationStatus: VerificationStatus
  createdAt: string
  updatedAt: string
  school: {
    id: string
    name: string
    city: string
  }
  parent: {
    id: string
    user: {
      id: string
      email: string
      name: string | null
      surname: string | null
      phone: string | null
      address: string | null
    }
  }
  class: {
    id: string
    name: string
    grade: { name: string; level: number } | null
  } | null
  grade: {
    name: string
    level: number
  } | null
  _count?: {
    attendances: number
    results: number
    assignmentSubmissions: number
  }
}

interface ParentDetail {
  email: string
  username: string
  name: string
  surname: string
  phone?: string
  address?: string
  relationship: "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER"
  isPrimary: boolean
}

interface ParentRelationship {
  parentId: string
  relationship: "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER"
  isPrimary: boolean
}

export default function StudentsPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [schoolsList, setSchoolsList] = useState<SchoolDropdown[]>([])
  const [gradesList, setGradesList] = useState<GradeDropdown[]>([])
  const [classesList, setClassesList] = useState<ClassDropdown[]>([])
  const [parentsList, setParentsList] = useState<ParentDropdown[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("ALL")
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("ALL")
  const [selectedVerificationStatusFilter, setSelectedVerificationStatusFilter] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isCreatingNewParent, setIsCreatingNewParent] = useState(true) // Toggle for parent creation in form
  const [uploadingProfileImage, setUploadingProfileImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    registrationNumber: "",
    name: "",
    surname: "",
    address: "",
    imageUrl: "",
    bloodType: "",
    sex: "" as Sex | "",
    birthday: "", // YYYY-MM-DD format for input type="date"
    schoolId: currentSchool || "",
    classId: "",
    gradeId: "",
    // Multiple parent support
    parentDetails: [] as ParentDetail[],
    parentRelationships: [] as ParentRelationship[],
    // Legacy single parent fields (for backward compatibility)
    parentEmail: "",
    parentUsername: "",
    parentPassword: "",
    parentName: "",
    parentSurname: "",
    parentPhone: "",
    parentAddress: "",
    parentId: "",
  })

  // Update schoolId in formData and filters when currentSchool changes
  useEffect(() => {
    if (currentSchool) {
      setFormData((prev) => ({ ...prev, schoolId: currentSchool }))
      setSelectedSchoolFilter(currentSchool)
    }
  }, [currentSchool])

  // Fetch students based on filters
  useEffect(() => {
    fetchStudents()
  }, [searchTerm, selectedSchoolFilter, selectedClassFilter, selectedGradeFilter, selectedVerificationStatusFilter])

  // Fetch dropdown data (schools, grades, classes, parents)
  useEffect(() => {
    fetchSchoolsList()
    fetchGradesList()
    fetchClassesList()
    fetchParentsList()
  }, [accessToken, currentSchool, user?.role])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      // Apply school filter based on user role and selected filter
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter !== "ALL") {
        params.append("schoolId", selectedSchoolFilter)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      if (selectedClassFilter !== "ALL") params.append("classId", selectedClassFilter)
      if (selectedGradeFilter !== "ALL") params.append("gradeId", selectedGradeFilter)
      if (selectedVerificationStatusFilter !== "ALL")
        params.append("verificationStatus", selectedVerificationStatusFilter)

      const response = await fetch(`/api/students?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch students")
      }
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolsList = async () => {
    try {
      // Only Super Admin can select any school, others are limited by currentSchool
      const params = new URLSearchParams()
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("id", currentSchool) // Fetch only the current school
      }
      const response = await fetch(`/api/schools?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch schools for dropdown")
      }
      const data = await response.json()
      setSchoolsList(data.schools || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load schools for form",
        variant: "destructive",
      })
    }
  }

  const fetchGradesList = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams()
      // If schoolId is provided, filter by that school, otherwise use current school restrictions
      if (schoolId) {
        params.append("schoolId", schoolId)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }
      const response = await fetch(`/api/grades?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch grades for dropdown")
      }
      const data = await response.json()
      setGradesList(data.grades || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load grades for form",
        variant: "destructive",
      })
    }
  }

  const fetchClassesList = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams()
      // If schoolId is provided, filter by that school, otherwise use current school restrictions
      if (schoolId) {
        params.append("schoolId", schoolId)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }
      const response = await fetch(`/api/classes?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch classes for dropdown")
      }
      const data = await response.json()
      setClassesList(data.classes || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load classes for form",
        variant: "destructive",
      })
    }
  }

  const fetchParentsList = async () => {
    try {
      // Only Super Admin can see all parents, others see parents associated with their school's students
      const params = new URLSearchParams()
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool) // Assuming a backend endpoint to filter parents by school
      }
      const response = await fetch(`/api/parents?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch parents for dropdown")
      }
      const data = await response.json()
      setParentsList(data.parents || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load parents for form",
        variant: "destructive",
      })
    }
  }

  const filterGradesAndClassesBySchool = async (schoolId: string) => {
    if (!schoolId) {
      // If no school selected, show all grades and classes (based on user permissions)
      await fetchGradesList()
      await fetchClassesList()
      return
    }

    // Fetch grades and classes filtered by the selected school
    await fetchGradesList(schoolId)
    await fetchClassesList(schoolId)
  }

  // Filter grades and classes when school selection changes
  useEffect(() => {
    filterGradesAndClassesBySchool(formData.schoolId)
  }, [formData.schoolId])

  const handleCreateStudent = async () => {
    try {
      // Basic validation for student details
      if (!formData.registrationNumber || !formData.name || !formData.surname || !formData.schoolId) {
        toast({
          title: "Error",
          description: "Please fill in all required student details.",
          variant: "destructive",
        })
        return
      }

      // Validate parent information
      if (isCreatingNewParent) {
        if (formData.parentDetails.length === 0) {
          toast({
            title: "Error",
            description: "Please add at least one parent.",
            variant: "destructive",
          })
          return
        }

        // Validate that at least one parent is marked as primary
        const hasPrimary = formData.parentDetails.some(parent => parent.isPrimary)
        if (!hasPrimary) {
          toast({
            title: "Error",
            description: "At least one parent must be marked as primary.",
            variant: "destructive",
          })
          return
        }

        // Validate each parent detail
        for (const parent of formData.parentDetails) {
          if (!parent.email || !parent.username || !parent.name || !parent.surname) {
            toast({
              title: "Error",
              description: "Please fill in all required details for each parent.",
              variant: "destructive",
            })
            return
          }
        }
      } else {
        if (formData.parentRelationships.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one existing parent.",
            variant: "destructive",
          })
          return
        }

        // Validate that at least one relationship is marked as primary
        const hasPrimary = formData.parentRelationships.some(rel => rel.isPrimary)
        if (!hasPrimary) {
          toast({
            title: "Error",
            description: "At least one parent relationship must be marked as primary.",
            variant: "destructive",
          })
          return
        }
      }

      const payload: any = {
        registrationNumber: formData.registrationNumber,
        name: formData.name,
        surname: formData.surname,
        address: formData.address || undefined,
        imageUrl: formData.imageUrl || undefined,
        bloodType: formData.bloodType || undefined,
        sex: formData.sex || undefined,
        birthday: formData.birthday ? new Date(formData.birthday).toISOString() : undefined,
        schoolId: formData.schoolId,
        classId: formData.classId || undefined,
        gradeId: formData.gradeId || undefined,
      }

      if (isCreatingNewParent) {
        payload.parentDetails = formData.parentDetails
      } else {
        payload.parentRelationships = formData.parentRelationships
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create student")
      }

      const data = await response.json()

      // Show success message with parent creation details
      let successMessage = "Student created successfully"
      if (data.parentsCreated > 0) {
        successMessage += ` with ${data.parentsCreated} parent account(s) created and ${data.emailsSent} welcome email(s) sent.`
      }

      toast({
        title: "Success",
        description: successMessage,
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchStudents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return
    try {
      const payload = {
        registrationNumber: formData.registrationNumber,
        name: formData.name,
        surname: formData.surname,
        address: formData.address || undefined,
        imageUrl: formData.imageUrl || undefined,
        bloodType: formData.bloodType || undefined,
        sex: formData.sex || undefined,
        birthday: formData.birthday ? new Date(formData.birthday).toISOString() : undefined,
        classId: formData.classId || undefined,
        gradeId: formData.gradeId || undefined,
        // verificationStatus is updated via a separate action if needed, or by Super Admin
      }

      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update student")
      }
      toast({
        title: "Success",
        description: "Student updated successfully",
      })
      setEditingStudent(null)
      resetForm()
      fetchStudents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete student")
      }
      toast({
        title: "Success",
        description: "Student deleted successfully",
      })
      fetchStudents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      })
    }
  }

  const handleProfileImageUpload = async (studentId: string, files: FileList) => {
    if (files.length === 0) return
    try {
      setUploadingProfileImage(studentId)
      const imageFile = files[0]
      const formData = new FormData()
      formData.append("profileImage", imageFile) // Assuming backend expects "profileImage"
      const response = await fetch(`/api/students/${studentId}/profile-image`, {
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
        description: "Student profile image uploaded successfully",
      })
      fetchStudents()
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

  const handleUpdateVerificationStatus = async (studentId: string, status: VerificationStatus) => {
    if (!confirm(`Are you sure you want to set this student's status to ${status}?`)) {
      return
    }
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ verificationStatus: status }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update verification status")
      }
      toast({
        title: "Success",
        description: `Student verification status updated to ${status}.`,
      })
      fetchStudents()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      registrationNumber: "",
      name: "",
      surname: "",
      address: "",
      imageUrl: "",
      bloodType: "",
      sex: "",
      birthday: "",
      schoolId: currentSchool || "",
      classId: "",
      gradeId: "",
      parentDetails: [],
      parentRelationships: [],
      parentEmail: "",
      parentUsername: "",
      parentPassword: "",
      parentName: "",
      parentSurname: "",
      parentPhone: "",
      parentAddress: "",
      parentId: "",
    })
    setIsCreatingNewParent(true) // Reset to default for new parent creation
  }

  const openEditDialog = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      registrationNumber: student.registrationNumber,
      name: student.name,
      surname: student.surname,
      address: student.address || "",
      imageUrl: student.imageUrl || "",
      bloodType: student.bloodType || "",
      sex: student.sex || "",
      birthday: student.birthday ? new Date(student.birthday).toISOString().split("T")[0] : "",
      schoolId: student.schoolId,
      classId: student.classId || "",
      gradeId: student.gradeId || "",
      parentDetails: [], // Not applicable for edit
      parentRelationships: [], // Not applicable for edit
      parentEmail: "", // Not applicable for edit
      parentUsername: "", // Not applicable for edit
      parentPassword: "", // Not applicable for edit
      parentName: "", // Not applicable for edit
      parentSurname: "", // Not applicable for edit
      parentPhone: "", // Not applicable for edit
      parentAddress: "", // Not applicable for edit
      parentId: student.parent.id, // Keep existing parent ID
    })
  }

  const canManageStudents = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"
  const canVerifyStudents = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Helper to get school name from ID
  const getSchoolName = (schoolId: string) => {
    const school = schoolsList.find((s) => s.id === schoolId)
    return school ? school.name : "Unknown School"
  }

  // Helper to get grade name from ID
  const getGradeName = (gradeId: string | null) => {
    if (!gradeId) return "N/A"
    const grade = gradesList.find((g) => g.id === gradeId)
    return grade ? grade.name : "Unknown Grade"
  }

  // Helper to get class name from ID
  const getClassName = (classId: string | null) => {
    if (!classId) return "N/A"
    const classRecord = classesList.find((c) => c.id === classId)
    return classRecord ? classRecord.name : "Unknown Class"
  }

  // Helper to get parent name from ID
  const getParentName = (parentId: string) => {
    const parent = parentsList.find((p) => p.id === parentId)
    return parent
      ? `${parent.user.name || ""} ${parent.user.surname || ""}`.trim() || parent.user.email
      : "Unknown Parent"
  }

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Student Management" subtitle="Manage student profiles and records" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students..."
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
                      {schoolsList.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {classesList.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.grade?.name || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Grades</SelectItem>
                    {gradesList.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canVerifyStudents && (
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
                )}
              </div>
              {canManageStudents && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Student</DialogTitle>
                      <DialogDescription>Register a new student and link to a parent.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Student Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Student Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">First Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Alice"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="surname">Last Name *</Label>
                            <Input
                              id="surname"
                              value={formData.surname}
                              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                              placeholder="Smith"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Registration Number *</Label>
                          <Input
                            id="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                            placeholder="STU-001"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bloodType">Blood Type</Label>
                            <Input
                              id="bloodType"
                              value={formData.bloodType}
                              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                              placeholder="O+"
                            />
                          </div>
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
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Oak Ave"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imageUrl">Profile Image URL</Label>
                          <Input
                            id="imageUrl"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://example.com/student.jpg"
                          />
                        </div>
                      </div>

                      {/* School, Class, Grade Assignment */}
                      <div className="space-y-4 mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Academic Assignment</h4>
                        {user?.role === "SUPER_ADMIN" && (
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
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gradeId">Grade</Label>
                            <Select
                              value={formData.gradeId}
                              onValueChange={(value) =>
                                setFormData({ ...formData, gradeId: value === "__NONE__" ? "" : value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a grade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__NONE__">None</SelectItem>
                                {gradesList.map((grade) => (
                                  <SelectItem key={grade.id} value={grade.id}>
                                    {grade.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="classId">Class</Label>
                            <Select
                              value={formData.classId}
                              onValueChange={(value) =>
                                setFormData({ ...formData, classId: value === "__NONE__" ? "" : value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__NONE__">None</SelectItem>
                                {classesList.map((classItem) => (
                                  <SelectItem key={classItem.id} value={classItem.id}>
                                    {classItem.name} ({classItem.grade?.name || "N/A"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Parent Details */}
                      <div className="space-y-4 mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Parent Details</h4>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="createNewParent"
                            checked={isCreatingNewParent}
                            onChange={(e) => setIsCreatingNewParent(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Label htmlFor="createNewParent">Create New Parent Account(s)</Label>
                        </div>

                        {isCreatingNewParent ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Parent Accounts</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newParent: ParentDetail = {
                                    email: "",
                                    username: "",
                                    name: "",
                                    surname: "",
                                    phone: "",
                                    address: "",
                                    relationship: "MOTHER",
                                    isPrimary: formData.parentDetails.length === 0 // First parent is primary by default
                                  }
                                  setFormData({
                                    ...formData,
                                    parentDetails: [...formData.parentDetails, newParent]
                                  })
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Parent
                              </Button>
                            </div>

                            {formData.parentDetails.map((parent, index) => (
                              <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium text-gray-900">Parent {index + 1}</h5>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedParents = formData.parentDetails.filter((_, i) => i !== index)
                                      setFormData({ ...formData, parentDetails: updatedParents })
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentName-${index}`}>First Name *</Label>
                                    <Input
                                      id={`parentName-${index}`}
                                      value={parent.name}
                                      onChange={(e) => {
                                        const updatedParents = [...formData.parentDetails]
                                        updatedParents[index].name = e.target.value
                                        setFormData({ ...formData, parentDetails: updatedParents })
                                      }}
                                      placeholder="Robert"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentSurname-${index}`}>Last Name *</Label>
                                    <Input
                                      id={`parentSurname-${index}`}
                                      value={parent.surname}
                                      onChange={(e) => {
                                        const updatedParents = [...formData.parentDetails]
                                        updatedParents[index].surname = e.target.value
                                        setFormData({ ...formData, parentDetails: updatedParents })
                                      }}
                                      placeholder="Smith"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentRelationship-${index}`}>Relationship *</Label>
                                    <Select
                                      value={parent.relationship}
                                      onValueChange={(value: "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER") => {
                                        const updatedParents = [...formData.parentDetails]
                                        updatedParents[index].relationship = value
                                        setFormData({ ...formData, parentDetails: updatedParents })
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select relationship" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="MOTHER">Mother</SelectItem>
                                        <SelectItem value="FATHER">Father</SelectItem>
                                        <SelectItem value="GUARDIAN">Legal Guardian</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentPrimary-${index}`}>Primary Contact</Label>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`parentPrimary-${index}`}
                                        checked={parent.isPrimary}
                                        onChange={(e) => {
                                          const updatedParents = [...formData.parentDetails]
                                          // If checking this parent as primary, uncheck others
                                          if (e.target.checked) {
                                            updatedParents.forEach((p, i) => {
                                              updatedParents[i].isPrimary = i === index
                                            })
                                          } else {
                                            // Ensure at least one parent remains primary
                                            const hasOtherPrimary = updatedParents.some((p, i) => i !== index && p.isPrimary)
                                            if (!hasOtherPrimary) {
                                              updatedParents[index].isPrimary = true
                                              return
                                            }
                                            updatedParents[index].isPrimary = false
                                          }
                                          setFormData({ ...formData, parentDetails: updatedParents })
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <Label htmlFor={`parentPrimary-${index}`} className="text-sm">
                                        {parent.isPrimary ? "Primary Contact" : "Secondary Contact"}
                                      </Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`parentUsername-${index}`}>Username *</Label>
                                  <Input
                                    id={`parentUsername-${index}`}
                                    value={parent.username}
                                    onChange={(e) => {
                                      const updatedParents = [...formData.parentDetails]
                                      updatedParents[index].username = e.target.value
                                      setFormData({ ...formData, parentDetails: updatedParents })
                                    }}
                                    placeholder="robert.smith"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`parentEmail-${index}`}>Email *</Label>
                                  <Input
                                    id={`parentEmail-${index}`}
                                    type="email"
                                    value={parent.email}
                                    onChange={(e) => {
                                      const updatedParents = [...formData.parentDetails]
                                      updatedParents[index].email = e.target.value
                                      setFormData({ ...formData, parentDetails: updatedParents })
                                    }}
                                    placeholder="robert.smith@example.com"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentPhone-${index}`}>Phone</Label>
                                    <Input
                                      id={`parentPhone-${index}`}
                                      value={parent.phone || ""}
                                      onChange={(e) => {
                                        const updatedParents = [...formData.parentDetails]
                                        updatedParents[index].phone = e.target.value
                                        setFormData({ ...formData, parentDetails: updatedParents })
                                      }}
                                      placeholder="+1 (555) 987-6543"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`parentAddress-${index}`}>Address</Label>
                                    <Input
                                      id={`parentAddress-${index}`}
                                      value={parent.address || ""}
                                      onChange={(e) => {
                                        const updatedParents = [...formData.parentDetails]
                                        updatedParents[index].address = e.target.value
                                        setFormData({ ...formData, parentDetails: updatedParents })
                                      }}
                                      placeholder="456 Elm St"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {formData.parentDetails.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No parents added yet. Click "Add Parent" to get started.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Parent Relationships</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newRelationship: ParentRelationship = {
                                    parentId: "",
                                    relationship: "MOTHER",
                                    isPrimary: formData.parentRelationships.length === 0
                                  }
                                  setFormData({
                                    ...formData,
                                    parentRelationships: [...formData.parentRelationships, newRelationship]
                                  })
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Relationship
                              </Button>
                            </div>

                            {formData.parentRelationships.map((relationship, index) => (
                              <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium text-gray-900">Relationship {index + 1}</h5>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedRelationships = formData.parentRelationships.filter((_, i) => i !== index)
                                      setFormData({ ...formData, parentRelationships: updatedRelationships })
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`relParent-${index}`}>Parent *</Label>
                                    <Select
                                      value={relationship.parentId}
                                      onValueChange={(value) => {
                                        const updatedRelationships = [...formData.parentRelationships]
                                        updatedRelationships[index].parentId = value
                                        setFormData({ ...formData, parentRelationships: updatedRelationships })
                                      }}
                                      required
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select parent" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {parentsList.map((parent) => (
                                          <SelectItem key={parent.id} value={parent.id}>
                                            {getParentName(parent.id)} ({parent.user.email})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`relType-${index}`}>Relationship *</Label>
                                    <Select
                                      value={relationship.relationship}
                                      onValueChange={(value: "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER") => {
                                        const updatedRelationships = [...formData.parentRelationships]
                                        updatedRelationships[index].relationship = value
                                        setFormData({ ...formData, parentRelationships: updatedRelationships })
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select relationship" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="MOTHER">Mother</SelectItem>
                                        <SelectItem value="FATHER">Father</SelectItem>
                                        <SelectItem value="GUARDIAN">Legal Guardian</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`relPrimary-${index}`}>Primary Contact</Label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`relPrimary-${index}`}
                                      checked={relationship.isPrimary}
                                      onChange={(e) => {
                                        const updatedRelationships = [...formData.parentRelationships]
                                        if (e.target.checked) {
                                          updatedRelationships.forEach((r, i) => {
                                            updatedRelationships[i].isPrimary = i === index
                                          })
                                        } else {
                                          const hasOtherPrimary = updatedRelationships.some((r, i) => i !== index && r.isPrimary)
                                          if (!hasOtherPrimary) {
                                            updatedRelationships[index].isPrimary = true
                                            return
                                          }
                                          updatedRelationships[index].isPrimary = false
                                        }
                                        setFormData({ ...formData, parentRelationships: updatedRelationships })
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Label htmlFor={`relPrimary-${index}`} className="text-sm">
                                      {relationship.isPrimary ? "Primary Contact" : "Secondary Contact"}
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {formData.parentRelationships.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No relationships added yet. Click "Add Relationship" to get started.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateStudent}>Create Student</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Students Grid */}
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
            ) : students.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <GraduationCap className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No students found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm ||
                    selectedSchoolFilter !== "ALL" ||
                    selectedClassFilter !== "ALL" ||
                    selectedGradeFilter !== "ALL" ||
                    selectedVerificationStatusFilter !== "ALL"
                      ? "We couldn't find any students matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your student roster by adding your first student."}
                  </p>
                  {canManageStudents && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Student
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {students.map((student) => {
                  const verificationStatus = student.verificationStatus
                  return (
                    <Card
                      key={student.id}
                      className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              {canManageStudents ? (
                                <FileUpload
                                  accept="image/*"
                                  maxSize={5}
                                  maxFiles={1}
                                  onFileSelect={(files) => handleProfileImageUpload(student.id, files)}
                                  disabled={uploadingProfileImage === student.id}
                                  variant="avatar"
                                  className="w-16 h-16"
                                  showPreview={false}
                                >
                                  <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                    <AvatarImage
                                      src={student.imageUrl || "/placeholder.svg"}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                      <User className="w-6 h-6" />
                                    </AvatarFallback>
                                  </Avatar>
                                </FileUpload>
                              ) : (
                                <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                                  <AvatarImage src={student.imageUrl || "/placeholder.svg"} className="object-cover" />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                    <User className="w-6 h-6" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {uploadingProfileImage === student.id && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {student.name} {student.surname}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  Reg: {student.registrationNumber}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                                >
                                  <School className="w-3 h-3 mr-1" />
                                  {student.school.name}
                                </Badge>
                                <Badge
                                  variant={
                                    verificationStatus === "VERIFIED"
                                      ? "default"
                                      : verificationStatus === "PENDING"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    verificationStatus === "VERIFIED"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : verificationStatus === "PENDING"
                                        ? "bg-gray-100 text-gray-600 border-gray-200"
                                        : "bg-red-100 text-red-700 border-red-200"
                                  }`}
                                >
                                  {verificationStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {canManageStudents && (
                            <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(student)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {canVerifyStudents && (
                                <>
                                  {verificationStatus !== "VERIFIED" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateVerificationStatus(student.id, "VERIFIED")}
                                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                      title="Verify Student"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {verificationStatus !== "REJECTED" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateVerificationStatus(student.id, "REJECTED")}
                                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                      title="Reject Verification"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6">
                        {/* Academic Information */}
                        <div className="space-y-3 mb-6">
                          {student.classId && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="w-3 h-3 text-purple-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">
                                Class: {getClassName(student.classId)}
                              </p>
                            </div>
                          )}
                          {student.gradeId && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                                <Hash className="w-3 h-3 text-orange-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">
                                Grade: {getGradeName(student.gradeId)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Parent Information */}
                        <div className="space-y-3 mb-6">
                          <h5 className="text-sm font-semibold text-gray-800 border-b pb-1">Parent Contact:</h5>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                              {student.parent.user.name} {student.parent.user.surname}
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Primary
                              </span>
                            </p>
                          </div>
                          {student.parent.user.email && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium truncate">{student.parent.user.email}</p>
                            </div>
                          )}
                          {student.parent.user.phone && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                                <Phone className="w-3 h-3 text-orange-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{student.parent.user.phone}</p>
                            </div>
                          )}
                          {student.parent.user.address && (
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {student.parent.user.address}
                              </p>
                            </div>
                          )}
                          {/* Note about multiple parents support */}
                          <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-xs text-blue-700">
                              <Users className="w-3 h-3 inline mr-1" />
                              Multiple parent relationships supported. Primary parent shown above.
                            </p>
                          </div>
                        </div>

                        {/* Personal Details */}
                        <div className="space-y-3 mb-6">
                          <h5 className="text-sm font-semibold text-gray-800 border-b pb-1">Personal Details:</h5>
                          {student.bloodType && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                <HeartPulse className="w-3 h-3 text-red-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">Blood Type: {student.bloodType}</p>
                            </div>
                          )}
                          {student.sex && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                {student.sex === "MALE" ? (
                                  <Mars className="w-3 h-3 text-purple-600" />
                                ) : student.sex === "FEMALE" ? (
                                  <Venus className="w-3 h-3 text-purple-600" />
                                ) : (
                                  <CircleDot className="w-3 h-3 text-purple-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-700 font-medium">Sex: {student.sex}</p>
                            </div>
                          )}
                          {student.birthday && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                <CalendarDays className="w-3 h-3 text-yellow-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">
                                Birthday: {new Date(student.birthday).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Statistics Section */}
                        {student._count && (
                          <div className="mb-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-blue-500 p-1.5 rounded-lg">
                                    <CalendarDays className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-blue-700">{student._count.attendances}</p>
                                <p className="text-xs text-blue-600 font-medium">Attendances</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-emerald-500 p-1.5 rounded-lg">
                                    <FileText className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-emerald-700">{student._count.results}</p>
                                <p className="text-xs text-emerald-600 font-medium">Results</p>
                              </div>
                              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="bg-purple-500 p-1.5 rounded-lg">
                                    <ClipboardCheck className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <p className="text-lg font-bold text-purple-700">
                                  {student._count.assignmentSubmissions}
                                </p>
                                <p className="text-xs text-purple-600 font-medium">Submissions</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500 font-medium">
                            Registered: {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            ID: {student.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Student</DialogTitle>
                  <DialogDescription>Update student profile information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-registrationNumber">Registration Number *</Label>
                    <Input
                      id="edit-registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="STU-001"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">First Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alice"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-surname">Last Name *</Label>
                      <Input
                        id="edit-surname"
                        value={formData.surname}
                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Oak Ave"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-imageUrl">Profile Image URL</Label>
                    <Input
                      id="edit-imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/student.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-bloodType">Blood Type</Label>
                      <Input
                        id="edit-bloodType"
                        value={formData.bloodType}
                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                        placeholder="O+"
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-gradeId">Grade</Label>
                      <Select
                        value={formData.gradeId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, gradeId: value === "__NONE__" ? "" : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__NONE__">None</SelectItem>
                          {gradesList.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-classId">Class</Label>
                      <Select
                        value={formData.classId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, classId: value === "__NONE__" ? "" : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__NONE__">None</SelectItem>
                          {classesList.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} ({classItem.grade?.name || "N/A"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingStudent(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStudent}>Update Student</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
