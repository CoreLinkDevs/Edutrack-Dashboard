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
  FileText,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react"

// Define the Exam type
interface Exam {
  id: string
  title: string
  description?: string
  examType: string
  totalMarks: number
  passingMarks: number
  duration: number
  instructions?: string
  startDate: string
  endDate: string
  schoolId: string
  subjectId: string
  gradeId?: string
  classId?: string
  termId?: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function ExamsPage() {
  const { user, currentSchool } = useAuth()
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    examType: "MID_TERM",
    totalMarks: "",
    passingMarks: "",
    duration: "",
    instructions: "",
    startDate: "",
    endDate: "",
    schoolId: "",
    subjectId: "",
    gradeId: "",
    classId: "",
    termId: "",
  })

  useEffect(() => {
    fetchExams()
  }, [])

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

  const { accessToken } = useAuth()

  const fetchExams = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedType !== "ALL") params.append("examType", selectedType)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)

      const response = await fetch(`/api/exams?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch exams")
      }

      const data = await response.json()
      setExams(data.exams || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch exams",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExam = async () => {
    try {
      const examData: any = {
        ...formData,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        duration: Number(formData.duration),
      }

      // Filter out empty string fields
      Object.keys(examData).forEach(key => {
        if (examData[key] === "") {
          delete examData[key]
        }
      })

      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create exam")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Exam created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchExams()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      })
    }
  }

  const handleUpdateExam = async () => {
    if (!editingExam) return
    try {
      const examData = {
        ...formData,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        duration: Number(formData.duration),
      }

      const response = await fetch(`/api/exams/${editingExam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update exam")
      }

      toast({
        title: "Success",
        description: "Exam updated successfully",
      })
      setEditingExam(null)
      resetForm()
      fetchExams()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update exam",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete exam")
      }

      toast({
        title: "Success",
        description: "Exam deleted successfully",
      })
      fetchExams()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      examType: "MID_TERM",
      totalMarks: "",
      passingMarks: "",
      duration: "",
      instructions: "",
      startDate: "",
      endDate: "",
      schoolId: "",
      subjectId: "",
      gradeId: "",
      classId: "",
      termId: "",
    })
  }

  const openEditDialog = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      title: exam.title,
      description: exam.description || "",
      examType: exam.examType,
      totalMarks: exam.totalMarks.toString(),
      passingMarks: exam.passingMarks.toString(),
      duration: exam.duration.toString(),
      instructions: exam.instructions || "",
      startDate: exam.startDate,
      endDate: exam.endDate,
      schoolId: exam.schoolId,
      subjectId: exam.subjectId,
      gradeId: exam.gradeId || "",
      classId: exam.classId || "",
      termId: exam.termId || "",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Exams Management" subtitle="Manage examinations and assessments" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search exams..."
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
                    <SelectItem value="MID_TERM">Mid Term</SelectItem>
                    <SelectItem value="FINAL">Final</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="PRACTICAL">Practical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>Add a new examination to the system</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Exam Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter exam title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Exam description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="examType">Exam Type *</Label>
                        <Select
                          value={formData.examType}
                          onValueChange={(value) => setFormData({ ...formData, examType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MID_TERM">Mid Term</SelectItem>
                            <SelectItem value="FINAL">Final</SelectItem>
                            <SelectItem value="QUIZ">Quiz</SelectItem>
                            <SelectItem value="PRACTICAL">Practical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          placeholder="120"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalMarks">Total Marks *</Label>
                        <Input
                          id="totalMarks"
                          type="number"
                          value={formData.totalMarks}
                          onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                          placeholder="100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passingMarks">Passing Marks *</Label>
                        <Input
                          id="passingMarks"
                          type="number"
                          value={formData.passingMarks}
                          onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                          placeholder="40"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Exam instructions"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {user?.role === "SUPER_ADMIN" && (
                        <div className="space-y-2">
                          <Label htmlFor="schoolId">School ID *</Label>
                          <Input
                            id="schoolId"
                            value={formData.schoolId}
                            onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                            placeholder="Enter school ID"
                            required
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="subjectId">Subject ID *</Label>
                        <Input
                          id="subjectId"
                          value={formData.subjectId}
                          onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                          placeholder="Enter subject ID"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gradeId">Grade ID</Label>
                        <Input
                          id="gradeId"
                          value={formData.gradeId}
                          onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                          placeholder="Enter grade ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classId">Class ID</Label>
                        <Input
                          id="classId"
                          value={formData.classId}
                          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                          placeholder="Enter class ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="termId">Term ID</Label>
                        <Input
                          id="termId"
                          value={formData.termId}
                          onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                          placeholder="Enter term ID"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExam}>Create Exam</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Exams Grid */}
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
            ) : exams.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No exams found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedType !== "ALL" || selectedStatus !== "ALL"
                      ? "We couldn't find any exams matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your examination schedule by adding your first exam to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Exam
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {exams.map((exam) => (
                  <Card
                    key={exam.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {exam.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {exam.examType.replace('_', ' ')}
                              </Badge>
                              <Badge
                                variant={exam.status === "COMPLETED" ? "default" : exam.status === "ONGOING" ? "secondary" : "outline"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  exam.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : exam.status === "ONGOING"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {exam.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(exam)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      {exam.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {exam.description}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {exam.duration} minutes • {exam.totalMarks} marks
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {exam.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingExam} onOpenChange={() => setEditingExam(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Exam</DialogTitle>
                  <DialogDescription>Update exam information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Exam Title *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter exam title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Exam description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-examType">Exam Type *</Label>
                      <Select
                        value={formData.examType}
                        onValueChange={(value) => setFormData({ ...formData, examType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MID_TERM">Mid Term</SelectItem>
                          <SelectItem value="FINAL">Final</SelectItem>
                          <SelectItem value="QUIZ">Quiz</SelectItem>
                          <SelectItem value="PRACTICAL">Practical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="120"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalMarks">Total Marks *</Label>
                      <Input
                        id="edit-totalMarks"
                        type="number"
                        value={formData.totalMarks}
                        onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-passingMarks">Passing Marks *</Label>
                      <Input
                        id="edit-passingMarks"
                        type="number"
                        value={formData.passingMarks}
                        onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                        placeholder="40"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-startDate">Start Date *</Label>
                      <Input
                        id="edit-startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-endDate">End Date *</Label>
                      <Input
                        id="edit-endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-instructions">Instructions</Label>
                    <Textarea
                      id="edit-instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Exam instructions"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {user?.role === "SUPER_ADMIN" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-schoolId">School ID *</Label>
                        <Input
                          id="edit-schoolId"
                          value={formData.schoolId}
                          onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                          placeholder="Enter school ID"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="edit-subjectId">Subject ID *</Label>
                      <Input
                        id="edit-subjectId"
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        placeholder="Enter subject ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-gradeId">Grade ID</Label>
                      <Input
                        id="edit-gradeId"
                        value={formData.gradeId}
                        onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                        placeholder="Enter grade ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-classId">Class ID</Label>
                      <Input
                        id="edit-classId"
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        placeholder="Enter class ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-termId">Term ID</Label>
                      <Input
                        id="edit-termId"
                        value={formData.termId}
                        onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                        placeholder="Enter term ID"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingExam(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateExam}>Update Exam</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}