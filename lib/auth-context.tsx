"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "./api-client"

interface User {
  id: string
  email: string
  username?: string
  name: string
  surname: string
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT"
  phone?: string
  address?: string
  isActive: boolean
  profileImageUrl?: string
  lastLogin?: string
  createdAt: string
  schoolId?: string
  schoolName?: string
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED"
  isSuperAdmin: boolean
  isParent: boolean
  childrenSummary?: {
    totalChildren: number
    schoolsCount: number
    schools: Array<{
      school: { id: string; name: string }
      childrenCount: number
    }>
  }
  roleSpecificData?: any
}

// ---------------------------------------------------------------------------
//  User roles enum
// ---------------------------------------------------------------------------

/**
 * Enumerates all valid user-role strings used throughout the app.
 * Having a central enum prevents string-literal typos and lets us
 * use `UserRole.*` instead of bare string unions in the UI code.
 */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SCHOOL_ADMIN = "SCHOOL_ADMIN",
  PRINCIPAL = "PRINCIPAL",
  TEACHER = "TEACHER",
  PARENT = "PARENT",
}

// ---------------------------------------------------------------------------

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
  schoolType: "PRIMARY" | "SECONDARY" | "HIGH_SCHOOL" | "COLLEGE" | "UNIVERSITY" | "COMBINED"
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
interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: any) => Promise<void>
  updateUser: (userData: Partial<User>) => void
  currentSchool: string | null
  setCurrentSchool: (schoolId: string | null) => void
  availableSchools: School[]
  setAvailableSchools: (schools: School[]) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSchool, setCurrentSchool] = useState<string | null>(null)
  const [availableSchools, setAvailableSchools] = useState<School[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem("user")
    console.log('storedUser', storedUser)
    const storedAccessToken = localStorage.getItem("accessToken")
    const storedRefreshToken = localStorage.getItem("refreshToken")
    const storedCurrentSchool = localStorage.getItem("currentSchool")
    const storedAvailableSchools = localStorage.getItem("availableSchools")

    if (storedUser && storedAccessToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setAccessToken(storedAccessToken)
        setRefreshToken(storedRefreshToken)
        apiClient.setAccessToken(storedAccessToken) // Set token for apiClient

        if (storedCurrentSchool) {
          setCurrentSchool(storedCurrentSchool)
        }
        if (storedAvailableSchools) {
          setAvailableSchools(JSON.parse(storedAvailableSchools))
        }

        // Set default school for single-school users
        if (parsedUser.schoolId) {
          setCurrentSchool(parsedUser.schoolId)
          localStorage.setItem("currentSchool", parsedUser.schoolId)
        }
      } catch (error) {
        console.error("Error parsing stored auth data:", error)
        clearAuthData()
      }
    }
    setIsLoading(false)
  }, [])

  const clearAuthData = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    setCurrentSchool(null)
    setAvailableSchools([])
    apiClient.clearAccessToken() // Clear token from apiClient
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("currentSchool")
    localStorage.removeItem("availableSchools")
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      const { user: userData, accessToken: token, refreshToken: refresh } = response

      console.log("Login response userData:", userData)
      console.log("userData.schoolId:", userData.schoolId)

      setUser(userData)
      setAccessToken(token)
      setRefreshToken(refresh)
      apiClient.setAccessToken(token) // Set token for apiClient

      // Store auth data
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("accessToken", token)
      localStorage.setItem("refreshToken", refresh)

      // Handle school context for different roles according to documentation
      if (userData.role === "PARENT") {
        // For parents, fetch their schools using multi-tenant endpoint
        try {
          const schoolsResponse = await apiClient.getParentSchools()
          setAvailableSchools(schoolsResponse.schools || [])
          localStorage.setItem("availableSchools", JSON.stringify(schoolsResponse.schools || []))
          if (schoolsResponse.schools && schoolsResponse.schools.length > 0) {
            setCurrentSchool(schoolsResponse.schools[0].id)
            localStorage.setItem("currentSchool", schoolsResponse.schools[0].id)
            console.log("Set currentSchool for PARENT:", schoolsResponse.schools[0].id)
          }
        } catch (error) {
          console.error("Error fetching parent schools:", error)
        }
      } else if (userData.schoolId) {
        // For other roles with a specific school
        const school = {
          id: userData.schoolId,
          name: userData.schoolName || "School",
          // Add minimal required fields for School interface
          address: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          phone: "",
          email: "",
          schoolType: "PRIMARY" as const,
          isVerified: false,
          tenantId: "",
          createdAt: ""
        }
        setCurrentSchool(userData.schoolId)
        setAvailableSchools([school])
        localStorage.setItem("currentSchool", userData.schoolId)
        localStorage.setItem("availableSchools", JSON.stringify([school]))
        console.log("Set currentSchool for role with schoolId:", userData.schoolId)
      } else if (userData.role === "SUPER_ADMIN") {
        // For super admin, fetch all schools
        try {
          const schoolsResponse = await apiClient.getSchools()
          setAvailableSchools(schoolsResponse.schools || [])
          localStorage.setItem("availableSchools", JSON.stringify(schoolsResponse.schools || []))
          console.log("Fetched schools for SUPER_ADMIN")
        } catch (error) {
          console.error("Error fetching schools for super admin:", error)
        }
      }
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (refreshToken) {
        await apiClient.logout(refreshToken)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearAuthData()
      router.push("/")
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await apiClient.register(userData)
      const { user: newUser, accessToken: token, refreshToken: refresh } = response

      setUser(newUser)
      setAccessToken(token)
      setRefreshToken(refresh)
      apiClient.setAccessToken(token)

      // Store auth data
      localStorage.setItem("user", JSON.stringify(newUser))
      localStorage.setItem("accessToken", token)
      localStorage.setItem("refreshToken", refresh)

      router.push("/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const handleCurrentSchoolChange = (schoolId: string | null) => {
    setCurrentSchool(schoolId)
    if (schoolId) {
      localStorage.setItem("currentSchool", schoolId)
    } else {
      localStorage.removeItem("currentSchool")
    }
  }

  const handleAvailableSchoolsChange = (schools: School[]) => {
    setAvailableSchools(schools)
    localStorage.setItem("availableSchools", JSON.stringify(schools))
  }

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    currentSchool,
    setCurrentSchool: handleCurrentSchoolChange,
    availableSchools,
    setAvailableSchools: handleAvailableSchoolsChange,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}