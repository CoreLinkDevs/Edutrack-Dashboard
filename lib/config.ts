export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      REFRESH: "/api/auth/refresh-token",
      LOGOUT: "/api/auth/logout",
      REQUEST_PASSWORD_RESET: "/api/auth/request-password-reset",
      RESET_PASSWORD: "/api/auth/reset-password",
    },
    USERS: "/api/users",
    SCHOOLS: "/api/schools",
    STUDENTS: "/api/students",
    TEACHERS: "/api/teachers",
    PARENTS: "/api/parents",
    CLASSES: "/api/classes",
    SUBJECTS: "/api/subjects",
    CURRICULUM: "/api/curriculum",
    ASSIGNMENTS: "/api/assignments",
    EVENTS: "/api/events",
    NOTIFICATIONS: "/api/notifications",
    ATTENDANCE: "/api/attendance",
    ANALYTICS: "/api/analytics",
    GRADES: "/api/grades",
    DASHBOARD: "/api/dashboard",
    MULTI_TENANT: "/api/multi-tenant",
  },
} as const

export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT"

export type SchoolType = "PRIMARY" | "SECONDARY" | "HIGH_SCHOOL" | "COLLEGE" | "UNIVERSITY" | "COMBINED"

export type EventType = "ACADEMIC" | "SPORTS" | "CULTURAL" | "GENERAL"

export type NotificationType = "ASSIGNMENT" | "ATTENDANCE" | "EVENT" | "GENERAL"

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH"

export type AssignmentType = "INDIVIDUAL" | "GROUP"

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED"

export type Gender = "MALE" | "FEMALE" | "OTHER"

export type RSVPResponse = "ATTENDING" | "NOT_ATTENDING" | "MAYBE"
