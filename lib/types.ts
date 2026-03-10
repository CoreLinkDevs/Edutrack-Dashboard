export interface User {
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

export interface School {
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

export interface Student {
  id: string
  name: string
  surname: string
  email?: string
  registrationNumber: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER"
  address: string
  phone?: string
  emergencyContact: string
  medicalInfo?: string
  profileImageUrl?: string
  isActive: boolean
  enrollmentDate: string
  graduationDate?: string
  classId?: string
  parentId?: string
  class?: {
    id: string
    name: string
    grade?: {
      id: string
      name: string
      level: number
    }
    supervisor?: {
      user: {
        name: string
        email: string
      }
    }
  }
  grade?: {
    id: string
    name: string
    level: number
  }
  parent?: {
    id: string
    user: {
      name: string
      surname: string
      email: string
      phone: string
    }
  }
  school: {
    id: string
    name: string
  }
  _count?: {
    assignments: number
    attendanceRecords: number
    results: number
  }
}

export interface Teacher {
  id: string
  qualifications: string
  bio: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
  hireDate: string
  employeeId?: string
  department?: string
  specialization?: string
  user: {
    id: string
    name: string
    surname: string
    email: string
    phone?: string
    profileImageUrl?: string
    isActive: boolean
    createdAt: string
  }
  school: {
    id: string
    name: string
  }
  subjects?: Array<{
    id: string
    name: string
    code: string
    grade?: {
      name: string
      level: number
    }
  }>
  classes?: Array<{
    id: string
    name: string
    capacity: number
    _count?: {
      students: number
    }
  }>
  approval?: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    approvedAt?: string
    approvedBy?: {
      user: {
        name: string
      }
    }
  }
  _count?: {
    subjects: number
    classes: number
    assignments: number
    lessons: number
    students: number
  }
}

export interface Parent {
  id: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  occupation?: string
  workAddress?: string
  emergencyContact?: string
  user: {
    id: string
    name: string
    surname: string
    email: string
    phone?: string
    address?: string
    isActive: boolean
  }
  children?: Array<{
    id: string
    name: string
    surname: string
    registrationNumber: string
    class?: {
      name: string
    }
    school: {
      id: string
      name: string
    }
  }>
  _count?: {
    children: number
  }
}

export interface Class {
  id: string
  name: string
  description?: string
  capacity: number
  academicYear: string
  isActive: boolean
  classCode?: string
  room?: string
  schedule?: string
  grade: {
    id: string
    name: string
    level: number
    description?: string
  }
  supervisor?: {
    id: string
    user: {
      name: string
      surname: string
      email: string
    }
  }
  school: {
    id: string
    name: string
  }
  students?: Array<{
    id: string
    name: string
    surname: string
    registrationNumber: string
  }>
  _count?: {
    students: number
    lessons: number
    assignments: number
  }
}

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  credits: number
  isActive: boolean
  syllabus?: string
  prerequisites?: string
  grade: {
    id: string
    name: string
    level: number
  }
  school: {
    id: string
    name: string
  }
  teachers?: Array<{
    id: string
    user: {
      name: string
      surname: string
      email: string
    }
    qualifications?: string
  }>
  _count?: {
    teachers: number
    assignments: number
    lessons: number
    examQuestions: number
  }
}

export interface Grade {
  id: string
  name: string
  level: number
  description?: string
  isActive: boolean
  ageRange?: string
  curriculum?: string
  school: {
    id: string
    name: string
  }
  classes?: Array<{
    id: string
    name: string
    capacity: number
    _count?: {
      students: number
    }
  }>
  subjects?: Array<{
    id: string
    name: string
    code: string
    credits: number
  }>
  _count?: {
    classes: number
    subjects: number
    students: number
  }
}

export interface Assignment {
  id: string
  title: string
  description: string
  instructions?: string
  startDate: string
  dueDate: string
  maxScore: number
  assignmentType: "INDIVIDUAL" | "GROUP"
  documentUrls?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  subject: {
    id: string
    name: string
    code: string
  }
  class: {
    id: string
    name: string
  }
  teacher: {
    id: string
    user: {
      name: string
      surname: string
      email: string
    }
  }
  school: {
    id: string
    name: string
  }
  approval?: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    approvedAt?: string
  }
  submissions?: Array<{
    id: string
    studentId: string
    submittedAt: string
    comments?: string
    submissionUrls: string[]
    student: {
      id: string
      name: string
      surname: string
    }
    result?: any
  }>
  _count?: {
    submissions: number
  }
}

export interface Event {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  eventType: "ACADEMIC" | "SPORTS" | "CULTURAL" | "MEETING" | "HOLIDAY" | "EXAM" | "GENERAL"
  rsvpRequired: boolean
  maxAttendees?: number
  imageUrls?: string[]
  isActive: boolean
  registrationDeadline?: string
  contactEmail?: string
  contactPhone?: string
  requirements?: string
  school: {
    id: string
    name: string
  }
  createdBy: {
    user: {
      name: string
      email: string
    }
  }
  _count?: {
    rsvps: number
  }
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "ASSIGNMENT" | "ATTENDANCE" | "EVENT" | "ANNOUNCEMENT" | "GRADE" | "PAYMENT" | "GENERAL"
  priority: "LOW" | "MEDIUM" | "HIGH"
  isRead: boolean
  createdAt: string
  readAt?: string
  metadata?: Record<string, any>
}

export interface AttendanceRecord {
  id: string
  studentId: string
  lessonId?: string
  date: string
  present: boolean
  note?: string
  recordedById: string
  createdAt: string
  lesson?: {
    id: string
    subject: {
      name: string
      code: string
    }
    class: {
      name: string
    }
    startTime: string
    endTime: string
  }
  recordedBy?: {
    user: {
      name: string
      surname: string
    }
  }
}

export interface DashboardData {
  overview?: {
    totalStudents?: number
    totalTeachers?: number
    totalParents?: number
    totalClasses?: number
    totalSchools?: number
    verifiedSchools?: number
    pendingSchools?: number
    totalUsers?: number
    activeUsers?: number
    pendingApprovals?: number
    activeAssignments?: number
    upcomingEvents?: number
    recentEvents?: number
    unassignedStudents?: number
    dailyAttendanceRate?: number
    pendingTeacherApprovals?: number
    pendingParentLinkRequests?: number
  }
  recentActivity?: Array<{
    type: string
    message: string
    timestamp: string
    schoolId?: string
    userId?: string
    studentId?: string
    studentName?: string
    actionRequired?: boolean
  }>
  attendance?: {
    todayAttendanceRate?: number
    absentToday?: number
    lateArrivals?: number
    totalRecords?: number
    presentCount?: number
    absentCount?: number
    attendanceRate?: number
    totalDays?: number
    presentDays?: number
    todayPresent?: number
    todayAbsent?: number
    weeklyAverage?: number
  }
  academic?: {
    averageGrade?: number
    assignmentsSubmitted?: number
    upcomingExams?: number
    gradingPending?: number
    gradeDistribution?: Array<{
      grade: string
      count: number
    }>
  }
  financial?: {
    totalRevenue?: number
    completedPayments?: number
    pendingPayments?: number
    monthlyRevenue?: Array<{
      month: string
      revenue: number
      payment_count: number
    }>
    monthlyGrowth?: number
    activeSubscriptions?: number
    paymentRate?: number
  }
  children?: Array<{
    id: string
    name: string
    school: string
    class: string
    attendanceRate: number
    averageGrade: number
    pendingAssignments: number
    upcomingEvents: number
    recentGrades?: Array<{
      subject: string
      grade: string
      percentage: number
      date: string
    }>
  }>
  assignments?: {
    active?: number
    dueThisWeek?: number
    pendingGrading?: number
    averageSubmissionRate?: number
  }
  events?: Event[]
  notifications?: {
    unread?: number
    total?: number
    recent?: Array<{
      title: string
      message: string
      type: string
    }>
  }
  systemHealth?: {
    uptime?: string
    responseTime?: string
    errorRate?: string
    activeConnections?: number
  }
  userManagement?: {
    pendingTeachers?: number
    pendingParents?: number
    inactiveUsers?: number
    recentRegistrations?: number
  }
  systemUsage?: {
    dailyActiveUsers?: number
    weeklyActiveUsers?: number
    monthlyActiveUsers?: number
    storageUsed?: string
    storageLimit?: string
  }
  alerts?: Array<{
    type: string
    message: string
    priority: "LOW" | "MEDIUM" | "HIGH"
    actionRequired: boolean
  }>
  upcomingEvents?: Array<{
    id: string
    title: string
    date: string
    rsvpCount?: number
    school?: string
    studentName?: string
  }>
  todaySchedule?: Array<{
    id: string
    subject: string
    class: string
    startTime: string
    endTime: string
    room: string
    topic?: string
  }>
  recentSubmissions?: Array<{
    id: string
    student: string
    assignment: string
    submittedAt: string
    class: string
  }>
  upcomingDeadlines?: Array<{
    type: string
    title: string
    dueDate: string
    class?: string
  }>
  payments?: {
    pending?: number
    completed?: number
    totalAmount?: number
    nextDue?: string
  }
  schoolsByType?: Record<string, number>
  usersByRole?: Record<string, number>
  [key: string]: any
}

export interface AnalyticsData {
  overview?: any
  financial?: any
  attendance?: any
  academic?: any
  insights?: any
  communication?: any
  events?: any
  appUsage?: any
  summary?: any
  trends?: any
  [key: string]: any
}

export interface ApiResponse<T> {
  message: string
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  errors?: Array<{
    field: string
    message: string
  }>
  code?: string
  timestamp?: string
}

export interface FileUploadResponse {
  message: string
  files?: Array<{
    fileName: string
    originalName: string
    fileSize: number
    mimeType: string
    fileUrl: string
    uploadedAt: string
  }>
  documentUrls?: string[]
  logoUrl?: string
  school?: School
  assignment?: Assignment
  event?: Event
}
