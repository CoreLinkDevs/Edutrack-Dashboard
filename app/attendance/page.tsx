"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { BookOpen, Save, Loader2, ListChecks, CheckCircle, XCircle, CalendarDays, TrendingUp } from "lucide-react"
import { format, subMonths } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Define types based on backend responses
interface Class {
  id: string
  name: string
  schoolId: string
}

interface Lesson {
  id: string
  name: string
  subject: { name: string }
}

interface Student {
  id: string
  name: string
  surname: string
  registrationNumber: string | null
  profileImageUrl: string | null
}

interface AttendanceRecord {
  id?: string // Will be present if already recorded
  studentId: string
  lessonId: string | null
  date: string // ISO string
  present: boolean
  note: string | null
  recordedById?: string
  student: Student
  lesson?: Lesson | null
}

interface ClassAttendanceResponse {
  student: Student
  attendance: AttendanceRecord | null
  status: "present" | "absent" | "not_recorded"
}

// New interfaces for analytics
interface AttendanceSummary {
  totalRecords: number
  presentCount: number
  absentCount: number
  attendanceRate: string // "0.00" format
}

interface TrendData {
  week?: string // ISO string for week start
  month?: string // ISO string for month start
  total: number
  present: number
  absent: number
}

interface AttendanceAnalytics {
  summary: AttendanceSummary
  trends: {
    weekly: TrendData[]
    monthly: TrendData[]
  }
}

const getSchoolName = (schoolId: string, availableSchools: any[]) => {
  const school = availableSchools.find((s) => s.id === schoolId)
  return school ? school.name : "Unknown School"
}

export default function AttendancePage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()

  const [classesList, setClassesList] = useState<Class[]>([])
  const [lessonsList, setLessonsList] = useState<Lesson[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedLessonId, setSelectedLessonId] = useState<string>("ALL") // "ALL" for general attendance, or a specific lesson ID

  const [attendanceData, setAttendanceData] = useState<
    { student: Student; present: boolean; note: string; originalPresent: boolean; originalNote: string }[]
  >([])
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<AttendanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [currentStudentForNote, setCurrentStudentForNote] = useState<Student | null>(null)
  const [currentNote, setCurrentNote] = useState<string>("")

  const canManageAttendance = user?.role === "TEACHER" || user?.role === "SUPER_ADMIN"
  const canViewAnalytics =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "SCHOOL_ADMIN" ||
    user?.role === "PRINCIPAL" ||
    user?.role === "TEACHER"

  // Fetch classes for the dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const params = new URLSearchParams()
        if (currentSchool && user?.role !== "SUPER_ADMIN") {
          params.append("schoolId", currentSchool)
        }
        const response = await fetch(`/api/classes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) throw new Error("Failed to fetch classes")
        const data = await response.json()
        setClassesList(data.classes || [])
        if (data.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(data.classes[0].id) // Auto-select first class
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
    if (accessToken) {
      fetchClasses()
    }
  }, [accessToken, currentSchool, user?.role, toast])

  // Fetch lessons for the selected class
  useEffect(() => {
    const fetchLessons = async () => {
      if (!selectedClassId) {
        setLessonsList([])
        setSelectedLessonId("ALL")
        return
      }
      try {
        const response = await fetch(`/api/lessons?classId=${selectedClassId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) throw new Error("Failed to fetch lessons")
        const data = await response.json()
        setLessonsList(data.lessons || [])
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
    if (accessToken && selectedClassId) {
      fetchLessons()
    }
  }, [accessToken, selectedClassId, toast])

  // Fetch attendance for the selected class, date, and lesson
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate) {
      setAttendanceData([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date: selectedDate,
      })
      if (selectedLessonId !== "ALL") {
        params.append("lessonId", selectedLessonId)
      }

      const response = await fetch(`/api/attendance/class/${selectedClassId}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch attendance")
      }
      const data = await response.json()

      // Initialize attendance data for all students in the class
      const initialAttendance = data.attendance.map((record: ClassAttendanceResponse) => ({
        student: record.student,
        present: record.status === "present",
        note: record.attendance?.note || "",
        originalPresent: record.status === "present",
        originalNote: record.attendance?.note || "",
      }))
      setAttendanceData(initialAttendance)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedDate, selectedLessonId, accessToken, toast])

  // Fetch attendance analytics
  const fetchAttendanceAnalytics = useCallback(async () => {
    if (!selectedClassId) {
      setAttendanceAnalytics(null)
      setLoadingAnalytics(false)
      return
    }
    try {
      setLoadingAnalytics(true)
      const params = new URLSearchParams({
        classId: selectedClassId,
        startDate: format(subMonths(new Date(), 6), "yyyy-MM-dd"), // Last 6 months for monthly trends
        endDate: format(new Date(), "yyyy-MM-dd"),
      })

      const response = await fetch(`/api/attendance/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch attendance analytics")
      }
      const data = await response.json()
      setAttendanceAnalytics(data.analytics)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch attendance analytics",
        variant: "destructive",
      })
    } finally {
      setLoadingAnalytics(false)
    }
  }, [selectedClassId, accessToken, toast])

  useEffect(() => {
    if (accessToken && selectedClassId && selectedDate) {
      fetchAttendance()
    }
  }, [accessToken, selectedClassId, selectedDate, selectedLessonId, fetchAttendance])

  useEffect(() => {
    if (accessToken && selectedClassId && canViewAnalytics) {
      fetchAttendanceAnalytics()
    }
  }, [accessToken, selectedClassId, canViewAnalytics, fetchAttendanceAnalytics])

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendanceData((prev) =>
      prev.map((record) => (record.student.id === studentId ? { ...record, present } : record)),
    )
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceData((prev) => prev.map((record) => (record.student.id === studentId ? { ...record, note } : record)))
  }

  const openNoteDialog = (student: Student, note: string) => {
    setCurrentStudentForNote(student)
    setCurrentNote(note)
    setIsNoteDialogOpen(true)
  }

  const saveNote = () => {
    if (currentStudentForNote) {
      handleNoteChange(currentStudentForNote.id, currentNote)
    }
    setIsNoteDialogOpen(false)
    setCurrentStudentForNote(null)
    setCurrentNote("")
  }

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate) {
      toast({
        title: "Error",
        description: "Please select a class and date before saving attendance.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const attendanceRecordsToSubmit = attendanceData
        .filter(
          (record) => record.present !== record.originalPresent || record.note !== record.originalNote, // Only send changed records
        )
        .map((record) => ({
          studentId: record.student.id,
          present: record.present,
          note: record.note || undefined,
        }))

      if (attendanceRecordsToSubmit.length === 0) {
        toast({
          title: "Info",
          description: "No changes to save.",
        })
        setSaving(false)
        return
      }

      const payload = {
        lessonId: selectedLessonId !== "ALL" ? selectedLessonId : undefined,
        date: new Date(selectedDate).toISOString(),
        attendanceRecords: attendanceRecordsToSubmit,
      }

      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save attendance")
      }
      toast({
        title: "Success",
        description: "Attendance saved successfully!",
      })
      fetchAttendance() // Re-fetch to update original states
      fetchAttendanceAnalytics() // Re-fetch analytics after saving
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = attendanceData.some(
    (record) => record.present !== record.originalPresent || record.note !== record.originalNote,
  )

  if (!user) {
    return null
  }

  // Format trend data for charts
  const formattedWeeklyData =
    attendanceAnalytics?.trends.weekly
      .map((item) => ({
        name: format(new Date(item.week!), "MMM dd"),
        Present: item.present,
        Absent: item.absent,
      }))
      .reverse() || [] // Reverse to show oldest first

  const formattedMonthlyData =
    attendanceAnalytics?.trends.monthly
      .map((item) => ({
        name: format(new Date(item.month!), "MMM yyyy"),
        Present: item.present,
        Absent: item.absent,
      }))
      .reverse() || [] // Reverse to show oldest first

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Attendance Management" subtitle="Record and view student attendance" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.length === 0 && (
                      <SelectItem value="no-classes-available" disabled>
                        No classes available
                      </SelectItem>
                    )}
                    {classesList.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getSchoolName(cls.schoolId, availableSchools)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-48"
                />
                <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Lessons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">General Attendance</SelectItem>
                    {lessonsList.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.name} ({lesson.subject.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {canManageAttendance && (
                <Button onClick={handleSaveAttendance} disabled={saving || !hasChanges || !selectedClassId}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Attendance
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Attendance Grid/Table */}
            {loading ? (
              <div className="grid gap-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : attendanceData.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <ListChecks className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No students found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {selectedClassId
                      ? "No students found for the selected class. Please ensure students are assigned to this class."
                      : "Select a class to view and record attendance."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {attendanceData.map((record) => (
                  <Card
                    key={record.student.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm transition-all duration-200"
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={record.student.profileImageUrl || "/placeholder.svg?height=40&width=40&query=student"}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {record.student.name[0]}
                            {record.student.surname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {record.student.name} {record.student.surname}
                          </CardTitle>
                          {record.student.registrationNumber && (
                            <p className="text-sm text-gray-500">Reg No: {record.student.registrationNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {canManageAttendance && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openNoteDialog(record.student, record.note)}
                            className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Add/Edit Note"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        )}
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`attendance-switch-${record.student.id}`}>Present</Label>
                          <Switch
                            id={`attendance-switch-${record.student.id}`}
                            checked={record.present}
                            onCheckedChange={(checked) => handleAttendanceChange(record.student.id, checked)}
                            disabled={!canManageAttendance}
                          />
                        </div>
                      </div>
                    </CardContent>
                    {record.note && <div className="px-4 pb-4 text-sm text-gray-600 italic">Note: {record.note}</div>}
                  </Card>
                ))}
              </div>
            )}

            {/* Analytics Section */}
            {canViewAnalytics && selectedClassId && (
              <div className="space-y-6 mt-8">
                <h2 className="text-2xl font-bold text-gray-900">Attendance Analytics</h2>
                {loadingAnalytics ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
                    <Card className="h-32 bg-gray-100"></Card>
                    <Card className="h-32 bg-gray-100"></Card>
                    <Card className="h-32 bg-gray-100"></Card>
                    <Card className="h-32 bg-gray-100"></Card>
                    <Card className="col-span-full h-80 bg-gray-100"></Card>
                    <Card className="col-span-full h-80 bg-gray-100"></Card>
                  </div>
                ) : attendanceAnalytics ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.summary.totalRecords}</div>
                          <p className="text-xs text-gray-500">Total attendance entries</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Present Count</CardTitle>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.summary.presentCount}</div>
                          <p className="text-xs text-gray-500">Students marked present</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Absent Count</CardTitle>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.summary.absentCount}</div>
                          <p className="text-xs text-gray-500">Students marked absent</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{attendanceAnalytics.summary.attendanceRate}%</div>
                          <p className="text-xs text-gray-500">Overall attendance percentage</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader>
                          <CardTitle>Weekly Attendance Trends</CardTitle>
                          <CardDescription>Attendance over the last 4 weeks.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              Present: {
                                label: "Present",
                                color: "hsl(var(--chart-1))", // Greenish
                              },
                              Absent: {
                                label: "Absent",
                                color: "hsl(var(--chart-2))", // Reddish
                              },
                            }}
                            className="h-[300px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={formattedWeeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="Present"
                                  stroke="var(--color-Present)"
                                  activeDot={{ r: 8 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="Absent"
                                  stroke="var(--color-Absent)"
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
                        <CardHeader>
                          <CardTitle>Monthly Attendance Trends</CardTitle>
                          <CardDescription>Attendance over the last 6 months.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              Present: {
                                label: "Present",
                                color: "hsl(var(--chart-1))",
                              },
                              Absent: {
                                label: "Absent",
                                color: "hsl(var(--chart-2))",
                              },
                            }}
                            className="h-[300px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={formattedMonthlyData}
                                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="Present"
                                  stroke="var(--color-Present)"
                                  activeDot={{ r: 8 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="Absent"
                                  stroke="var(--color-Absent)"
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12 px-8">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl">
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Analytics Available</h3>
                      <p className="text-gray-600 text-center max-w-md leading-relaxed">
                        Select a class to view its attendance analytics and trends.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Note Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Note for {currentStudentForNote?.name}</DialogTitle>
                  <DialogDescription>Add a note for this student's attendance record.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="e.g., Late arrival, Excused absence, Left early"
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveNote}>Save Note</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}
