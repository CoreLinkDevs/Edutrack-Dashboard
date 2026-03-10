"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building,
  BookOpen,
  FileText,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
  ClipboardList,
  Home,
  ChevronDown,
  User,
  MapPin,
  CreditCard,
  Crown,
  Clock,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: any
  roles: string[]
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

interface School {
  id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  phone: string
  email: string
  website?: string
  schoolType: string
  isVerified: boolean
  logoUrl?: string
  tenantId: string
  establishedYear?: number
  description?: string
  facilities?: string[]
  accreditation?: string
  createdAt: string
  principal?: {
    id: string
    user: {
      name: string
      email: string
    }
  }
  _count?: {
    students: number
    teachers: number
    classes: number
    grades: number
    parents: number
  }
}

const navigationGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Schools",
        href: "/schools",
        icon: Building,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Grades",
        href: "/grades",
        icon: School,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Classes",
        href: "/classes",
        icon: School,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Subjects",
        href: "/subjects",
        icon: BookOpen,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Rooms",
        href: "/rooms",
        icon: MapPin,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        title: "Students",
        href: "/students",
        icon: GraduationCap,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
      {
        title: "Teachers",
        href: "/teachers",
        icon: UserCheck,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"],
      },
      {
        title: "Principals",
        href: "/principals",
        icon: User,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Parents",
        href: "/parents",
        icon: Users,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
    ],
  },
  {
    title: "Academic",
    items: [
      {
        title: "Curriculum",
        href: "/curriculum",
        icon: BookOpen,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Exams",
        href: "/exams",
        icon: FileText,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Report Cards",
        href: "/report-cards",
        icon: FileText,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Assignments",
        href: "/assignments",
        icon: FileText,
        roles: ["TEACHER", "PARENT"],
      },
      {
        title: "Timetables",
        href: "/timetables",
        icon: Clock,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        title: "Academic Calendar",
        href: "/academic-calendar",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        title: "Events",
        href: "/events",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "School Payments",
        href: "/school-payments",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN"],
      },
      {
        title: "Parent Subscriptions",
        href: "/parent-subscriptions",
        icon: Crown,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "SCHOOL_ADMIN"],
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "PRINCIPAL"],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "PRINCIPAL", "TEACHER", "PARENT"],
      },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout, currentSchool, availableSchools, setCurrentSchool } = useAuth()

  if (!user) return null

  // Filter navigation groups and their items based on user role
  const filteredNavGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSchoolChange = (schoolId: string) => {
    setCurrentSchool(schoolId)
  }

  // Find the current school object from availableSchools
  const currentSchoolObject: School | undefined = availableSchools.find((school) => school.id === currentSchool)

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">EduTrack</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-1">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* School Context Selector - Only show for super admin */}
      {!collapsed && user.isSuperAdmin && availableSchools.length > 1 && (
        <div className="p-4 border-b border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={currentSchoolObject?.logoUrl || "/placeholder.svg"} />
                    <AvatarFallback>
                      <Building className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{currentSchoolObject?.name || "Select School"}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Switch School</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableSchools.map((school) => (
                <DropdownMenuItem
                  key={school.id}
                  onClick={() => handleSchoolChange(school.id)}
                  className={currentSchool === school.id ? "bg-blue-50" : ""}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={school.logoUrl || "/placeholder.svg"} />
                      <AvatarFallback>
                        <Building className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{school.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.profileImageUrl || "/placeholder.svg"} />
              <AvatarFallback>
                {user.name?.[0]}
                {user.surname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name} {user.surname}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {user.role.replace("_", " ")}
                </Badge>
                {currentSchoolObject && !user.isSuperAdmin && (
                  <Badge variant="outline" className="text-xs">
                    {currentSchoolObject.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {filteredNavGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="ml-3">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${
            collapsed ? "px-2" : ""
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
