"use client"

import { Bell, Search, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout, currentSchool } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex items-center space-x-4">
          {/* School Logo */}
          {currentSchool?.logoUrl && (
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentSchool.logoUrl || "/placeholder.svg"} alt={currentSchool.name} />
              <AvatarFallback>{currentSchool.name?.[0]}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            {currentSchool && !user?.isSuperAdmin && <p className="text-xs text-blue-600 mt-1">{currentSchool.name}</p>}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search..." className="pl-10 w-64" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profileImageUrl || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user?.name?.[0]}
                    {user?.surname?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">
                  {user?.name} {user?.surname}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.name} {user?.surname}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {user?.role.replace("_", " ")}
                    </Badge>
                    {currentSchool && !user?.isSuperAdmin && (
                      <Badge variant="outline" className="text-xs">
                        {currentSchool.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
