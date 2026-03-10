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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  Clock,
} from "lucide-react"

// Define the Timetable type
interface Timetable {
  id: string
  name: string
  academicYearId: string
  termId?: string
  effectiveFrom: string
  effectiveTo?: string
  schoolId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function TimetablesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    academicYearId: "",
    termId: "",
    effectiveFrom: "",
    effectiveTo: "",
    schoolId: "",
  })

  useEffect(() => {
    fetchTimetables()
  }, [])

  const { accessToken } = useAuth()

  const fetchTimetables = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/timetables?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch timetables")
      }

      const data = await response.json()
      setTimetables(data.timetables || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch timetables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTimetable = async () => {
    try {
      const timetableData: any = {
        ...formData,
      }

      // Filter out empty string fields
      Object.keys(timetableData).forEach(key => {
        if (timetableData[key] === "") {
          delete timetableData[key]
        }
      })

      const response = await fetch("/api/timetables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(timetableData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create timetable")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Timetable created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchTimetables()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create timetable",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTimetable = async () => {
    if (!editingTimetable) return
    try {
      const timetableData = {
        ...formData,
      }

      const response = await fetch(`/api/timetables/${editingTimetable.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(timetableData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update timetable")
      }

      toast({
        title: "Success",
        description: "Timetable updated successfully",
      })
      setEditingTimetable(null)
      resetForm()
      fetchTimetables()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update timetable",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTimetable = async (timetableId: string) => {
    if (!confirm("Are you sure you want to delete this timetable? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/timetables/${timetableId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete timetable")
      }

      toast({
        title: "Success",
        description: "Timetable deleted successfully",
      })
      fetchTimetables()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete timetable",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      academicYearId: "",
      termId: "",
      effectiveFrom: "",
      effectiveTo: "",
      schoolId: "",
    })
  }

  const openEditDialog = (timetable: Timetable) => {
    setEditingTimetable(timetable)
    setFormData({
      name: timetable.name,
      academicYearId: timetable.academicYearId,
      termId: timetable.termId || "",
      effectiveFrom: timetable.effectiveFrom,
      effectiveTo: timetable.effectiveTo || "",
      schoolId: timetable.schoolId,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Timetables Management" subtitle="Manage school schedules and class timetables" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search timetables..."
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
                    Add Timetable
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Timetable</DialogTitle>
                    <DialogDescription>Add a new timetable for school scheduling</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Timetable Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter timetable name"
                        required
                      />
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
                        <Label htmlFor="effectiveFrom">Effective From *</Label>
                        <Input
                          id="effectiveFrom"
                          type="date"
                          value={formData.effectiveFrom}
                          onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effectiveTo">Effective To</Label>
                        <Input
                          id="effectiveTo"
                          type="date"
                          value={formData.effectiveTo}
                          onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                        />
                      </div>
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTimetable}>Create Timetable</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Timetables Grid */}
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
            ) : timetables.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Calendar className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No timetables found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any timetables matching your criteria. Try adjusting your search terms."
                      : "Start organizing your school schedule by adding your first timetable to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Timetable
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {timetables.map((timetable) => (
                  <Card
                    key={timetable.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {timetable.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={timetable.isActive ? "default" : "secondary"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  timetable.isActive
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {timetable.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(timetable)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTimetable(timetable.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {new Date(timetable.effectiveFrom).toLocaleDateString()}
                            {timetable.effectiveTo && ` - ${new Date(timetable.effectiveTo).toLocaleDateString()}`}
                          </span>
                        </div>
                        {timetable.termId && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Term: {timetable.termId}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {timetable.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingTimetable} onOpenChange={() => setEditingTimetable(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Timetable</DialogTitle>
                  <DialogDescription>Update timetable information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Timetable Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter timetable name"
                    />
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
                      <Label htmlFor="edit-effectiveFrom">Effective From *</Label>
                      <Input
                        id="edit-effectiveFrom"
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-effectiveTo">Effective To</Label>
                      <Input
                        id="edit-effectiveTo"
                        type="date"
                        value={formData.effectiveTo}
                        onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                      />
                    </div>
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingTimetable(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTimetable}>Update Timetable</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}