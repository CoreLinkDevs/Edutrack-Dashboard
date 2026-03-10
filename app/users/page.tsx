"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Edit, Trash2, Users, GraduationCap, UserCheck, Calendar } from "lucide-react"
import type { Teacher, Subject } from "@/lib/types"

export default function TeachersPage() {
  const { user, currentSchool } = useAuth()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("ALL")
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    surname: "",
    phone: "",
    qualifications: "",
    bio: "",
    department: "",
    specialization: "",
    subjectIds: [] as string[],
  })

  useEffect(() => {
    fetchTeachers()
    fetchSubjects()
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}

      if (searchTerm) params.search = searchTerm
      if (selectedApprovalStatus !== "ALL") params.approvalStatus = selectedApprovalStatus
      if (selectedSubject !== "ALL") params.subjectId = selectedSubject
      if (currentSchool?.id && !user?.isSuperAdmin) params.schoolId = currentSchool.id

      const response = await apiClient.getTeachers(params)
      setTeachers(response.teachers || [])
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

  const fetchSubjects = async () => {
    try {
      const params: Record<string, string> = {}
      if (currentSchool?.id && !user?.isSuperAdmin) params.schoolId = currentSchool.id

      const response = await apiClient.getSubjects(params)
      setSubjects(response.subjects || [])
    } catch (error: any) {
      console.error("Failed to fetch subjects:", error)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTeachers()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedApprovalStatus, selectedSubject])

  const handleCreateTeacher = async () => {
    try {
      const teacherData = {
        ...formData,
        schoolId: currentSchool?.id || user?.schoolId,
      }
      await apiClient.createTeacher(teacherData)
      toast({
        title: "Success",
        description: "Teacher created successfully",
      })
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
      await apiClient.updateTeacher(editingTeacher.id, formData)
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
      await apiClient.deleteTeacher(teacherId)
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

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      surname: "",
      phone: "",
      qualifications: "",
      bio: "",
      department: "",
      specialization: "",
      subjectIds: [],
    })
  }

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      email: teacher.user.email,
      name: teacher.user.name,
      surname: teacher.user.surname,
      phone: teacher.user.phone || "",
      qualifications: teacher.qualifications,
      bio: teacher.bio || "",
      department: teacher.department || "",
      specialization: teacher.specialization || "",
      subjectIds: teacher.subjects?.map((s) => s.id) || [],
    })
  }

  const canManageTeachers = user?.role && ["SUPER_ADMIN", "PRINCIPAL"].includes(user.role)

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Teachers Management" subtitle="Manage teaching staff and assignments" />
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
                <Select value={selectedApprovalStatus} onValueChange={setSelectedApprovalStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
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
                      <DialogDescription>Add a new teacher to the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">First Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="surname">Last Name *</Label>
                          <Input
                            id="surname"
                            value={formData.surname}
                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="teacher@school.edu"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Mathematics"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            id="specialization"
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            placeholder="Advanced Mathematics"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qualifications">Qualifications *</Label>
                        <Textarea
                          id="qualifications"
                          value={formData.qualifications}
                          onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                          placeholder="B.Ed Mathematics, M.Sc Mathematics"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biography</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Professional biography and experience"
                          rows={3}
                        />
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCheck className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                  <p className="text-gray-500 text-center mb-4">
                    {searchTerm || selectedApprovalStatus !== "ALL" || selectedSubject !== "ALL"
                      ? "Try adjusting your search criteria"
                      : "Get started by adding your first teacher"}
                  </p>
                  {canManageTeachers && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Teacher
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teachers.map((teacher) => (
                  <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={teacher.user.profileImageUrl || "/placeholder.svg"} />
                            <AvatarFallback>
                              {teacher.user.name[0]}
                              {teacher.user.surname[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {teacher.user.name} {teacher.user.surname}
                            </CardTitle>
                            <CardDescription>{teacher.department || "No department"}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              teacher.approvalStatus === "APPROVED"
                                ? "default"
                                : teacher.approvalStatus === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {teacher.approvalStatus}
                          </Badge>
                          {canManageTeachers && (
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(teacher)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">📧 {teacher.user.email}</p>
                          {teacher.user.phone && <p className="text-sm text-gray-600">📞 {teacher.user.phone}</p>}
                        </div>

                        {teacher.specialization && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Specialization</p>
                            <p className="text-sm text-gray-600">{teacher.specialization}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-gray-900">Qualifications</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{teacher.qualifications}</p>
                        </div>

                        {teacher.subjects && teacher.subjects.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Subjects</p>
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects.slice(0, 3).map((subject) => (
                                <Badge key={subject.id} variant="outline" className="text-xs">
                                  {subject.name}
                                </Badge>
                              ))}
                              {teacher.subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{teacher.subjects.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {teacher._count && (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{teacher._count.classes}</p>
                                <p className="text-xs text-gray-500">Classes</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{teacher._count.students}</p>
                                <p className="text-xs text-gray-500">Students</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {teacher.bio && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-600 line-clamp-3">{teacher.bio}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 pt-2 border-t">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">
                              Joined: {new Date(teacher.user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingTeacher} onOpenChange={() => setEditingTeacher(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Teacher</DialogTitle>
                  <DialogDescription>Update teacher information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">First Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-surname">Last Name *</Label>
                      <Input
                        id="edit-surname"
                        value={formData.surname}
                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="teacher@school.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Mathematics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-specialization">Specialization</Label>
                      <Input
                        id="edit-specialization"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="Advanced Mathematics"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-qualifications">Qualifications *</Label>
                    <Textarea
                      id="edit-qualifications"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      placeholder="B.Ed Mathematics, M.Sc Mathematics"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Biography</Label>
                    <Textarea
                      id="edit-bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Professional biography and experience"
                      rows={3}
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
          </div>
        </main>
      </div>
    </div>
  )
}
