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
  MapPin,
  Loader2,
  Users,
} from "lucide-react"

// Define the Room type
interface Room {
  id: string
  name: string
  code?: string
  capacity: number
  roomType: string
  floor?: string
  building?: string
  facilities?: string[]
  schoolId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function RoomsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    capacity: "",
    roomType: "CLASSROOM",
    floor: "",
    building: "",
    facilities: "",
    schoolId: "",
  })

  useEffect(() => {
    fetchRooms()
  }, [])

  const { accessToken } = useAuth()

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedType !== "ALL") params.append("roomType", selectedType)

      const response = await fetch(`/api/rooms?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch rooms")
      }

      const data = await response.json()
      setRooms(data.rooms || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch rooms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    try {
      const roomData: any = {
        ...formData,
        capacity: Number(formData.capacity),
        facilities: formData.facilities ? formData.facilities.split(',').map(f => f.trim()) : undefined,
      }

      // Filter out empty string fields
      Object.keys(roomData).forEach(key => {
        if (roomData[key] === "") {
          delete roomData[key]
        }
      })

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roomData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create room")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Room created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchRooms()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRoom = async () => {
    if (!editingRoom) return
    try {
      const roomData = {
        ...formData,
        capacity: Number(formData.capacity),
        facilities: formData.facilities ? formData.facilities.split(',').map(f => f.trim()) : undefined,
      }

      const response = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roomData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update room")
      }

      toast({
        title: "Success",
        description: "Room updated successfully",
      })
      setEditingRoom(null)
      resetForm()
      fetchRooms()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete room")
      }

      toast({
        title: "Success",
        description: "Room deleted successfully",
      })
      fetchRooms()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      capacity: "",
      roomType: "CLASSROOM",
      floor: "",
      building: "",
      facilities: "",
      schoolId: "",
    })
  }

  const openEditDialog = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      code: room.code || "",
      capacity: room.capacity.toString(),
      roomType: room.roomType,
      floor: room.floor || "",
      building: room.building || "",
      facilities: room.facilities ? room.facilities.join(', ') : "",
      schoolId: room.schoolId,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Rooms Management" subtitle="Manage school facilities and room allocations" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search rooms..."
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
                    <SelectItem value="CLASSROOM">Classroom</SelectItem>
                    <SelectItem value="LABORATORY">Laboratory</SelectItem>
                    <SelectItem value="LIBRARY">Library</SelectItem>
                    <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                    <SelectItem value="GYMNASIUM">Gymnasium</SelectItem>
                    <SelectItem value="OFFICE">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Room</DialogTitle>
                    <DialogDescription>Add a new room to the school facility</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Room Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter room name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Room Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="e.g., RM101"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity *</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roomType">Room Type *</Label>
                        <Select
                          value={formData.roomType}
                          onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLASSROOM">Classroom</SelectItem>
                            <SelectItem value="LABORATORY">Laboratory</SelectItem>
                            <SelectItem value="LIBRARY">Library</SelectItem>
                            <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                            <SelectItem value="GYMNASIUM">Gymnasium</SelectItem>
                            <SelectItem value="OFFICE">Office</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                          id="floor"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          placeholder="Ground Floor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="building">Building</Label>
                        <Input
                          id="building"
                          value={formData.building}
                          onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                          placeholder="Main Building"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facilities">Facilities</Label>
                      <Textarea
                        id="facilities"
                        value={formData.facilities}
                        onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                        placeholder="Projector, Whiteboard, Computers (comma-separated)"
                        rows={2}
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom}>Create Room</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Rooms Grid */}
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
            ) : rooms.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <MapPin className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No rooms found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedType !== "ALL"
                      ? "We couldn't find any rooms matching your criteria. Try adjusting your filters or search terms."
                      : "Start building your school facility by adding your first room to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => (
                  <Card
                    key={room.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {room.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {room.roomType}
                              </Badge>
                              <Badge
                                variant={room.isActive ? "default" : "secondary"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  room.isActive
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {room.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(room)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoom(room.id)}
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
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Capacity: {room.capacity}</span>
                        </div>
                        {room.code && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Code: {room.code}</span>
                          </div>
                        )}
                        {(room.floor || room.building) && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              {room.building && room.floor ? `${room.building}, ${room.floor}` : room.building || room.floor}
                            </span>
                          </div>
                        )}
                      </div>
                      {room.facilities && room.facilities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-medium">Facilities:</span> {room.facilities.join(', ')}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {room.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Room</DialogTitle>
                  <DialogDescription>Update room information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Room Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter room name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-code">Room Code</Label>
                      <Input
                        id="edit-code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., RM101"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-capacity">Capacity *</Label>
                      <Input
                        id="edit-capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-roomType">Room Type *</Label>
                      <Select
                        value={formData.roomType}
                        onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLASSROOM">Classroom</SelectItem>
                          <SelectItem value="LABORATORY">Laboratory</SelectItem>
                          <SelectItem value="LIBRARY">Library</SelectItem>
                          <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                          <SelectItem value="GYMNASIUM">Gymnasium</SelectItem>
                          <SelectItem value="OFFICE">Office</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-floor">Floor</Label>
                      <Input
                        id="edit-floor"
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        placeholder="Ground Floor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-building">Building</Label>
                      <Input
                        id="edit-building"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        placeholder="Main Building"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-facilities">Facilities</Label>
                    <Textarea
                      id="edit-facilities"
                      value={formData.facilities}
                      onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                      placeholder="Projector, Whiteboard, Computers (comma-separated)"
                      rows={2}
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingRoom(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRoom}>Update Room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}