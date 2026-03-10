"use client"

import * as React from "react"
import { Bell, MailOpen, CheckCircle, Send } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { type Notification, UserRole } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notificationStats, setNotificationStats] = React.useState<any>(null)
  const [notificationPreferences, setNotificationPreferences] = React.useState<any>(null)

  const isSchoolAdminOrSuperAdmin = user?.role === UserRole.SCHOOL_ADMIN || user?.role === UserRole.SUPER_ADMIN
  const isTeacher = user?.role === UserRole.TEACHER
  const isParent = user?.role === UserRole.PARENT

  React.useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const [notificationsRes, statsRes, preferencesRes] = await Promise.all([
          apiClient.getNotifications(),
          apiClient.getNotificationStats(),
          apiClient.getNotificationPreferences(),
        ])
        setNotifications(notificationsRes.notifications || [])
        setNotificationStats(statsRes.stats)
        setNotificationPreferences(preferencesRes.preferences)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load notifications or preferences.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [toast])

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif)),
      )
      setNotificationStats((prev: any) => ({ ...prev, unread: prev.unread - 1 }))
      toast({ title: "Success", description: "Notification marked as read." })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead()
      setNotifications((prev) =>
        prev.map((notif) => (notif.isRead ? notif : { ...notif, isRead: true, readAt: new Date().toISOString() })),
      )
      setNotificationStats((prev: any) => ({ ...prev, unread: 0 }))
      toast({ title: "Success", description: "All notifications marked as read." })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePreferences = async (key: string, value: boolean) => {
    try {
      const updatedPreferences = { ...notificationPreferences, [key]: value }
      await apiClient.updateNotificationPreferences(updatedPreferences)
      setNotificationPreferences(updatedPreferences)
      toast({ title: "Success", description: "Notification preferences updated." })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      })
    }
  }

  const handleSendNotification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const message = formData.get("message") as string
    const type = formData.get("type") as Notification["type"]
    const priority = formData.get("priority") as Notification["priority"]

    if (!title || !message || !type || !priority) {
      toast({
        title: "Validation Error",
        description: "All fields are required to send a notification.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await apiClient.createNotification({ title, message, type, priority })
      toast({ title: "Success", description: "Notification sent successfully." })
      e.currentTarget.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage your alerts and communication settings.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleMarkAllAsRead} disabled={loading || notificationStats?.unread === 0}>
            <MailOpen className="mr-2 h-4 w-4" /> Mark All as Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{notificationStats?.unread || 0}</div>
            <p className="text-xs text-muted-foreground">Notifications awaiting your attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Notifications</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {(notificationStats?.total || 0) - (notificationStats?.unread || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Notifications you've seen</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {(isSchoolAdminOrSuperAdmin || isTeacher) && <TabsTrigger value="send">Send Notification</TabsTrigger>}
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Notifications</CardTitle>
              <CardDescription>All your recent notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Received At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No notifications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={notification.isRead ? "text-muted-foreground" : "font-medium"}
                      >
                        <TableCell>
                          {notification.isRead ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Bell className="h-4 w-4 text-red-500 animate-pulse" />
                          )}
                        </TableCell>
                        <TableCell>{notification.title}</TableCell>
                        <TableCell>{notification.message}</TableCell>
                        <TableCell>{notification.type.replace(/_/g, " ")}</TableCell>
                        <TableCell>{notification.priority}</TableCell>
                        <TableCell>{format(parseISO(notification.createdAt), "PPP p")}</TableCell>
                        <TableCell className="text-right">
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                              Mark as Read
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize which types of notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="assignment-notifications">Assignment Notifications</Label>
                <Switch
                  id="assignment-notifications"
                  checked={notificationPreferences?.ASSIGNMENT || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("ASSIGNMENT", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="attendance-notifications">Attendance Notifications</Label>
                <Switch
                  id="attendance-notifications"
                  checked={notificationPreferences?.ATTENDANCE || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("ATTENDANCE", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="event-notifications">Event Notifications</Label>
                <Switch
                  id="event-notifications"
                  checked={notificationPreferences?.EVENT || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("EVENT", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="announcement-notifications">Announcement Notifications</Label>
                <Switch
                  id="announcement-notifications"
                  checked={notificationPreferences?.ANNOUNCEMENT || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("ANNOUNCEMENT", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="grade-notifications">Grade Notifications</Label>
                <Switch
                  id="grade-notifications"
                  checked={notificationPreferences?.GRADE || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("GRADE", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                <Switch
                  id="payment-notifications"
                  checked={notificationPreferences?.PAYMENT || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("PAYMENT", checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="general-notifications">General Notifications</Label>
                <Switch
                  id="general-notifications"
                  checked={notificationPreferences?.GENERAL || false}
                  onCheckedChange={(checked) => handleUpdatePreferences("GENERAL", checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {(isSchoolAdminOrSuperAdmin || isTeacher) && (
          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send New Notification</CardTitle>
                <CardDescription>Compose and send a notification to relevant users.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendNotification} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="notification-title">Title</Label>
                    <Input
                      id="notification-title"
                      name="title"
                      placeholder="e.g., School Holiday Announcement"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notification-message">Message</Label>
                    <Textarea
                      id="notification-message"
                      name="message"
                      placeholder="Enter your message here..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="notification-type">Type</Label>
                      <Select name="type" required>
                        <SelectTrigger id="notification-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {["ASSIGNMENT", "ATTENDANCE", "EVENT", "ANNOUNCEMENT", "GRADE", "PAYMENT", "GENERAL"].map(
                            (type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, " ")}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notification-priority">Priority</Label>
                      <Select name="priority" required>
                        <SelectTrigger id="notification-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {["LOW", "MEDIUM", "HIGH"].map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Send className="mr-2 h-4 w-4" /> Send Notification
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
