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
import { Plus, Search, Edit, Trash2, Users, School, Hash, User } from "lucide-react"

// Define the Grade type (re-using from previous context or defining here if standalone)
interface Grade {
  id: string
  name: string
  level: number
  schoolId: string
}

// Define the Teacher type (re-using from previous context or defining here if standalone)
interface Teacher {
  id: string // This is the userId linked to the teacher record
  user: {
    id: string
    email: string
    name: string | null
    surname: string | null
    username: string
    profileImageUrl: string | null
  }
}

// Define the Class type based on the provided backend schema
interface Class {
  id: string
  name: string
  capacity: number
  schoolId: string
  gradeId: string
  supervisorId: string | null
  school?: { id: string; name: string } // Optional, assuming API might return nested
  grade?: { id: string; name: string; level: number } // Optional, assuming API might return nested
  supervisor?: { id: string; user: { name: string | null; surname: string | null; username: string } } // Optional, assuming API might return nested
}

export default function ClassesPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [gradesList, setGradesList] = useState<Grade[]>([])
  const [teachersList, setTeachersList] = useState<Teacher[]>([])
  const [filteredGradesList, setFilteredGradesList] = useState<Grade[]>([])
  const [filteredTeachersList, setFilteredTeachersList] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    capacity: 1,
    schoolId: "", // Will be set by useEffect
    gradeId: "",
    supervisorId: "" as string | null,
  })
  const [isFiltering, setIsFiltering] = useState(false)

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

  // Fetch classes based on filters
  useEffect(() => {
    fetchClasses()
  }, [searchTerm, selectedSchoolFilter, selectedGradeFilter, selectedSupervisorFilter])

  // Fetch grades and teachers for dropdowns
  useEffect(() => {
    fetchGradesList()
    fetchTeachersList()
  }, [accessToken, currentSchool, user?.role]) // Re-fetch if auth changes or school context changes

  // Initialize filtering when component mounts and school is set
  useEffect(() => {
    if (formData.schoolId) {
      filterGradesAndTeachersBySchool(formData.schoolId)
    }
  }, []) // Only run once on mount

  const fetchClasses = async () => {
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

      if (selectedGradeFilter !== "all") params.append("gradeId", selectedGradeFilter)
      if (selectedSupervisorFilter !== "all") params.append("supervisorId", selectedSupervisorFilter)

      const response = await fetch(`/api/classes?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch classes")
      }
      const data = await response.json()
      setClasses(data.classes || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch classes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const fetchTeachersList = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams()
      // If schoolId is provided, filter by that school, otherwise use current school restrictions
      if (schoolId) {
        params.append("schoolId", schoolId)
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

  const filterGradesAndTeachersBySchool = async (schoolId: string) => {
    setIsFiltering(true)
    try {
      if (!schoolId) {
        // If no school selected, show all grades and teachers (based on user permissions)
        await fetchGradesList()
        await fetchTeachersList()
        return
      }

      // Clear current selections when school changes
      setFormData(prev => ({
        ...prev,
        gradeId: "",
        supervisorId: null
      }))

      // Fetch grades and teachers filtered by the selected school
      await fetchGradesList(schoolId)
      await fetchTeachersList(schoolId)
    } finally {
      setIsFiltering(false)
    }
  }

  const handleCreateClass = async () => {
    try {
      if (!formData.name || !formData.capacity || !formData.schoolId) {
        toast({
          title: "Error",
          description: "Please fill in class name, capacity, and select a school",
          variant: "destructive",
        })
        return
      }

      if (!formData.gradeId) {
        toast({
          title: "Error",
          description: "Please select a grade. If no grades are available, contact your administrator.",
          variant: "destructive",
        })
        return
      }

      const classData = {
        name: formData.name,
        capacity: formData.capacity,
        schoolId: formData.schoolId,
        gradeId: formData.gradeId,
        supervisorId: formData.supervisorId || undefined,
      }

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(classData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create class")
      }
      toast({
        title: "Success",
        description: "Class created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchClasses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      })
    }
  }

  const handleUpdateClass = async () => {
    if (!editingClass) return
    try {
      const classData = {
        name: formData.name,
        capacity: formData.capacity,
        supervisorId: formData.supervisorId || undefined,
      }

      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(classData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update class")
      }
      toast({
        title: "Success",
        description: "Class updated successfully",
      })
      setEditingClass(null)
      resetForm()
      fetchClasses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete class")
      }
      toast({
        title: "Success",
        description: "Class deleted successfully",
      })
      fetchClasses()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: 1,
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""),
      gradeId: "",
      supervisorId: null,
    })
  }

  const openEditDialog = (classRecord: Class) => {
    setEditingClass(classRecord)
    setFormData({
      name: classRecord.name,
      capacity: classRecord.capacity,
      schoolId: classRecord.schoolId,
      gradeId: classRecord.gradeId,
      supervisorId: classRecord.supervisorId,
    })
  }

  const canManageClasses = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Helper to get school name from ID
  const getSchoolName = (schoolId: string) => {
    const school = availableSchools.find((s) => s.id === schoolId)
    return school ? school.name : "Unknown School"
  }

  // Helper to get grade name from ID
  const getGradeName = (gradeId: string) => {
    const grade = gradesList.find((g) => g.id === gradeId)
    return grade ? grade.name : "Unknown Grade"
  }

  // Helper to get teacher name from ID
  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "Unassigned"
    const teacher = teachersList.find((t) => t.id === teacherId)
    return teacher
      ? `${teacher.user.name || ""} ${teacher.user.surname || ""}`.trim() || teacher.user.username
      : "Unknown Teacher"
  }

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  // Handle school selection with filtering
  const handleSchoolChange = async (schoolId: string) => {
    setFormData(prev => ({ ...prev, schoolId }))
    await filterGradesAndTeachersBySchool(schoolId)
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Class Management" subtitle="Organize and manage academic classes" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search classes..."
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
                <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Grades">
                      {selectedGradeFilter === "all" ? "All Grades" : "Select grade"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {gradesList.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSupervisorFilter} onValueChange={setSelectedSupervisorFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Supervisors">
                      {selectedSupervisorFilter === "all" ? "All Supervisors" : "Select supervisor"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Supervisors</SelectItem>
                    {teachersList.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {getTeacherName(teacher.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {canManageClasses && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Class</DialogTitle>
                      <DialogDescription>Define a new academic class.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Class Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., 1A, Science Lab, Senior English"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity *</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 0 })}
                          placeholder="e.g., 30"
                          min={1}
                          required
                        />
                      </div>
                      {!formData.schoolId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            💡 <strong>Tip:</strong> Select a school first to see available grades and teachers for that school.
                          </p>
                        </div>
                      )}
                      {user?.role === "SUPER_ADMIN" && (
                        <div className="space-y-2">
                          <Label htmlFor="schoolId">School *</Label>
                          <Select
                            value={formData.schoolId}
                            onValueChange={handleSchoolChange}
                            required
                            disabled={isFiltering}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isFiltering ? "Updating options..." : "Select a school"}>
                                {isFiltering ? "Updating options..." :
                                  (availableSchools.find(s => s.id === formData.schoolId)?.name || "Select a school")
                                }
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
                      <div className="space-y-2">
                        <Label htmlFor="gradeId">Grade *</Label>
                        <Select
                          value={formData.gradeId}
                          onValueChange={(value) => setFormData({ ...formData, gradeId: value })}
                          required
                          disabled={isFiltering}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isFiltering ? "Loading grades..." : "Select a grade"}>
                              {isFiltering ? "Loading grades..." : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {gradesList.map((grade) => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.name}
                              </SelectItem>
                            ))}
                            {gradesList.length === 0 && !isFiltering && (
                              <SelectItem value="no-grades" disabled>
                                {formData.schoolId ? "No grades available for this school" : "Select a school first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supervisorId">Supervisor (Teacher)</Label>
                        <Select
                          value={formData.supervisorId || "UNASSIGNED"}
                          onValueChange={(value) => setFormData({ ...formData, supervisorId: value === "UNASSIGNED" ? null : value })}
                          disabled={isFiltering}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isFiltering ? "Loading teachers..." : "Select a supervisor"}>
                              {isFiltering ? "Loading teachers..." : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                            {teachersList.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {getTeacherName(teacher.id)}
                              </SelectItem>
                            ))}
                            {teachersList.length === 0 && !isFiltering && (
                              <SelectItem value="no-teachers" disabled>
                                {formData.schoolId ? "No teachers available for this school" : "Select a school first"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateClass}>Create Class</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Classes Grid */}
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
            ) : classes.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No classes found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm ||
                    selectedSchoolFilter !== "all" ||
                    selectedGradeFilter !== "all" ||
                    selectedSupervisorFilter !== "all"
                      ? "We couldn't find any classes matching your criteria. Try adjusting your filters or search terms."
                      : "Start organizing your curriculum by adding your first class."}
                  </p>
                  {canManageClasses && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Class
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {classes.map((classRecord) => (
                  <Card
                    key={classRecord.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                              <Users className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {classRecord.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                <School className="w-3 h-3 mr-1" />
                                {getSchoolName(classRecord.schoolId)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                              >
                                <Hash className="w-3 h-3 mr-1" />
                                {getGradeName(classRecord.gradeId)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-purple-200 text-purple-700 bg-purple-50"
                              >
                                <User className="w-3 h-3 mr-1" />
                                {getTeacherName(classRecord.supervisorId)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {canManageClasses && (
                          <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(classRecord)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClass(classRecord.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">Capacity: {classRecord.capacity}</div>
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {classRecord.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Class</DialogTitle>
                  <DialogDescription>Update class information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Class Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 1A, Science Lab, Senior English"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Capacity *</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 30"
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-supervisorId">Supervisor (Teacher)</Label>
                    <Select
                      value={formData.supervisorId || "UNASSIGNED"}
                      onValueChange={(value) => setFormData({ ...formData, supervisorId: value === "UNASSIGNED" ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {teachersList.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {getTeacherName(teacher.id)}
                          </SelectItem>
                        ))}
                        {teachersList.length === 0 && (
                          <SelectItem value="no-teachers" disabled>
                            No teachers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingClass(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateClass}>Update Class</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
