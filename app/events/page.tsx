"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Users,
  Upload,
  BookOpen,
  Dumbbell,
  Palette,
  Briefcase,
  GraduationCap,
  Sun,
  Info,
  Loader2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Define types based on backend schemas
type EventType = "ACADEMIC" | "SPORTS" | "CULTURAL" | "MEETING" | "EXAMINATION" | "HOLIDAY" | "GENERAL"

type RSVPResponse = "ATTENDING" | "NOT_ATTENDING" | "MAYBE"

interface Class {
  id: string
  name: string
}

interface UserDetails {
  id: string
  name: string | null
  surname: string | null
  email: string
  role?: string
}

interface Event {
  id: string
  title: string
  description: string
  location: string | null
  startTime: string
  endTime: string
  eventType: EventType
  classId: string | null
  schoolId: string
  rsvpRequired: boolean
  imageUrls: string[]
  createdAt: string
  updatedAt: string
  school: { name: string }
  class: Class | null
  createdBy: { user: UserDetails }
  _count: { rsvps: number }
  userRsvp?: RSVPResponse | null // Added from getEventById response
}

interface EventRSVP {
  id: string
  response: RSVPResponse
  respondedAt: string
  user: UserDetails
}

interface School {
  id: string
  name: string
}

const eventTypeIcons: Record<EventType, React.ElementType> = {
  ACADEMIC: BookOpen,
  SPORTS: Dumbbell,
  CULTURAL: Palette,
  MEETING: Briefcase,
  EXAMINATION: GraduationCap,
  HOLIDAY: Sun,
  GENERAL: Info,
}

const rsvpResponseColors: Record<RSVPResponse, string> = {
  ATTENDING: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NOT_ATTENDING: "bg-red-100 text-red-700 border-red-200",
  MAYBE: "bg-orange-100 text-orange-700 border-orange-200",
}

export default function EventsPage() {
  const { user, currentSchool, accessToken, availableSchools } = useAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<Event[]>([])
  const [classesList, setClassesList] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState<string>("ALL")
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL")
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false)
  const [startDateFilter, setStartDateFilter] = useState<string>("")
  const [endDateFilter, setEndDateFilter] = useState<string>("")

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [viewingRsvpsEvent, setViewingRsvpsEvent] = useState<Event | null>(null)
  const [eventRsvps, setEventRsvps] = useState<EventRSVP[]>([])
  const [rsvpSummary, setRsvpSummary] = useState({ total: 0, attending: 0, notAttending: 0, maybe: 0 })
  const [uploadingImagesEvent, setUploadingImagesEvent] = useState<Event | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    eventType: "GENERAL" as EventType,
    classId: "" as string | null,
    rsvpRequired: false,
  })

  const canCreateEditDeleteEvents = user?.role === "PRINCIPAL"||"SUPER_ADMIN"

  // Fetch classes for dropdowns
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
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
    if (accessToken) {
      fetchClasses()
    }
  }, [accessToken, currentSchool, user?.role, toast])

  // Fetch events based on filters
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedEventTypeFilter !== "ALL") params.append("eventType", selectedEventTypeFilter)
      if (selectedClassFilter !== "ALL") params.append("classId", selectedClassFilter)
      if (showUpcomingOnly) params.append("upcoming", "true")
      if (startDateFilter) params.append("startDate", new Date(startDateFilter).toISOString())
      if (endDateFilter) params.append("endDate", new Date(endDateFilter).toISOString())

      const response = await fetch(`/api/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch events")
      }
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch events", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [
    accessToken,
    searchTerm,
    selectedEventTypeFilter,
    selectedClassFilter,
    showUpcomingOnly,
    startDateFilter,
    endDateFilter,
    toast,
  ])

  useEffect(() => {
    if (accessToken) {
      fetchEvents()
    }
  }, [accessToken, fetchEvents])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
      eventType: "GENERAL",
      classId: null,
      rsvpRequired: false,
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location || "",
      startTime: format(parseISO(event.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(parseISO(event.endTime), "yyyy-MM-dd'T'HH:mm"),
      eventType: event.eventType,
      classId: event.classId,
      rsvpRequired: event.rsvpRequired,
    })
  }

  const handleCreateEvent = async () => {
    try {
      if (!formData.title || !formData.description || !formData.startTime || !formData.endTime) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
        return
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          classId: formData.classId === "" ? null : formData.classId, // Ensure empty string becomes null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create event")
      }
      toast({ title: "Success", description: "Event created successfully" })
      setIsCreateDialogOpen(false)
      fetchEvents()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create event", variant: "destructive" })
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return
    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          classId: formData.classId === "" ? null : formData.classId, // Ensure empty string becomes null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update event")
      }
      toast({ title: "Success", description: "Event updated successfully" })
      setEditingEvent(null)
      fetchEvents()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update event", variant: "destructive" })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete event")
      }
      toast({ title: "Success", description: "Event deleted successfully" })
      fetchEvents()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete event", variant: "destructive" })
    }
  }

  const handleRsvpToEvent = async (eventId: string, responseType: RSVPResponse) => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ response: responseType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to RSVP")
      }
      toast({ title: "Success", description: `RSVP recorded as ${responseType.replace("_", " ").toLowerCase()}` })
      fetchEvents() // Re-fetch to update RSVP status on card
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to RSVP", variant: "destructive" })
    }
  }

  const openViewRsvpsDialog = async (event: Event) => {
    setViewingRsvpsEvent(event)
    try {
      const response = await fetch(`/api/events/${event.id}/rsvps`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch RSVPs")
      }
      const data = await response.json()
      setEventRsvps(data.rsvps || [])
      setRsvpSummary(data.summary || { total: 0, attending: 0, notAttending: 0, maybe: 0 })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch RSVPs", variant: "destructive" })
      setViewingRsvpsEvent(null) // Close dialog on error
    }
  }

  const handleImageUpload = async (eventId: string, files: FileList) => {
    if (files.length === 0) return
    try {
      setUploading(true)
      const imageFile = files[0]
      const formData = new FormData()
      formData.append("images", imageFile) // Backend expects 'images'

      const response = await fetch(`/api/events/${eventId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to upload image")
      }
      toast({ title: "Success", description: "Event image uploaded successfully" })
      setUploadingImagesEvent(null)
      fetchEvents()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Event Management" subtitle="Manage school events and activities" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedEventTypeFilter} onValueChange={setSelectedEventTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {Object.values(eventTypeIcons).map((_, index) => {
                      const type = Object.keys(eventTypeIcons)[index] as EventType
                      return (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {classesList.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="upcoming-only">Upcoming</Label>
                  <Checkbox
                    id="upcoming-only"
                    checked={showUpcomingOnly}
                    onCheckedChange={(checked: boolean) => setShowUpcomingOnly(checked)}
                  />
                </div>
                {!showUpcomingOnly && (
                  <>
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="w-full sm:w-40"
                      title="Start Date"
                    />
                    <Input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="w-full sm:w-40"
                      title="End Date"
                    />
                  </>
                )}
              </div>
              {canCreateEditDeleteEvents && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                      <DialogDescription>Schedule a new school event or activity.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Annual Sports Day, Parent-Teacher Meeting"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Detailed description of the event."
                          rows={3}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g., School Auditorium, Main Field"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time *</Label>
                          <Input
                            id="startTime"
                            type="datetime-local"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time *</Label>
                          <Input
                            id="endTime"
                            type="datetime-local"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eventType">Event Type *</Label>
                        <Select
                          value={formData.eventType}
                          onValueChange={(value: EventType) => setFormData({ ...formData, eventType: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(eventTypeIcons).map((_, index) => {
                              const type = Object.keys(eventTypeIcons)[index] as EventType
                              return (
                                <SelectItem key={type} value={type}>
                                  {type.replace("_", " ")}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classId">Target Class (Optional)</Label>
                        <Select
                          value={formData.classId || "ALL"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, classId: value === "ALL" ? null : value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All Classes (School-wide)</SelectItem>
                            {classesList.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rsvpRequired"
                          checked={formData.rsvpRequired}
                          onCheckedChange={(checked: boolean) => setFormData({ ...formData, rsvpRequired: checked })}
                        />
                        <Label htmlFor="rsvpRequired">RSVP Required</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateEvent}>Create Event</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {/* Events Grid */}
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
            ) : events.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <Calendar className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No events found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedEventTypeFilter !== "ALL" || selectedClassFilter !== "ALL"
                      ? "We couldn't find any events matching your criteria. Try adjusting your filters or search terms."
                      : "Start organizing your school year by adding your first event."}
                  </p>
                  {canCreateEditDeleteEvents && (
                    <Button
                      onClick={openCreateDialog}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-3" />
                      Add Your First Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => {
                  const EventIcon = eventTypeIcons[event.eventType] || Info
                  const isUpcoming = parseISO(event.startTime) > new Date()
                  const userRsvpStatus = event.userRsvp // This comes from getEventById, but we don't have it in the list view.
                  // For now, we'll assume userRsvp is null in the list view and only show RSVP options.
                  // A more robust solution would involve fetching individual event details or a summary of user RSVPs.

                  return (
                    <Card
                      key={event.id}
                      className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                    >
                      <CardHeader className="p-6 pb-4 flex-shrink-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="relative flex-shrink-0">
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                                <EventIcon className="w-8 h-8" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                                {event.title}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-gray-200 text-gray-700 bg-gray-50"
                                >
                                  {event.eventType.replace("_", " ")}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold px-2 py-1 rounded-full border-green-200 text-green-700 bg-green-50"
                                >
                                  {event.school.name}
                                </Badge>
                                {event.class && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                                  >
                                    {event.class.name}
                                  </Badge>
                                )}
                                {isUpcoming && (
                                  <Badge
                                    variant="default"
                                    className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-500 text-white"
                                  >
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {canCreateEditDeleteEvents && (
                            <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(event)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadingImagesEvent(event)}
                                className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                                title="Upload Images"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pt-0 pb-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                              {format(parseISO(event.startTime), "MMM dd, yyyy HH:mm")} -{" "}
                              {format(parseISO(event.endTime), "HH:mm")}
                            </p>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-orange-600" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{event.location}</p>
                            </div>
                          )}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4">
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 italic">
                              "{event.description}"
                            </p>
                          </div>
                        </div>

                        {event.rsvpRequired && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">RSVP:</h5>
                            <div className="flex flex-wrap gap-2">
                              {userRsvpStatus ? (
                                <Badge
                                  variant="default"
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    rsvpResponseColors[userRsvpStatus]
                                  }`}
                                >
                                  {userRsvpStatus.replace("_", " ")}
                                </Badge>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-3 bg-transparent"
                                    onClick={() => handleRsvpToEvent(event.id, "ATTENDING")}
                                  >
                                    Attending
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-3 bg-transparent"
                                    onClick={() => handleRsvpToEvent(event.id, "NOT_ATTENDING")}
                                  >
                                    Not Attending
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-3 bg-transparent"
                                    onClick={() => handleRsvpToEvent(event.id, "MAYBE")}
                                  >
                                    Maybe
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {event.imageUrls && event.imageUrls.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">Images:</h5>
                            <div className="flex flex-wrap gap-2">
                              {event.imageUrls.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url || "/placeholder.svg"}
                                  alt={`Event image ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-md shadow-sm"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                          <div className="text-xs text-gray-500 font-medium">
                            Created by: {event.createdBy.user.name} {event.createdBy.user.surname}
                          </div>
                          {event.rsvpRequired && canCreateEditDeleteEvents && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewRsvpsDialog(event)}
                              className="h-8 w-8 p-0 hover:bg-gray-50 hover:text-gray-600 rounded-lg"
                              title="View RSVPs"
                            >
                              <Users className="w-4 h-4" />
                              <span className="ml-1 text-xs">{event._count.rsvps}</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Edit Dialog */}
            <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>Update event details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Event Title *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Annual Sports Day, Parent-Teacher Meeting"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the event."
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., School Auditorium, Main Field"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-startTime">Start Time *</Label>
                      <Input
                        id="edit-startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-endTime">End Time *</Label>
                      <Input
                        id="edit-endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-eventType">Event Type *</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value: EventType) => setFormData({ ...formData, eventType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(eventTypeIcons).map((_, index) => {
                          const type = Object.keys(eventTypeIcons)[index] as EventType
                          return (
                            <SelectItem key={type} value={type}>
                              {type.replace("_", " ")}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-classId">Target Class (Optional)</Label>
                    <Select
                      value={formData.classId || "ALL"}
                      onValueChange={(value) => setFormData({ ...formData, classId: value === "ALL" ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Classes (School-wide)</SelectItem>
                        {classesList.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-rsvpRequired"
                      checked={formData.rsvpRequired}
                      onCheckedChange={(checked: boolean) => setFormData({ ...formData, rsvpRequired: checked })}
                    />
                    <Label htmlFor="edit-rsvpRequired">RSVP Required</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingEvent(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateEvent}>Update Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* View RSVPs Dialog */}
            <Dialog open={!!viewingRsvpsEvent} onOpenChange={() => setViewingRsvpsEvent(null)}>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>RSVPs for {viewingRsvpsEvent?.title}</DialogTitle>
                  <DialogDescription>View responses for this event.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-2 text-center font-semibold text-sm">
                    <div className="p-2 bg-emerald-50 rounded-md">Attending: {rsvpSummary.attending}</div>
                    <div className="p-2 bg-red-50 rounded-md">Not Attending: {rsvpSummary.notAttending}</div>
                    <div className="p-2 bg-orange-50 rounded-md">Maybe: {rsvpSummary.maybe}</div>
                  </div>
                  {eventRsvps.length === 0 ? (
                    <p className="text-center text-gray-500 italic">No RSVPs recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {eventRsvps.map((rsvp) => (
                        <div
                          key={rsvp.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                {rsvp.user.name?.[0]}
                                {rsvp.user.surname?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {rsvp.user.name} {rsvp.user.surname}
                              </p>
                              <p className="text-xs text-gray-500">{rsvp.user.email}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              rsvpResponseColors[rsvp.response]
                            }`}
                          >
                            {rsvp.response.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewingRsvpsEvent(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Upload Images Dialog */}
            <Dialog open={!!uploadingImagesEvent} onOpenChange={() => setUploadingImagesEvent(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Images for {uploadingImagesEvent?.title}</DialogTitle>
                  <DialogDescription>Add images to this event.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FileUpload
                    accept="image/*"
                    maxSize={5} // 5MB
                    maxFiles={1}
                    onFileSelect={(files) => {
                      if (uploadingImagesEvent) {
                        handleImageUpload(uploadingImagesEvent.id, files)
                      }
                    }}
                    disabled={uploading}
                  >
                    <Button disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" /> Select Image
                        </>
                      )}
                    </Button>
                  </FileUpload>
                  {uploadingImagesEvent?.imageUrls && uploadingImagesEvent.imageUrls.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">Current Images:</h5>
                      <div className="flex flex-wrap gap-2">
                        {uploadingImagesEvent.imageUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url || "/placeholder.svg"}
                            alt={`Event image ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-md shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadingImagesEvent(null)}>
                    Done
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
