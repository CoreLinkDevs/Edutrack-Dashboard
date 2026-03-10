"use client"

import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getRoleDisplayName = (role: string) => {
    return role
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={`${getRoleDisplayName(user.role)} Dashboard`}
          subtitle={`Welcome back, ${user.name}! Here's what's happening today.`}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}
