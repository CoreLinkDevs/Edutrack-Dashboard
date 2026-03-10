"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"

interface DashboardData {
  overview?: any
  recentActivity?: any[]
  attendance?: any
  academic?: any
  financial?: any
  children?: any[]
  assignments?: any
  events?: any[]
  notifications?: any
  systemHealth?: any
  userManagement?: any
  systemUsage?: any
  alerts?: any[]
  upcomingEvents?: any[]
  todaySchedule?: any[]
  recentSubmissions?: any[]
  upcomingDeadlines?: any[]
  payments?: any
  [key: string]: any
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, accessToken } = useAuth()

  useEffect(() => {
    if (!user || !accessToken) {
      setIsLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Set the access token for the API client
        apiClient.setAccessToken(accessToken)

        // Use the API client's getDashboardData method
        const result = await apiClient.getDashboardData(user.role)
        setData(result.dashboard || result)
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching dashboard data")
        console.error("Dashboard data fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, accessToken])

  return { data, isLoading, error }
}
