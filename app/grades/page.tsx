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
import { Plus, Search, Edit, Trash2, School, Hash } from "lucide-react"

// Define the Grade type based on the provided backend schema
interface Grade {
  id: string
  name: string
  level: number
  schoolId: string
}

export default function GradesPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all")

  const [formData, setFormData] = useState({
    name: "",
    level: 1, // Default level
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

  useEffect(() => {
    fetchGrades()
  }, [searchTerm, currentSchool, selectedSchoolFilter]) // Depend on filters and currentSchool

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      // For super admin, use the selected school filter if not "all"
      if (user?.role === "SUPER_ADMIN" && selectedSchoolFilter && selectedSchoolFilter !== "all") {
        params.append("schoolId", selectedSchoolFilter)
      }
      // For other roles, use currentSchool if set
      else if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/grades?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch grades")
      }
      const data = await response.json()
      setGrades(data.grades || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch grades",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGrade = async () => {
    try {
      if (!formData.name || !formData.level || (user?.role === "SUPER_ADMIN" && !formData.schoolId)) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const gradeData = {
        name: formData.name,
        level: formData.level,
        schoolId: formData.schoolId,
      }

      const response = await fetch("/api/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(gradeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create grade")
      }
      toast({
        title: "Success",
        description: "Grade created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchGrades()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create grade",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGrade = async () => {
    if (!editingGrade) return
    try {
      const gradeData = {
        name: formData.name,
        level: formData.level,
      }

      const response = await fetch(`/api/grades/${editingGrade.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(gradeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update grade")
      }
      toast({
        title: "Success",
        description: "Grade updated successfully",
      })
      setEditingGrade(null)
      resetForm()
      fetchGrades()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm("Are you sure you want to delete this grade? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/grades/${gradeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete grade")
      }
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      })
      fetchGrades()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete grade",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      level: 1,
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""),
    })
  }

  const openEditDialog = (grade: Grade) => {
    setEditingGrade(grade)
    setFormData({
      name: grade.name,
      level: grade.level,
      schoolId: grade.schoolId, // Not editable in update, but useful for context
    })
  }

  const canManageGrades = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  // Helper to get school name from ID
  const getSchoolName = (schoolId: string) => {
    const school = availableSchools.find((s) => s.id === schoolId)
    return school ? school.name : "Unknown School"
  }

  // Find the current school object for display in the form
  const currentSchoolObject = availableSchools.find((school) => school.id === currentSchool)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Grade Management" subtitle="Manage academic grade levels" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search grades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                {user?.role === "SUPER_ADMIN" && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedSchoolFilter}
                      onValueChange={setSelectedSchoolFilter}
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Filter by school">
                          {selectedSchoolFilter === "all"
                            ? "All schools"
                            : availableSchools.find(s => s.id === selectedSchoolFilter)?.name || "Select school"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All schools</SelectItem>
                        {availableSchools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSchoolFilter !== "all" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSchoolFilter("all")}
                        className="px-3"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {canManageGrades && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Grade</DialogTitle>
                      <DialogDescription>Define a new academic grade level.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Grade Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Grade 1, Kindergarten, Senior Year"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">Level *</Label>
                        <Input
                          id="level"
                          type="number"
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: Number.parseInt(e.target.value) || 0 })}
                          placeholder="e.g., 1, 12"
                          min={1}
                          required
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
                      <Button onClick={handleCreateGrade}>Create Grade</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Grades Grid */}
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
            ) : grades.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Hash className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No grades found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any grades matching your criteria. Try adjusting your search terms."
                      : "Start defining your academic structure by adding your first grade level."}
                  </p>
                  {canManageGrades && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Grade
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {grades.map((grade) => (
                  <Card
                    key={grade.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                              {grade.level}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {grade.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                <School className="w-3 h-3 mr-1" />
                                {getSchoolName(grade.schoolId)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {canManageGrades && (
                          <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(grade)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {/* You can add more grade-specific details here if needed */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 font-medium">Level: {grade.level}</div>
                        <div className="text-xs text-gray-400 font-medium">ID: {grade.id.slice(-8).toUpperCase()}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingGrade} onOpenChange={() => setEditingGrade(null)}>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Grade</DialogTitle>
                  <DialogDescription>Update grade level information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Grade Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Grade 1, Kindergarten, Senior Year"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-level">Level *</Label>
                    <Input
                      id="edit-level"
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: Number.parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 1, 12"
                      min={1}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingGrade(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateGrade}>Update Grade</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
