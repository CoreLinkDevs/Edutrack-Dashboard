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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Star,
  BookOpen,
  Users,
  FileText,
  MapPin,
} from "lucide-react"

// Define types based on the backend schema
interface AcademicTerm {
  id: string
  name: string
  startDate: string
  endDate: string
  schoolId: string
  academicYearId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  academicYear?: {
    name: string
  }
  _count?: {
    timetables: number
    exams: number
    reportCards: number
  }
}

interface Holiday {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  holidayType: "PUBLIC" | "SCHOOL_SPECIFIC" | "RELIGIOUS" | "NATIONAL" | "REGIONAL"
  schoolId: string
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}

interface CalendarItem {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  itemType: "HOLIDAY" | "EXAM_PERIOD" | "TERM_START" | "TERM_END" | "SPECIAL_EVENT" | "SPORTS_DAY" | "PARENT_TEACHER_MEETING"
  isAllDay: boolean
  termId?: string
  schoolId: string
  academicCalendarId: string
  createdAt: string
  updatedAt: string
  term?: {
    id: string
    name: string
  }
}

export default function AcademicCalendarPage() {
  const { user, currentSchool, accessToken } = useAuth()
  const { toast } = useToast()

  // State for different sections
  const [activeTab, setActiveTab] = useState("terms")

  // Terms state
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [termsLoading, setTermsLoading] = useState(false)
  const [termsSearch, setTermsSearch] = useState("")
  const [isCreateTermDialogOpen, setIsCreateTermDialogOpen] = useState(false)

  // Holidays state
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidaysLoading, setHolidaysLoading] = useState(false)
  const [holidaysSearch, setHolidaysSearch] = useState("")
  const [isCreateHolidayDialogOpen, setIsCreateHolidayDialogOpen] = useState(false)

  // Calendar items state
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [calendarItemsLoading, setCalendarItemsLoading] = useState(false)
  const [calendarItemsSearch, setCalendarItemsSearch] = useState("")
  const [isCreateCalendarItemDialogOpen, setIsCreateCalendarItemDialogOpen] = useState(false)

  // Form data
  const [termFormData, setTermFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    academicYearId: "",
    schoolId: "",
  })

  const [holidayFormData, setHolidayFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    holidayType: "SCHOOL_SPECIFIC" as Holiday["holidayType"],
    isRecurring: false,
    schoolId: "",
  })

  const [calendarItemFormData, setCalendarItemFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    itemType: "SPECIAL_EVENT" as CalendarItem["itemType"],
    isAllDay: true,
    academicCalendarId: "",
    termId: "",
    schoolId: "",
  })

  // Terms functions
  const fetchTerms = async () => {
    try {
      setTermsLoading(true)
      const params = new URLSearchParams()
      if (termsSearch) params.append("search", termsSearch)
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/academic-calendar/terms?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch academic terms")
      }

      const data = await response.json()
      setTerms(data.terms || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch academic terms",
        variant: "destructive",
      })
    } finally {
      setTermsLoading(false)
    }
  }

  // Holidays functions
  const fetchHolidays = async () => {
    try {
      setHolidaysLoading(true)
      const params = new URLSearchParams()
      if (holidaysSearch) params.append("search", holidaysSearch)
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      const response = await fetch(`/api/academic-calendar/holidays?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch holidays")
      }

      const data = await response.json()
      setHolidays(data.holidays || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch holidays",
        variant: "destructive",
      })
    } finally {
      setHolidaysLoading(false)
    }
  }

  // Calendar items functions
  const fetchCalendarItems = async () => {
    try {
      setCalendarItemsLoading(true)
      const params = new URLSearchParams()
      if (calendarItemsSearch) params.append("search", calendarItemsSearch)
      if (currentSchool && user?.role !== "SUPER_ADMIN") {
        params.append("schoolId", currentSchool)
      }

      // For now, fetch from calendar items endpoint - may need to adjust based on API
      const response = await fetch(`/api/academic-calendar/calendar-items?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch calendar items")
      }

      const data = await response.json()
      setCalendarItems(data.calendarItems || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch calendar items",
        variant: "destructive",
      })
    } finally {
      setCalendarItemsLoading(false)
    }
  }

  // Initialize form data based on user role
  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN" && currentSchool) {
      setTermFormData(prev => ({ ...prev, schoolId: currentSchool }))
      setHolidayFormData(prev => ({ ...prev, schoolId: currentSchool }))
      setCalendarItemFormData(prev => ({ ...prev, schoolId: currentSchool }))
    }
  }, [user, currentSchool])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "terms") {
      fetchTerms()
    } else if (activeTab === "holidays") {
      fetchHolidays()
    } else if (activeTab === "items") {
      fetchCalendarItems()
    }
  }, [activeTab])

  // CRUD operations
  const handleCreateTerm = async () => {
    try {
      if (!termFormData.name || !termFormData.startDate || !termFormData.endDate || !termFormData.academicYearId) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      const startDate = new Date(termFormData.startDate)
      const endDate = new Date(termFormData.endDate)
      if (endDate <= startDate) {
        toast({
          title: "Error",
          description: "End date must be after start date",
          variant: "destructive",
        })
        return
      }

      const termData = {
        ...termFormData,
        schoolId: user?.role === "SUPER_ADMIN" ? termFormData.schoolId : currentSchool,
      }

      const response = await fetch("/api/academic-calendar/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(termData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create academic term")
      }

      toast({
        title: "Success",
        description: "Academic term created successfully",
      })

      setIsCreateTermDialogOpen(false)
      resetTermForm()
      fetchTerms()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create academic term",
        variant: "destructive",
      })
    }
  }

  // Reset functions
  const resetTermForm = () => {
    setTermFormData({
      name: "",
      startDate: "",
      endDate: "",
      academicYearId: "",
      schoolId: "",
    })
  }

  const handleCreateHoliday = async () => {
    try {
      if (!holidayFormData.name || !holidayFormData.startDate || !holidayFormData.endDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      const startDate = new Date(holidayFormData.startDate)
      const endDate = new Date(holidayFormData.endDate)
      if (endDate < startDate) {
        toast({
          title: "Error",
          description: "End date must be after or equal to start date",
          variant: "destructive",
        })
        return
      }

      const holidayData = {
        ...holidayFormData,
        schoolId: user?.role === "SUPER_ADMIN" ? holidayFormData.schoolId : currentSchool,
      }

      const response = await fetch("/api/academic-calendar/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(holidayData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create holiday")
      }

      toast({
        title: "Success",
        description: "Holiday created successfully",
      })

      setIsCreateHolidayDialogOpen(false)
      resetHolidayForm()
      fetchHolidays()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create holiday",
        variant: "destructive",
      })
    }
  }

  const resetHolidayForm = () => {
    setHolidayFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      holidayType: "SCHOOL_SPECIFIC",
      isRecurring: false,
      schoolId: "",
    })
  }

  const handleCreateCalendarItem = async () => {
    try {
      if (!calendarItemFormData.title || !calendarItemFormData.startDate || !calendarItemFormData.endDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      const startDate = new Date(calendarItemFormData.startDate)
      const endDate = new Date(calendarItemFormData.endDate)
      if (endDate < startDate) {
        toast({
          title: "Error",
          description: "End date must be after or equal to start date",
          variant: "destructive",
        })
        return
      }

      const itemData = {
        ...calendarItemFormData,
        schoolId: user?.role === "SUPER_ADMIN" ? calendarItemFormData.schoolId : currentSchool,
      }

      const response = await fetch("/api/academic-calendar/calendar-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create calendar item")
      }

      toast({
        title: "Success",
        description: "Calendar item created successfully",
      })

      setIsCreateCalendarItemDialogOpen(false)
      resetCalendarItemForm()
      fetchCalendarItems()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create calendar item",
        variant: "destructive",
      })
    }
  }

  const resetCalendarItemForm = () => {
    setCalendarItemFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      itemType: "SPECIAL_EVENT",
      isAllDay: true,
      academicCalendarId: "",
      termId: "",
      schoolId: "",
    })
  }


  if (!user) {
    return null
  }

  const canManageCalendar = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "PRINCIPAL"

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Academic Calendar" subtitle="Manage terms, holidays, and calendar events" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="holidays">Holidays</TabsTrigger>
              <TabsTrigger value="items">Events</TabsTrigger>
            </TabsList>

            {/* Terms Tab */}
            <TabsContent value="terms" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search terms..."
                      value={termsSearch}
                      onChange={(e) => setTermsSearch(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
                {canManageCalendar && (
                  <Dialog open={isCreateTermDialogOpen} onOpenChange={setIsCreateTermDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Term
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Academic Term</DialogTitle>
                        <DialogDescription>Add a new academic term</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="term-name">Term Name *</Label>
                          <Input
                            id="term-name"
                            value={termFormData.name}
                            onChange={(e) => setTermFormData({ ...termFormData, name: e.target.value })}
                            placeholder="e.g., Term 1, Semester 1"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="term-start">Start Date *</Label>
                            <Input
                              id="term-start"
                              type="date"
                              value={termFormData.startDate}
                              onChange={(e) => setTermFormData({ ...termFormData, startDate: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="term-end">End Date *</Label>
                            <Input
                              id="term-end"
                              type="date"
                              value={termFormData.endDate}
                              onChange={(e) => setTermFormData({ ...termFormData, endDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="academic-year">Academic Year ID *</Label>
                          <Input
                            id="academic-year"
                            value={termFormData.academicYearId}
                            onChange={(e) => setTermFormData({ ...termFormData, academicYearId: e.target.value })}
                            placeholder="Enter academic year ID"
                            required
                          />
                        </div>
                        {user?.role === "SUPER_ADMIN" && (
                          <div className="space-y-2">
                            <Label htmlFor="term-school">School ID *</Label>
                            <Input
                              id="term-school"
                              value={termFormData.schoolId}
                              onChange={(e) => setTermFormData({ ...termFormData, schoolId: e.target.value })}
                              placeholder="Enter school ID"
                              required
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateTermDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTerm}>Create Term</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {termsLoading ? (
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
              ) : terms.length === 0 ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                        <Calendar className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No academic terms found</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Start organizing your academic calendar by adding your first term.
                    </p>
                    {canManageCalendar && (
                      <Button onClick={() => setIsCreateTermDialogOpen(true)}>
                        <Plus className="w-5 h-5 mr-3" />
                        Add Your First Term
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {terms.map((term) => (
                    <Card key={term.id} className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
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
                                {term.name}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={term.isActive ? "default" : "secondary"} className="text-xs">
                                  {term.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {term.academicYear && (
                                  <Badge variant="outline" className="text-xs">
                                    {term.academicYear.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {canManageCalendar && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {term._count && (
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center bg-blue-50 rounded-lg p-3">
                              <div className="text-lg font-bold text-blue-700">{term._count.timetables}</div>
                              <div className="text-xs text-blue-600">Timetables</div>
                            </div>
                            <div className="text-center bg-green-50 rounded-lg p-3">
                              <div className="text-lg font-bold text-green-700">{term._count.exams}</div>
                              <div className="text-xs text-green-600">Exams</div>
                            </div>
                            <div className="text-center bg-purple-50 rounded-lg p-3">
                              <div className="text-lg font-bold text-purple-700">{term._count.reportCards}</div>
                              <div className="text-xs text-purple-600">Reports</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Calendar Overview</CardTitle>
                  <p className="text-sm text-gray-600">View all terms, holidays, and events in a calendar format</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Integration</h3>
                    <p className="text-gray-600 mb-4">
                      A full calendar component with integrated events, terms, and holidays will be implemented here.
                      This will show all academic calendar data in an interactive calendar view.
                    </p>
                    <div className="flex justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Terms</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>Holidays</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        <span>Events</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holidays" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search holidays..."
                      value={holidaysSearch}
                      onChange={(e) => setHolidaysSearch(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
                {canManageCalendar && (
                  <Dialog open={isCreateHolidayDialogOpen} onOpenChange={setIsCreateHolidayDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Holiday
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Holiday</DialogTitle>
                        <DialogDescription>Add a new holiday</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="holiday-name">Holiday Name *</Label>
                          <Input
                            id="holiday-name"
                            value={holidayFormData.name}
                            onChange={(e) => setHolidayFormData({ ...holidayFormData, name: e.target.value })}
                            placeholder="e.g., Christmas Break"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="holiday-description">Description</Label>
                          <Textarea
                            id="holiday-description"
                            value={holidayFormData.description}
                            onChange={(e) => setHolidayFormData({ ...holidayFormData, description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="holiday-start">Start Date *</Label>
                            <Input
                              id="holiday-start"
                              type="date"
                              value={holidayFormData.startDate}
                              onChange={(e) => setHolidayFormData({ ...holidayFormData, startDate: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="holiday-end">End Date *</Label>
                            <Input
                              id="holiday-end"
                              type="date"
                              value={holidayFormData.endDate}
                              onChange={(e) => setHolidayFormData({ ...holidayFormData, endDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="holiday-type">Holiday Type</Label>
                          <Select
                            value={holidayFormData.holidayType}
                            onValueChange={(value: Holiday["holidayType"]) => setHolidayFormData({ ...holidayFormData, holidayType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PUBLIC">Public</SelectItem>
                              <SelectItem value="SCHOOL_SPECIFIC">School Specific</SelectItem>
                              <SelectItem value="RELIGIOUS">Religious</SelectItem>
                              <SelectItem value="NATIONAL">National</SelectItem>
                              <SelectItem value="REGIONAL">Regional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is-recurring"
                            checked={holidayFormData.isRecurring}
                            onChange={(e) => setHolidayFormData({ ...holidayFormData, isRecurring: e.target.checked })}
                          />
                          <Label htmlFor="is-recurring">Recurring holiday</Label>
                        </div>
                        {user?.role === "SUPER_ADMIN" && (
                          <div className="space-y-2">
                            <Label htmlFor="holiday-school">School ID *</Label>
                            <Input
                              id="holiday-school"
                              value={holidayFormData.schoolId}
                              onChange={(e) => setHolidayFormData({ ...holidayFormData, schoolId: e.target.value })}
                              placeholder="Enter school ID"
                              required
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateHolidayDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateHoliday}>Create Holiday</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {holidaysLoading ? (
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
              ) : holidays.length === 0 ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-3xl shadow-2xl">
                        <Sun className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No holidays found</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Add holidays to mark important dates and breaks in the academic calendar.
                    </p>
                    {canManageCalendar && (
                      <Button onClick={() => setIsCreateHolidayDialogOpen(true)}>
                        <Plus className="w-5 h-5 mr-3" />
                        Add Your First Holiday
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {holidays.map((holiday) => (
                    <Card key={holiday.id} className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-2xl shadow-lg">
                                <Sun className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-yellow-600 transition-colors truncate">
                                {holiday.name}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {holiday.holidayType.replace('_', ' ')}
                                </Badge>
                                {holiday.isRecurring && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {canManageCalendar && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(holiday.startDate).toLocaleDateString()} - {new Date(holiday.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-gray-600">{holiday.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search events..."
                      value={calendarItemsSearch}
                      onChange={(e) => setCalendarItemsSearch(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
                {canManageCalendar && (
                  <Dialog open={isCreateCalendarItemDialogOpen} onOpenChange={setIsCreateCalendarItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Calendar Event</DialogTitle>
                        <DialogDescription>Add a new calendar event</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="event-title">Event Title *</Label>
                          <Input
                            id="event-title"
                            value={calendarItemFormData.title}
                            onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, title: e.target.value })}
                            placeholder="e.g., Science Fair"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-description">Description</Label>
                          <Textarea
                            id="event-description"
                            value={calendarItemFormData.description}
                            onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, description: e.target.value })}
                            placeholder="Optional description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="event-start">Start Date *</Label>
                            <Input
                              id="event-start"
                              type="date"
                              value={calendarItemFormData.startDate}
                              onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, startDate: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="event-end">End Date *</Label>
                            <Input
                              id="event-end"
                              type="date"
                              value={calendarItemFormData.endDate}
                              onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, endDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-type">Event Type</Label>
                          <Select
                            value={calendarItemFormData.itemType}
                            onValueChange={(value: CalendarItem["itemType"]) => setCalendarItemFormData({ ...calendarItemFormData, itemType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOLIDAY">Holiday</SelectItem>
                              <SelectItem value="EXAM_PERIOD">Exam Period</SelectItem>
                              <SelectItem value="TERM_START">Term Start</SelectItem>
                              <SelectItem value="TERM_END">Term End</SelectItem>
                              <SelectItem value="SPECIAL_EVENT">Special Event</SelectItem>
                              <SelectItem value="SPORTS_DAY">Sports Day</SelectItem>
                              <SelectItem value="PARENT_TEACHER_MEETING">Parent Teacher Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is-all-day"
                            checked={calendarItemFormData.isAllDay}
                            onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, isAllDay: e.target.checked })}
                          />
                          <Label htmlFor="is-all-day">All day event</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="academic-calendar">Academic Calendar ID</Label>
                          <Input
                            id="academic-calendar"
                            value={calendarItemFormData.academicCalendarId}
                            onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, academicCalendarId: e.target.value })}
                            placeholder="Enter academic calendar ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="term-id">Term ID</Label>
                          <Input
                            id="term-id"
                            value={calendarItemFormData.termId}
                            onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, termId: e.target.value })}
                            placeholder="Optional term ID"
                          />
                        </div>
                        {user?.role === "SUPER_ADMIN" && (
                          <div className="space-y-2">
                            <Label htmlFor="event-school">School ID *</Label>
                            <Input
                              id="event-school"
                              value={calendarItemFormData.schoolId}
                              onChange={(e) => setCalendarItemFormData({ ...calendarItemFormData, schoolId: e.target.value })}
                              placeholder="Enter school ID"
                              required
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateCalendarItemDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCalendarItem}>Create Event</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {calendarItemsLoading ? (
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
              ) : calendarItems.length === 0 ? (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-3xl shadow-2xl">
                        <Star className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No calendar events found</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                      Add special events, sports days, and other important dates to the calendar.
                    </p>
                    {canManageCalendar && (
                      <Button onClick={() => setIsCreateCalendarItemDialogOpen(true)}>
                        <Plus className="w-5 h-5 mr-3" />
                        Add Your First Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {calendarItems.map((item) => (
                    <Card key={item.id} className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                                <Star className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-purple-600 transition-colors truncate">
                                {item.title}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.itemType.replace('_', ' ')}
                                </Badge>
                                {item.isAllDay && (
                                  <Badge variant="secondary" className="text-xs">
                                    All Day
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {canManageCalendar && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        {item.term && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{item.term.name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}