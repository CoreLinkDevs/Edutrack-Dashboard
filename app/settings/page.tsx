"use client"

import * as React from "react"
import { type User, type School, UserRole } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/ui/file-upload"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [currentUserData, setCurrentUserData] = React.useState<Partial<User> | null>(null)
  const [currentSchoolData, setCurrentSchoolData] = React.useState<Partial<School> | null>(null)

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN
  const isSchoolAdmin = user?.role === UserRole.SCHOOL_ADMIN

  React.useEffect(() => {
    if (user) {
      setCurrentUserData(user)
      if (user.schoolId && (isSchoolAdmin || isSuperAdmin)) {
        const fetchSchoolData = async () => {
          try {
            const response = await apiClient.getSchool(user.schoolId)
            setCurrentSchoolData(response.school || null)
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to load school data.",
              variant: "destructive",
            })
          }
        }
        fetchSchoolData()
      }
    }
    setLoading(false)
  }, [user, toast, isSchoolAdmin, isSuperAdmin])

  const handleUserUpdate = async () => {
    if (!currentUserData?.id) return

    setLoading(true)
    try {
      const updatedUser = await apiClient.updateUser(currentUserData.id, {
        name: currentUserData.name,
        surname: currentUserData.surname,
        email: currentUserData.email,
        phone: currentUserData.phone,
        address: currentUserData.address,
        profileImageUrl: currentUserData.profileImageUrl,
      })
      setUser(updatedUser.data) // Update user context
      toast({ title: "Success", description: "Profile updated successfully." })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolUpdate = async () => {
    if (!currentSchoolData?.id) return

    setLoading(true)
    try {
      await apiClient.updateSchool(currentSchoolData.id, {
        name: currentSchoolData.name,
        address: currentSchoolData.address,
        city: currentSchoolData.city,
        state: currentSchoolData.state,
        country: currentSchoolData.country,
        postalCode: currentSchoolData.postalCode,
        phone: currentSchoolData.phone,
        email: currentSchoolData.email,
        website: currentSchoolData.website,
        schoolType: currentSchoolData.schoolType,
        isVerified: currentSchoolData.isVerified,
        logoUrl: currentSchoolData.logoUrl,
        establishedYear: currentSchoolData.establishedYear,
        description: currentSchoolData.description,
        facilities: currentSchoolData.facilities,
        accreditation: currentSchoolData.accreditation,
      })
      toast({ title: "Success", description: "School settings updated successfully." })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update school settings: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageUpload = (urls: string[]) => {
    setCurrentUserData((prev) => ({ ...prev, profileImageUrl: urls[0] || undefined }))
  }

  const handleSchoolLogoUpload = (urls: string[]) => {
    setCurrentSchoolData((prev) => ({ ...prev, logoUrl: urls[0] || undefined }))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">Manage your account and school settings.</p>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {(isSchoolAdmin || isSuperAdmin) && <TabsTrigger value="school">School Settings</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="system">System Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={currentUserData?.profileImageUrl || "/placeholder.svg"}
                    alt={`${currentUserData?.name} ${currentUserData?.surname}`}
                  />
                  <AvatarFallback>
                    {currentUserData?.name?.[0]}
                    {currentUserData?.surname?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <Label htmlFor="profile-image-upload">Profile Image</Label>
                  <FileUpload
                    onUploadComplete={handleProfileImageUpload}
                    existingFiles={currentUserData?.profileImageUrl ? [currentUserData.profileImageUrl] : []}
                    endpoint="profileImage"
                    maxFiles={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    value={currentUserData?.name || ""}
                    onChange={(e) => setCurrentUserData({ ...currentUserData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name</Label>
                  <Input
                    id="surname"
                    value={currentUserData?.surname || ""}
                    onChange={(e) => setCurrentUserData({ ...currentUserData, surname: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUserData?.email || ""}
                  onChange={(e) => setCurrentUserData({ ...currentUserData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={currentUserData?.phone || ""}
                  onChange={(e) => setCurrentUserData({ ...currentUserData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={currentUserData?.address || ""}
                  onChange={(e) => setCurrentUserData({ ...currentUserData, address: e.target.value })}
                />
              </div>
              <Button onClick={handleUserUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {(isSchoolAdmin || isSuperAdmin) && (
          <TabsContent value="school" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Manage your school's general information and branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 rounded-none">
                    <AvatarImage
                      src={currentSchoolData?.logoUrl || "/placeholder.svg"}
                      alt={`${currentSchoolData?.name} logo`}
                    />
                    <AvatarFallback className="rounded-none">{currentSchoolData?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <Label htmlFor="school-logo-upload">School Logo</Label>
                    <FileUpload
                      onUploadComplete={handleSchoolLogoUpload}
                      existingFiles={currentSchoolData?.logoUrl ? [currentSchoolData.logoUrl] : []}
                      endpoint="schoolLogo"
                      maxFiles={1}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    value={currentSchoolData?.name || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-email">School Email</Label>
                  <Input
                    id="school-email"
                    type="email"
                    value={currentSchoolData?.email || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-phone">School Phone</Label>
                  <Input
                    id="school-phone"
                    type="tel"
                    value={currentSchoolData?.phone || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-website">Website</Label>
                  <Input
                    id="school-website"
                    type="url"
                    value={currentSchoolData?.website || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-address">Address</Label>
                  <Textarea
                    id="school-address"
                    value={currentSchoolData?.address || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-city">City</Label>
                    <Input
                      id="school-city"
                      value={currentSchoolData?.city || ""}
                      onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-state">State</Label>
                    <Input
                      id="school-state"
                      value={currentSchoolData?.state || ""}
                      onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-country">Country</Label>
                    <Input
                      id="school-country"
                      value={currentSchoolData?.country || ""}
                      onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-postalCode">Postal Code</Label>
                    <Input
                      id="school-postalCode"
                      value={currentSchoolData?.postalCode || ""}
                      onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, postalCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-type">School Type</Label>
                  <Select
                    value={currentSchoolData?.schoolType || ""}
                    onValueChange={(value) =>
                      setCurrentSchoolData({ ...currentSchoolData, schoolType: value as School["schoolType"] })
                    }
                  >
                    <SelectTrigger id="school-type">
                      <SelectValue placeholder="Select school type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["PRIMARY", "SECONDARY", "HIGH_SCHOOL", "COLLEGE", "UNIVERSITY", "COMBINED"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={currentSchoolData?.establishedYear || ""}
                    onChange={(e) =>
                      setCurrentSchoolData({ ...currentSchoolData, establishedYear: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentSchoolData?.description || ""}
                    onChange={(e) => setCurrentSchoolData({ ...currentSchoolData, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleSchoolUpdate} disabled={loading}>
                  {loading ? "Saving..." : "Save School Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global system parameters (Super Admin only).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-new-registrations">Allow New School Registrations</Label>
                  <Switch
                    id="allow-new-registrations"
                    checked={true} // Mock value
                    onCheckedChange={() => toast({ title: "Info", description: "This is a mock setting." })}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-multi-tenancy">Enable Multi-Tenancy</Label>
                  <Switch
                    id="enable-multi-tenancy"
                    checked={true} // Mock value
                    onCheckedChange={() => toast({ title: "Info", description: "This is a mock setting." })}
                    disabled={loading}
                  />
                </div>
                <Button
                  disabled={loading}
                  onClick={() => toast({ title: "Info", description: "System settings saved (mock)." })}
                >
                  {loading ? "Saving..." : "Save System Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
