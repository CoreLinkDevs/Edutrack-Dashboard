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
  CheckCircle,
  Eye,
} from "lucide-react"

// Define the ReportCard type
interface ReportCard {
  id: string
  title: string
  studentId: string
  academicYearId: string
  termId?: string
  schoolId: string
  overallGrade?: string
  overallGPA?: number
  totalMarks?: number
  obtainedMarks?: number
  percentage?: number
  position?: number
  totalStudents?: number
  teacherComments?: string
  principalComments?: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function ReportCardsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingReportCard, setEditingReportCard] = useState<ReportCard | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    studentId: "",
    academicYearId: "",
    termId: "",
    schoolId: "",
    overallGrade: "",
    overallGPA: "",
    totalMarks: "",
    obtainedMarks: "",
    percentage: "",
    position: "",
    totalStudents: "",
    teacherComments: "",
    principalComments: "",
  })

  useEffect(() => {
    fetchReportCards()
  }, [])

  const { accessToken } = useAuth()

  const fetchReportCards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)

      const response = await fetch(`/api/report-cards?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch report cards")
      }

      const data = await response.json()
      setReportCards(data.reportCards || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch report cards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReportCard = async () => {
    try {
      const reportCardData: any = {
        ...formData,
        overallGPA: formData.overallGPA ? Number(formData.overallGPA) : undefined,
        totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
        obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : undefined,
        percentage: formData.percentage ? Number(formData.percentage) : undefined,
        position: formData.position ? Number(formData.position) : undefined,
        totalStudents: formData.totalStudents ? Number(formData.totalStudents) : undefined,
      }

      // Filter out empty string fields
      Object.keys(reportCardData).forEach(key => {
        if (reportCardData[key] === "") {
          delete reportCardData[key]
        }
      })

      const response = await fetch("/api/report-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reportCardData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create report card")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Report card created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchReportCards()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create report card",
        variant: "destructive",
      })
    }
  }

  const handleUpdateReportCard = async () => {
    if (!editingReportCard) return
    try {
      const reportCardData = {
        ...formData,
        overallGPA: formData.overallGPA ? Number(formData.overallGPA) : undefined,
        totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
        obtainedMarks: formData.obtainedMarks ? Number(formData.obtainedMarks) : undefined,
        percentage: formData.percentage ? Number(formData.percentage) : undefined,
        position: formData.position ? Number(formData.position) : undefined,
        totalStudents: formData.totalStudents ? Number(formData.totalStudents) : undefined,
      }

      const response = await fetch(`/api/report-cards/${editingReportCard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reportCardData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update report card")
      }

      toast({
        title: "Success",
        description: "Report card updated successfully",
      })
      setEditingReportCard(null)
      resetForm()
      fetchReportCards()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report card",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReportCard = async (reportCardId: string) => {
    if (!confirm("Are you sure you want to delete this report card? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/report-cards/${reportCardId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete report card")
      }

      toast({
        title: "Success",
        description: "Report card deleted successfully",
      })
      fetchReportCards()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report card",
        variant: "destructive",
      })
    }
  }

  const handleApproveReportCard = async (reportCardId: string) => {
    try {
      const response = await fetch(`/api/report-cards/${reportCardId}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve report card")
      }

      toast({
        title: "Success",
        description: "Report card approved successfully",
      })
      fetchReportCards()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve report card",
        variant: "destructive",
      })
    }
  }

  const handlePublishReportCard = async (reportCardId: string) => {
    try {
      const response = await fetch(`/api/report-cards/${reportCardId}/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to publish report card")
      }

      toast({
        title: "Success",
        description: "Report card published successfully",
      })
      fetchReportCards()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish report card",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      studentId: "",
      academicYearId: "",
      termId: "",
      schoolId: "",
      overallGrade: "",
      overallGPA: "",
      totalMarks: "",
      obtainedMarks: "",
      percentage: "",
      position: "",
      totalStudents: "",
      teacherComments: "",
      principalComments: "",
    })
  }

  const openEditDialog = (reportCard: ReportCard) => {
    setEditingReportCard(reportCard)
    setFormData({
      title: reportCard.title,
      studentId: reportCard.studentId,
      academicYearId: reportCard.academicYearId,
      termId: reportCard.termId || "",
      schoolId: reportCard.schoolId,
      overallGrade: reportCard.overallGrade || "",
      overallGPA: reportCard.overallGPA?.toString() || "",
      totalMarks: reportCard.totalMarks?.toString() || "",
      obtainedMarks: reportCard.obtainedMarks?.toString() || "",
      percentage: reportCard.percentage?.toString() || "",
      position: reportCard.position?.toString() || "",
      totalStudents: reportCard.totalStudents?.toString() || "",
      teacherComments: reportCard.teacherComments || "",
      principalComments: reportCard.principalComments || "",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Report Cards Management" subtitle="Manage student report cards and academic records" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search report cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Report Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Report Card</DialogTitle>
                    <DialogDescription>Add a new report card for a student</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Report Card Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter report card title"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID *</Label>
                        <Input
                          id="studentId"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="Enter student ID"
                          required
                        />
                      </div>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="academicYearId">Academic Year ID *</Label>
                        <Input
                          id="academicYearId"
                          value={formData.academicYearId}
                          onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                          placeholder="Enter academic year ID"
                          required
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="overallGrade">Overall Grade</Label>
                        <Input
                          id="overallGrade"
                          value={formData.overallGrade}
                          onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value })}
                          placeholder="A, B, C, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overallGPA">Overall GPA</Label>
                        <Input
                          id="overallGPA"
                          type="number"
                          step="0.01"
                          value={formData.overallGPA}
                          onChange={(e) => setFormData({ ...formData, overallGPA: e.target.value })}
                          placeholder="4.0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalMarks">Total Marks</Label>
                        <Input
                          id="totalMarks"
                          type="number"
                          value={formData.totalMarks}
                          onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="obtainedMarks">Obtained Marks</Label>
                        <Input
                          id="obtainedMarks"
                          type="number"
                          value={formData.obtainedMarks}
                          onChange={(e) => setFormData({ ...formData, obtainedMarks: e.target.value })}
                          placeholder="85"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="percentage">Percentage</Label>
                        <Input
                          id="percentage"
                          type="number"
                          step="0.01"
                          value={formData.percentage}
                          onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                          placeholder="85.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          type="number"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalStudents">Total Students</Label>
                        <Input
                          id="totalStudents"
                          type="number"
                          value={formData.totalStudents}
                          onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                          placeholder="50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacherComments">Teacher Comments</Label>
                      <Textarea
                        id="teacherComments"
                        value={formData.teacherComments}
                        onChange={(e) => setFormData({ ...formData, teacherComments: e.target.value })}
                        placeholder="Teacher's comments"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="principalComments">Principal Comments</Label>
                      <Textarea
                        id="principalComments"
                        value={formData.principalComments}
                        onChange={(e) => setFormData({ ...formData, principalComments: e.target.value })}
                        placeholder="Principal's comments"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReportCard}>Create Report Card</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Report Cards Grid */}
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
            ) : reportCards.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No report cards found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedStatus !== "ALL"
                      ? "We couldn't find any report cards matching your criteria. Try adjusting your filters or search terms."
                      : "Start managing student report cards by adding your first report card to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Report Card
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {reportCards.map((reportCard) => (
                  <Card
                    key={reportCard.id}
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
                              {reportCard.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                              >
                                {reportCard.overallGrade || "No Grade"}
                              </Badge>
                              <Badge
                                variant={reportCard.status === "PUBLISHED" ? "default" : reportCard.status === "APPROVED" ? "secondary" : "outline"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  reportCard.status === "PUBLISHED"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : reportCard.status === "APPROVED"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {reportCard.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(reportCard)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {reportCard.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveReportCard(reportCard.id)}
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg"
                              title="Approve Report Card"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {reportCard.status === "APPROVED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublishReportCard(reportCard.id)}
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                              title="Publish Report Card"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReportCard(reportCard.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      <div className="space-y-2 mb-4">
                        {reportCard.overallGPA && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">GPA: {reportCard.overallGPA}</span>
                          </div>
                        )}
                        {reportCard.percentage && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Percentage: {reportCard.percentage}%</span>
                          </div>
                        )}
                        {reportCard.position && reportCard.totalStudents && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              Position: {reportCard.position} of {reportCard.totalStudents}
                            </span>
                          </div>
                        )}
                      </div>
                      {reportCard.teacherComments && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            <span className="font-medium">Teacher:</span> {reportCard.teacherComments}
                          </p>
                        </div>
                      )}
                      {reportCard.principalComments && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            <span className="font-medium">Principal:</span> {reportCard.principalComments}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          Student ID: {reportCard.studentId.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingReportCard} onOpenChange={() => setEditingReportCard(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Report Card</DialogTitle>
                  <DialogDescription>Update report card information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Report Card Title *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter report card title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-studentId">Student ID *</Label>
                      <Input
                        id="edit-studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        placeholder="Enter student ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-schoolId">School ID *</Label>
                      <Input
                        id="edit-schoolId"
                        value={formData.schoolId}
                        onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                        placeholder="Enter school ID"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-academicYearId">Academic Year ID *</Label>
                      <Input
                        id="edit-academicYearId"
                        value={formData.academicYearId}
                        onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                        placeholder="Enter academic year ID"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-overallGrade">Overall Grade</Label>
                      <Input
                        id="edit-overallGrade"
                        value={formData.overallGrade}
                        onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value })}
                        placeholder="A, B, C, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-overallGPA">Overall GPA</Label>
                      <Input
                        id="edit-overallGPA"
                        type="number"
                        step="0.01"
                        value={formData.overallGPA}
                        onChange={(e) => setFormData({ ...formData, overallGPA: e.target.value })}
                        placeholder="4.0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalMarks">Total Marks</Label>
                      <Input
                        id="edit-totalMarks"
                        type="number"
                        value={formData.totalMarks}
                        onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-obtainedMarks">Obtained Marks</Label>
                      <Input
                        id="edit-obtainedMarks"
                        type="number"
                        value={formData.obtainedMarks}
                        onChange={(e) => setFormData({ ...formData, obtainedMarks: e.target.value })}
                        placeholder="85"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-percentage">Percentage</Label>
                      <Input
                        id="edit-percentage"
                        type="number"
                        step="0.01"
                        value={formData.percentage}
                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                        placeholder="85.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-position">Position</Label>
                      <Input
                        id="edit-position"
                        type="number"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-totalStudents">Total Students</Label>
                      <Input
                        id="edit-totalStudents"
                        type="number"
                        value={formData.totalStudents}
                        onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-teacherComments">Teacher Comments</Label>
                    <Textarea
                      id="edit-teacherComments"
                      value={formData.teacherComments}
                      onChange={(e) => setFormData({ ...formData, teacherComments: e.target.value })}
                      placeholder="Teacher's comments"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-principalComments">Principal Comments</Label>
                    <Textarea
                      id="edit-principalComments"
                      value={formData.principalComments}
                      onChange={(e) => setFormData({ ...formData, principalComments: e.target.value })}
                      placeholder="Principal's comments"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingReportCard(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateReportCard}>Update Report Card</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}