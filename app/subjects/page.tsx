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
  BookOpen,
  Code,
  Users,
  FileText,
  ClipboardCheck,
  School,
  User,
  X,
} from "lucide-react"

// Define the Teacher type for dropdowns and display
interface TeacherForDropdown {
  id: string
  user: {
    name: string | null
    surname: string | null
    username: string
  }
}

// Define the Subject type based on the provided backend schema
interface Subject {
  id: string
  name: string
  code: string | null
  description: string | null
  schoolId: string
  teachers: {
    id: string
    user: {
      name: string | null
      surname: string | null
    }
  }[]
  _count?: {
    lessons: number
    assignments: number
    examQuestions: number
  }
}

export default function SubjectsPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachersList, setTeachersList] = useState<TeacherForDropdown[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [assigningTeacherSubject, setAssigningTeacherSubject] = useState<Subject | null>(null)
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    schoolId: "", // Will be set by useEffect
  })

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

  // Fetch subjects based on filters
  useEffect(() => {
    fetchSubjects()
  }, [searchTerm, selectedSchoolFilter])

  // Fetch teachers for dropdowns
  useEffect(() => {
    fetchTeachersList()
  }, [accessToken, currentSchool, user?.role])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      // Apply school filter based on user role and selected filter
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter !== "all") {
        params.append("schoolId", selectedSchoolFilter)
      } else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/subjects?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch subjects")
      }
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch subjects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachersList = async () => {
    try {
      const params = new URLSearchParams()
      // Filter teachers by current school if not Super Admin
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }
      const response = await fetch(`/api/teachers?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch teachers for dropdown")
      }
      const data = await response.json()
      setTeachersList(data.teachers || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load teachers for form",
        variant: "destructive",
      })
    }
  }

  const handleCreateSubject = async () => {
    try {
      if (!formData.name || !formData.schoolId) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const subjectData = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        schoolId: formData.schoolId,
      }

      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(subjectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create subject")
      }
      toast({
        title: "Success",
        description: "Subject created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchSubjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSubject = async () => {
    if (!editingSubject) return
    try {
      const subjectData = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
      }

      const response = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(subjectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update subject")
      }
      toast({
        title: "Success",
        description: "Subject updated successfully",
      })
      setEditingSubject(null)
      resetForm()
      fetchSubjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete subject")
      }
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      })
      fetchSubjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  const handleAssignTeacher = async () => {
    if (!assigningTeacherSubject || !selectedTeacherToAssign) return

    try {
      const response = await fetch(`/api/subjects/${assigningTeacherSubject.id}/assign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teacherId: selectedTeacherToAssign }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to assign teacher")
      }
      toast({
        title: "Success",
        description: "Teacher assigned to subject successfully",
      })
      setAssigningTeacherSubject(null)
      setSelectedTeacherToAssign("")
      fetchSubjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
        variant: "destructive",
      })
    }
  }

  const handleRemoveTeacher = async (subjectId: string, teacherId: string) => {
    if (!confirm("Are you sure you want to remove this teacher from the subject?")) {
      return
    }
    try {
      const response = await fetch(`/api/subjects/${subjectId}/remove-teacher`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teacherId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to remove teacher")
      }
      toast({
        title: "Success",
        description: "Teacher removed from subject successfully",
      })
      fetchSubjects() // Re-fetch to update the list of assigned teachers
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove teacher",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""), // Reset based on user role
    })
  }

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
      schoolId: subject.schoolId,
    })
  }

  const openAssignTeacherDialog = (subject: Subject) => {
    setAssigningTeacherSubject(subject)
    setSelectedTeacherToAssign("") // Reset selection
  }

  const canManageSubjects = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Helper to get school name from ID
  const getSchoolName = (schoolId: string) => {
    const school = availableSchools.find((s) => s.id === schoolId)
    return school ? school.name : "Unknown School"
  }

  // Helper to get teacher name from ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachersList.find((t) => t.id === teacherId)
    return teacher
      ? `${teacher.user.name || ""} ${teacher.user.surname || ""}`.trim() || teacher.user.username
      : "Unknown Teacher"
  }

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Subject Management" subtitle="Manage academic subjects and their teachers" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search subjects..."
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
              </div>
              {canManageSubjects && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Subject</DialogTitle>
                      <DialogDescription>Define a new academic subject.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Subject Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Mathematics, History, Physics"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Subject Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="e.g., MATH101, HIST200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="A brief description of the subject content."
                          rows={3}
                        />
                      </div>
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
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSubject}>Create Subject</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Subjects Grid */}
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <Card
                    key={i}
                    className="group overflow-hidden border-0 shadow-sm bg-white/80 backdrop-blur-sm animate-pulse"
                  >
                    <div className="relative p-8">
                      <div className="flex items-start space-x-6">
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"></div>
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
            ) : subjects.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <BookOpen className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No subjects found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedSchoolFilter !== "all"
                      ? "We couldn't find any subjects matching your criteria. Try adjusting your filters or search terms."
                      : "Start defining your curriculum by adding your first subject."}
                  </p>
                  {canManageSubjects && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Subject
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-2">
                {subjects.map((subject) => (
                  <Card
                    key={subject.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                              <BookOpen className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {subject.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              {subject.code && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-gray-200 text-gray-700 bg-gray-50"
                                >
                                  <Code className="w-3 h-3 mr-1" />
                                  {subject.code}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                <School className="w-3 h-3 mr-1" />
                                {getSchoolName(subject.schoolId)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {canManageSubjects && (
                          <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(subject)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignTeacherDialog(subject)}
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                              title="Manage Teachers"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {subject.description && (
                        <div className="mb-4">
                          <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4">
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">
                              "{subject.description}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Assigned Teachers */}
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">Assigned Teachers:</h5>
                        {subject.teachers && subject.teachers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {subject.teachers.map((teacher) => (
                              <Badge
                                key={teacher.id}
                                variant="secondary"
                                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 border-blue-200"
                              >
                                {teacher.user.name} {teacher.user.surname}
                                {canManageSubjects && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 ml-1 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveTeacher(subject.id, teacher.id)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No teachers assigned.</p>
                        )}
                      </div>

                      {/* Statistics Section */}
                      {subject._count && (
                        <div className="mb-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                              <div className="flex items-center justify-center mb-2">
                                <div className="bg-blue-500 p-1.5 rounded-lg">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <p className="text-lg font-bold text-blue-700">{subject._count.lessons}</p>
                              <p className="text-xs text-blue-600 font-medium">Lessons</p>
                            </div>
                            <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                              <div className="flex items-center justify-center mb-2">
                                <div className="bg-emerald-500 p-1.5 rounded-lg">
                                  <ClipboardCheck className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <p className="text-lg font-bold text-emerald-700">{subject._count.assignments}</p>
                              <p className="text-xs text-emerald-600 font-medium">Assignments</p>
                            </div>
                            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 transition-all duration-200 hover:scale-105">
                              <div className="flex items-center justify-center mb-2">
                                <div className="bg-purple-500 p-1.5 rounded-lg">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <p className="text-lg font-bold text-purple-700">{subject._count.examQuestions}</p>
                              <p className="text-xs text-purple-600 font-medium">Exams</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">
                          ID: {subject.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Subject</DialogTitle>
                  <DialogDescription>Update subject information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Subject Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mathematics, History, Physics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Subject Code</Label>
                    <Input
                      id="edit-code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., MATH101, HIST200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A brief description of the subject content."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingSubject(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSubject}>Update Subject</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Assign Teacher Dialog */}
            <Dialog open={!!assigningTeacherSubject} onOpenChange={() => setAssigningTeacherSubject(null)}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Assign Teacher to {assigningTeacherSubject?.name}</DialogTitle>
                  <DialogDescription>Select a teacher to assign to this subject.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="assign-teacher">Select Teacher</Label>
                    <Select value={selectedTeacherToAssign} onValueChange={setSelectedTeacherToAssign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachersList.length === 0 && (
                          <SelectItem value="" disabled>
                            No teachers available
                          </SelectItem>
                        )}
                        {teachersList.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {getTeacherName(teacher.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssigningTeacherSubject(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignTeacher} disabled={!selectedTeacherToAssign}>
                    Assign Teacher
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
