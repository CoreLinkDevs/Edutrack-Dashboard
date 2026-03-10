"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Target,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react"

// Define the Curriculum type
interface Curriculum {
  id: string
  name: string
  description?: string
  version?: string
  schoolId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  curriculumSubjects?: CurriculumSubject[]
  _count?: {
    curriculumSubjects: number
  }
}

interface CurriculumSubject {
  id: string
  curriculumId: string
  subjectId: string
  gradeId: string
  hoursPerWeek: number
  isCore: boolean
  prerequisites: string[]
  subject: {
    name: string
    code: string
  }
  grade: {
    name: string
    level: number
  }
  learningObjectives?: LearningObjective[]
}

interface LearningObjective {
  id: string
  title: string
  description: string
  objectiveType: "SKILL" | "KNOWLEDGE" | "ATTITUDE"
  bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE"
  createdAt: string
  _count?: {
    studentProgress: number
  }
}

interface StudentProgress {
  student: {
    id: string
    name: string
    surname: string
    registrationNumber: string
  }
  objectives: Array<{
    id: string
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
    masteryLevel?: "BEGINNER" | "DEVELOPING" | "PROFICIENT" | "MASTERED"
    assessmentScore?: number
    learningObjective: {
      id: string
      title: string
      description: string
    }
  }>
  stats: {
    total: number
    notStarted: number
    inProgress: number
    completed: number
    mastered: number
    averageScore: number
  }
}

export default function CurriculumPage() {
  const { user, accessToken, currentSchool } = useAuth()
  const { toast } = useToast()
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubject[]>([])
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [editingSubject, setEditingSubject] = useState<CurriculumSubject | null>(null)
  const [editingObjective, setEditingObjective] = useState<LearningObjective | null>(null)

  // Loading states
  const [isCreatingCurriculum, setIsCreatingCurriculum] = useState(false)
  const [isUpdatingCurriculum, setIsUpdatingCurriculum] = useState(false)
  const [isCreatingSubject, setIsCreatingSubject] = useState(false)
  const [isCreatingObjective, setIsCreatingObjective] = useState(false)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  // Form data
  const [curriculumForm, setCurriculumForm] = useState({
    name: "",
    description: "",
    version: "",
    schoolId: "",
  })

  const [subjectForm, setSubjectForm] = useState({
    curriculumId: "",
    subjectId: "",
    gradeId: "",
    hoursPerWeek: 1,
    isCore: true,
    prerequisites: [] as string[],
  })

  const [objectiveForm, setObjectiveForm] = useState({
    curriculumSubjectId: "",
    title: "",
    description: "",
    objectiveType: "SKILL" as "SKILL" | "KNOWLEDGE" | "ATTITUDE",
    bloomsLevel: "REMEMBER" as "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE",
  })

  const [progressForm, setProgressForm] = useState({
    studentId: "",
    learningObjectiveId: "",
    status: "NOT_STARTED" as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
    masteryLevel: "" as "" | "BEGINNER" | "DEVELOPING" | "PROFICIENT" | "MASTERED",
    notes: "",
    assessmentScore: "",
  })

  useEffect(() => {
    fetchCurriculums()
    fetchGrades()
    fetchSubjects()
    fetchStudents()
    fetchSchools()
  }, [])

  useEffect(() => {
    if (selectedCurriculum) {
      fetchCurriculumDetails(selectedCurriculum.id)
    }
  }, [selectedCurriculum])

  const fetchCurriculums = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      // Apply school filter based on user role
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/curriculum?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch curriculums")
      }

      const data = await response.json()
      setCurriculums(data.curriculums || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch curriculums",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch schools")
      const data = await response.json()
      setSchools(data.schools || [])
    } catch (error: any) {
      console.error("Error fetching schools:", error)
    }
  }

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch grades")
      const data = await response.json()
      setGrades(data.grades || [])
    } catch (error: any) {
      console.error("Error fetching grades:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch subjects")
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error: any) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error: any) {
      console.error("Error fetching students:", error)
    }
  }

  const fetchCurriculumDetails = async (curriculumId: string) => {
    try {
      const response = await fetch(`/api/curriculum/${curriculumId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch curriculum details")
      const data = await response.json()
      setCurriculumSubjects(data.curriculum?.curriculumSubjects || [])
    } catch (error: any) {
      console.error("Error fetching curriculum details:", error)
    }
  }

  const fetchLearningObjectives = async (curriculumSubjectId: string) => {
    try {
      const response = await fetch(`/api/curriculum/subjects/${curriculumSubjectId}/objectives`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch learning objectives")
      const data = await response.json()
      setLearningObjectives(data.learningObjectives || [])
    } catch (error: any) {
      console.error("Error fetching learning objectives:", error)
    }
  }

  const fetchStudentProgress = async (curriculumId: string) => {
    try {
      const response = await fetch(`/api/curriculum/${curriculumId}/progress`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch student progress")
      const data = await response.json()
      setStudentProgress(data.studentProgress || [])
    } catch (error: any) {
      console.error("Error fetching student progress:", error)
    }
  }

  // Validation functions
  const validateCurriculumForm = () => {
    if (!curriculumForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Curriculum name is required",
        variant: "destructive",
      })
      return false
    }
    if (user?.role === "SUPER_ADMIN" && !curriculumForm.schoolId) {
      toast({
        title: "Validation Error",
        description: "Please select a school",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateSubjectForm = () => {
    if (!subjectForm.subjectId) {
      toast({
        title: "Validation Error",
        description: "Please select a subject",
        variant: "destructive",
      })
      return false
    }
    if (!subjectForm.gradeId) {
      toast({
        title: "Validation Error",
        description: "Please select a grade",
        variant: "destructive",
      })
      return false
    }
    if (!subjectForm.hoursPerWeek || subjectForm.hoursPerWeek < 1) {
      toast({
        title: "Validation Error",
        description: "Hours per week must be at least 1",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateObjectiveForm = () => {
    if (!objectiveForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Objective title is required",
        variant: "destructive",
      })
      return false
    }
    if (!objectiveForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Objective description is required",
        variant: "destructive",
      })
      return false
    }
    if (!objectiveForm.curriculumSubjectId) {
      toast({
        title: "Validation Error",
        description: "Please select a curriculum subject",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateProgressForm = () => {
    if (!progressForm.studentId) {
      toast({
        title: "Validation Error",
        description: "Please select a student",
        variant: "destructive",
      })
      return false
    }
    if (!progressForm.learningObjectiveId) {
      toast({
        title: "Validation Error",
        description: "Please select a learning objective",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleCreateCurriculum = async () => {
    if (!validateCurriculumForm()) return

    try {
      setIsCreatingCurriculum(true)
      const curriculumData = {
        ...curriculumForm,
        schoolId: currentSchool || curriculumForm.schoolId, // Use currentSchool if available
      }

      // Filter out empty string fields
      Object.keys(curriculumData).forEach(key => {
        if (curriculumData[key as keyof typeof curriculumData] === "") {
          delete curriculumData[key as keyof typeof curriculumData]
        }
      })

      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(curriculumData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create curriculum")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Curriculum created successfully",
      })

      setIsCreateDialogOpen(false)
      resetCurriculumForm()
      fetchCurriculums()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create curriculum",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCurriculum(false)
    }
  }

  const handleCreateSubject = async () => {
    if (!validateSubjectForm()) return

    try {
      setIsCreatingSubject(true)
      const response = await fetch("/api/curriculum/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(subjectForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create curriculum subject")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Subject added to curriculum successfully",
      })

      setIsSubjectDialogOpen(false)
      resetSubjectForm()
      if (selectedCurriculum) {
        fetchCurriculumDetails(selectedCurriculum.id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create curriculum subject",
        variant: "destructive",
      })
    } finally {
      setIsCreatingSubject(false)
    }
  }

  const handleCreateObjective = async () => {
    if (!validateObjectiveForm()) return

    try {
      setIsCreatingObjective(true)
      const response = await fetch("/api/curriculum/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(objectiveForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create learning objective")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Learning objective created successfully",
      })

      setIsObjectiveDialogOpen(false)
      resetObjectiveForm()
      fetchLearningObjectives(objectiveForm.curriculumSubjectId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create learning objective",
        variant: "destructive",
      })
    } finally {
      setIsCreatingObjective(false)
    }
  }

  const handleUpdateProgress = async () => {
    if (!validateProgressForm()) return

    try {
      setIsUpdatingProgress(true)
      const progressData = {
        studentId: progressForm.studentId,
        learningObjectiveId: progressForm.learningObjectiveId,
        status: progressForm.status,
        masteryLevel: progressForm.masteryLevel || undefined,
        notes: progressForm.notes || undefined,
        assessmentScore: progressForm.assessmentScore ? Number(progressForm.assessmentScore) : undefined,
      }

      const response = await fetch("/api/curriculum/progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(progressData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update student progress")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Student progress updated successfully",
      })

      setIsProgressDialogOpen(false)
      resetProgressForm()
      if (selectedCurriculum) {
        fetchStudentProgress(selectedCurriculum.id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student progress",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleUpdateCurriculum = async () => {
    if (!editingCurriculum) return
    if (!validateCurriculumForm()) return

    try {
      setIsUpdatingCurriculum(true)
      const curriculumData = {
        ...curriculumForm,
      }

      const response = await fetch(`/api/curriculum/${editingCurriculum.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(curriculumData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update curriculum")
      }

      toast({
        title: "Success",
        description: "Curriculum updated successfully",
      })
      setEditingCurriculum(null)
      resetCurriculumForm()
      fetchCurriculums()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update curriculum",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCurriculum(false)
    }
  }

  const handleDeleteCurriculum = async (curriculumId: string) => {
    if (!confirm("Are you sure you want to delete this curriculum? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/curriculum/${curriculumId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete curriculum")
      }

      toast({
        title: "Success",
        description: "Curriculum deleted successfully",
      })
      fetchCurriculums()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete curriculum",
        variant: "destructive",
      })
    }
  }

  const resetCurriculumForm = () => {
    setCurriculumForm({
      name: "",
      description: "",
      version: "",
      schoolId: user?.role === "SUPER_ADMIN" ? "" : (currentSchool || ""), // Only set schoolId for non-super-admins
    })
  }

  const resetSubjectForm = () => {
    setSubjectForm({
      curriculumId: selectedCurriculum?.id || "",
      subjectId: "",
      gradeId: "",
      hoursPerWeek: 1,
      isCore: true,
      prerequisites: [],
    })
  }

  const resetObjectiveForm = () => {
    setObjectiveForm({
      curriculumSubjectId: "",
      title: "",
      description: "",
      objectiveType: "SKILL",
      bloomsLevel: "REMEMBER",
    })
  }

  const resetProgressForm = () => {
    setProgressForm({
      studentId: "",
      learningObjectiveId: "",
      status: "NOT_STARTED",
      masteryLevel: "",
      notes: "",
      assessmentScore: "",
    })
  }

  const openEditDialog = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    setCurriculumForm({
      name: curriculum.name,
      description: curriculum.description || "",
      version: curriculum.version || "",
      schoolId: user?.role === "SUPER_ADMIN" ? curriculum.schoolId : (currentSchool || ""), // Only allow editing for super admins
    })
  }

  const openSubjectDialog = (curriculumSubject?: CurriculumSubject) => {
    if (curriculumSubject) {
      setEditingSubject(curriculumSubject)
      setSubjectForm({
        curriculumId: curriculumSubject.curriculumId,
        subjectId: curriculumSubject.subjectId,
        gradeId: curriculumSubject.gradeId,
        hoursPerWeek: curriculumSubject.hoursPerWeek,
        isCore: curriculumSubject.isCore,
        prerequisites: curriculumSubject.prerequisites,
      })
    } else {
      resetSubjectForm()
      setEditingSubject(null)
    }
    setIsSubjectDialogOpen(true)
  }

  const openObjectiveDialog = (curriculumSubjectId: string, learningObjective?: LearningObjective) => {
    if (learningObjective) {
      setEditingObjective(learningObjective)
      setObjectiveForm({
        curriculumSubjectId,
        title: learningObjective.title,
        description: learningObjective.description,
        objectiveType: learningObjective.objectiveType,
        bloomsLevel: learningObjective.bloomsLevel,
      })
    } else {
      resetObjectiveForm()
      setObjectiveForm(prev => ({ ...prev, curriculumSubjectId }))
      setEditingObjective(null)
    }
    setIsObjectiveDialogOpen(true)
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Curriculum Management" subtitle="Manage educational curriculums, subjects, and learning objectives" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Tabs defaultValue="curriculums" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="curriculums">Curriculums</TabsTrigger>
              <TabsTrigger value="subjects" disabled={!selectedCurriculum} title={!selectedCurriculum ? "Select a curriculum first" : ""}>
                Subjects
              </TabsTrigger>
              <TabsTrigger value="objectives" disabled={!selectedCurriculum} title={!selectedCurriculum ? "Select a curriculum first" : ""}>
                Objectives
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={!selectedCurriculum} title={!selectedCurriculum ? "Select a curriculum first" : ""}>
                Progress
              </TabsTrigger>
            </TabsList>

            {/* Curriculums Tab */}
            <TabsContent value="curriculums" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search curriculums..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Curriculum
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Curriculum</DialogTitle>
                      <DialogDescription>Add a new curriculum to the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {user?.role === "SUPER_ADMIN" && (
                        <div className="space-y-2">
                          <Label htmlFor="schoolId">School *</Label>
                          <Select
                            value={curriculumForm.schoolId}
                            onValueChange={(value) => setCurriculumForm({ ...curriculumForm, schoolId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a school" />
                            </SelectTrigger>
                            <SelectContent>
                              {schools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="name">Curriculum Name *</Label>
                        <Input
                          id="name"
                          value={curriculumForm.name}
                          onChange={(e) => setCurriculumForm({ ...curriculumForm, name: e.target.value })}
                          placeholder="Enter curriculum name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={curriculumForm.description}
                          onChange={(e) => setCurriculumForm({ ...curriculumForm, description: e.target.value })}
                          placeholder="Curriculum description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={curriculumForm.version}
                          onChange={(e) => setCurriculumForm({ ...curriculumForm, version: e.target.value })}
                          placeholder="e.g., v1.0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingCurriculum}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCurriculum} disabled={isCreatingCurriculum}>
                        {isCreatingCurriculum && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Curriculum
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

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
              ) : curriculums.length === 0 ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No curriculums found</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      {searchTerm
                        ? "We couldn't find any curriculums matching your criteria. Try adjusting your search terms."
                        : "Start building your educational framework by adding your first curriculum to the platform."}
                    </p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Curriculum
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {curriculums.map((curriculum) => (
                    <Card
                      key={curriculum.id}
                      className={`group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                        selectedCurriculum?.id === curriculum.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCurriculum(curriculum)}
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {curriculum.name}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  {curriculum.version || "No version"}
                                </Badge>
                                <Badge
                                  variant={curriculum.isActive ? "default" : "secondary"}
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    curriculum.isActive
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {curriculum.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(curriculum)
                              }}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCurriculum(curriculum.id)
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6">
                        {curriculum.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                              {curriculum.description}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-400 font-medium">
                            {curriculum._count?.curriculumSubjects || 0} subjects
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            ID: {curriculum.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-6">
              {!selectedCurriculum ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Select a Curriculum</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Choose a curriculum from the Curriculums tab to manage its subjects, learning objectives, and track student progress.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCurriculum.name}</h2>
                      <p className="text-gray-600">Manage curriculum subjects</p>
                    </div>
                    <Button onClick={() => openSubjectDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {curriculumSubjects.map((subject) => (
                      <Card key={subject.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{subject.subject.name}</h3>
                            <p className="text-sm text-gray-600">{subject.grade.name} - Grade {subject.grade.level}</p>
                            <p className="text-xs text-gray-500 mt-1">{subject.hoursPerWeek} hours/week</p>
                            {subject.isCore && <Badge variant="secondary" className="mt-2">Core Subject</Badge>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSubjectDialog(subject)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Learning Objectives Tab */}
            <TabsContent value="objectives" className="space-y-6">
              {!selectedCurriculum ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-green-500 to-blue-600 p-6 rounded-3xl shadow-2xl">
                        <Target className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Select a Curriculum</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Choose a curriculum to define learning objectives and track educational goals for each subject.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCurriculum.name}</h2>
                      <p className="text-gray-600">Manage learning objectives</p>
                    </div>
                    <Button onClick={() => setIsObjectiveDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Objective
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {curriculumSubjects.map((subject) => (
                      <Card key={subject.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{subject.subject.name} - {subject.grade.name}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              fetchLearningObjectives(subject.id)
                              openObjectiveDialog(subject.id)
                            }}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Add Objective
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {subject.learningObjectives?.map((objective) => (
                            <div key={objective.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{objective.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">{objective.objectiveType}</Badge>
                                  <Badge variant="outline">{objective.bloomsLevel}</Badge>
                                  <span className="text-xs text-gray-500">
                                    {objective._count?.studentProgress || 0} students
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openObjectiveDialog(subject.id, objective)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          )) || (
                            <p className="text-gray-500 text-center py-4">No learning objectives defined</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Student Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              {!selectedCurriculum ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-3xl shadow-2xl">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Select a Curriculum</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Choose a curriculum to track student progress on learning objectives and monitor educational outcomes.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCurriculum.name}</h2>
                      <p className="text-gray-600">Track student progress on learning objectives</p>
                    </div>
                    <Button onClick={() => setIsProgressDialogOpen(true)}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Update Progress
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {studentProgress.map((progress) => (
                      <Card key={progress.student.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{progress.student.name} {progress.student.surname}</h3>
                            <p className="text-gray-600">{progress.student.registrationNumber}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{progress.stats.completed}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-600">{progress.stats.total}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">{progress.stats.inProgress}</div>
                            <div className="text-xs text-gray-500">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{progress.stats.completed}</div>
                            <div className="text-xs text-gray-500">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{progress.stats.mastered}</div>
                            <div className="text-xs text-gray-500">Mastered</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {progress.objectives.slice(0, 3).map((obj) => (
                            <div key={obj.learningObjective.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm truncate flex-1">{obj.learningObjective.title}</span>
                              <Badge
                                variant={
                                  obj.status === 'COMPLETED' ? 'default' :
                                  obj.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                                }
                                className="ml-2"
                              >
                                {obj.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Edit Curriculum Dialog */}
          <Dialog open={!!editingCurriculum} onOpenChange={() => setEditingCurriculum(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Curriculum</DialogTitle>
                <DialogDescription>Update curriculum information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {user?.role === "SUPER_ADMIN" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-schoolId">School *</Label>
                    <Select
                      value={curriculumForm.schoolId}
                      onValueChange={(value) => setCurriculumForm({ ...curriculumForm, schoolId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Curriculum Name *</Label>
                  <Input
                    id="edit-name"
                    value={curriculumForm.name}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, name: e.target.value })}
                    placeholder="Enter curriculum name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={curriculumForm.description}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, description: e.target.value })}
                    placeholder="Curriculum description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-version">Version</Label>
                  <Input
                    id="edit-version"
                    value={curriculumForm.version}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, version: e.target.value })}
                    placeholder="e.g., v1.0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingCurriculum(null)} disabled={isUpdatingCurriculum}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCurriculum} disabled={isUpdatingCurriculum}>
                  {isUpdatingCurriculum && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Curriculum
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Subject Dialog */}
          <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add Subject to Curriculum'}</DialogTitle>
                <DialogDescription>
                  {editingSubject ? 'Update subject information' : 'Add a new subject to this curriculum'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject-select">Subject *</Label>
                    <Select
                      value={subjectForm.subjectId}
                      onValueChange={(value) => setSubjectForm({ ...subjectForm, subjectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade-select">Grade *</Label>
                    <Select
                      value={subjectForm.gradeId}
                      onValueChange={(value) => setSubjectForm({ ...subjectForm, gradeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name} - Level {grade.level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours per Week *</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={subjectForm.hoursPerWeek}
                    onChange={(e) => setSubjectForm({ ...subjectForm, hoursPerWeek: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-core"
                    checked={subjectForm.isCore}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isCore: e.target.checked })}
                  />
                  <Label htmlFor="is-core">Core Subject</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)} disabled={isCreatingSubject}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubject} disabled={isCreatingSubject}>
                  {isCreatingSubject && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Objective Dialog */}
          <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingObjective ? 'Edit Learning Objective' : 'Add Learning Objective'}</DialogTitle>
                <DialogDescription>
                  {editingObjective ? 'Update objective information' : 'Add a new learning objective'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="objective-title">Title *</Label>
                  <Input
                    id="objective-title"
                    value={objectiveForm.title}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
                    placeholder="e.g., Basic Addition"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective-description">Description *</Label>
                  <Textarea
                    id="objective-description"
                    value={objectiveForm.description}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                    placeholder="Describe what students should learn"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="objective-type">Type *</Label>
                    <Select
                      value={objectiveForm.objectiveType}
                      onValueChange={(value: "SKILL" | "KNOWLEDGE" | "ATTITUDE") =>
                        setObjectiveForm({ ...objectiveForm, objectiveType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SKILL">Skill</SelectItem>
                        <SelectItem value="KNOWLEDGE">Knowledge</SelectItem>
                        <SelectItem value="ATTITUDE">Attitude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blooms-level">Bloom's Level *</Label>
                    <Select
                      value={objectiveForm.bloomsLevel}
                      onValueChange={(value: any) => setObjectiveForm({ ...objectiveForm, bloomsLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REMEMBER">Remember</SelectItem>
                        <SelectItem value="UNDERSTAND">Understand</SelectItem>
                        <SelectItem value="APPLY">Apply</SelectItem>
                        <SelectItem value="ANALYZE">Analyze</SelectItem>
                        <SelectItem value="EVALUATE">Evaluate</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)} disabled={isCreatingObjective}>
                  Cancel
                </Button>
                <Button onClick={handleCreateObjective} disabled={isCreatingObjective}>
                  {isCreatingObjective && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingObjective ? 'Update Objective' : 'Add Objective'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Progress Dialog */}
          <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Update Student Progress</DialogTitle>
                <DialogDescription>Update a student's progress on a learning objective</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-select">Student *</Label>
                    <Select
                      value={progressForm.studentId}
                      onValueChange={(value) => setProgressForm({ ...progressForm, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} {student.surname} ({student.registrationNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective-select">Learning Objective *</Label>
                    <Select
                      value={progressForm.learningObjectiveId}
                      onValueChange={(value) => setProgressForm({ ...progressForm, learningObjectiveId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective" />
                      </SelectTrigger>
                      <SelectContent>
                        {learningObjectives.map((objective) => (
                          <SelectItem key={objective.id} value={objective.id}>
                            {objective.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress-status">Status *</Label>
                  <Select
                    value={progressForm.status}
                    onValueChange={(value: any) => setProgressForm({ ...progressForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mastery-level">Mastery Level</Label>
                    <Select
                      value={progressForm.masteryLevel}
                      onValueChange={(value: "" | "BEGINNER" | "DEVELOPING" | "PROFICIENT" | "MASTERED") =>
                        setProgressForm({ ...progressForm, masteryLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="DEVELOPING">Developing</SelectItem>
                        <SelectItem value="PROFICIENT">Proficient</SelectItem>
                        <SelectItem value="MASTERED">Mastered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-score">Assessment Score</Label>
                    <Input
                      id="assessment-score"
                      type="number"
                      value={progressForm.assessmentScore}
                      onChange={(e) => setProgressForm({ ...progressForm, assessmentScore: e.target.value })}
                      placeholder="0-100"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress-notes">Notes</Label>
                  <Textarea
                    id="progress-notes"
                    value={progressForm.notes}
                    onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                    placeholder="Additional notes about student progress"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)} disabled={isUpdatingProgress}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProgress} disabled={isUpdatingProgress}>
                  {isUpdatingProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Progress
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}