import { API_CONFIG } from "./config"
import type {
  ApiResponse,
  User,
  School,
  Student,
  Teacher,
  Parent,
  Class,
  Subject,
  Assignment,
  Event,
  Notification,
  AttendanceRecord,
  Grade,
  DashboardData,
  FileUploadResponse,
  AnalyticsData,
} from "./types"

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  clearAccessToken() {
    this.accessToken = null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    }

    // Only set Content-Type to application/json if not already set (for FormData)
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    // Log the outgoing request
    console.group(`🚀 API Request: ${options.method || "GET"} ${endpoint}`)
    console.log("📍 Full URL:", url)
    console.log("📋 Headers:", headers)
    if (options.body) {
      console.log("📦 Request Body:", options.body)
    }
    console.log("⚙️ Options:", options)
    console.groupEnd()

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Log the response
      console.group(`📥 API Response: ${options.method || "GET"} ${endpoint}`)
      console.log("📊 Status:", response.status, response.statusText)
      console.log("✅ OK:", response.ok)
      console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()))
      console.groupEnd()

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.group(`❌ API Error: ${options.method || "GET"} ${endpoint}`)
        console.log("📊 Status:", response.status, response.statusText)
        console.log("💥 Error Data:", errorData)
        console.groupEnd()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      // Log successful response data
      console.group(`✅ API Success: ${options.method || "GET"} ${endpoint}`)
      console.log("📦 Response Data:", responseData)
      console.groupEnd()

      return responseData
    } catch (error) {
      console.group(`💥 API Request Failed: ${options.method || "GET"} ${endpoint}`)
      console.error("🔥 Error:", error)
      console.log("📍 URL:", url)
      console.log("📋 Headers:", headers)
      if (options.body) {
        console.log("📦 Request Body:", options.body)
      }
      console.groupEnd()
      throw error
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Call the Next.js route directly to modify the response
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async register(userData: any): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    // Logout doesn't need authorization header since it uses refresh token
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      // Always return success for logout since we clear local auth data anyway
      try {
        const data = await response.json()
        return data
      } catch {
        return { message: "Logged out successfully" }
      }
    } catch (error) {
      console.error("Logout request failed:", error)
      // Return success anyway since we're clearing local auth data
      return { message: "Logged out successfully" }
    }
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    })
  }

  // Dashboard methods
  async getDashboardData(role: string): Promise<{ dashboard: DashboardData }> {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "super-admin",
      SCHOOL_ADMIN: "school-admin",
      PRINCIPAL: "principal",
      TEACHER: "teacher",
      PARENT: "parent",
    }
    const endpoint = `${API_CONFIG.ENDPOINTS.DASHBOARD}/${roleMap[role] || role.toLowerCase()}`
    return this.request(endpoint)
  }

  // User Management
  async getUsers(params?: Record<string, any>): Promise<ApiResponse<User[]> & { users: User[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.USERS}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.USERS
    return this.request(url)
  }

  async getUserById(id: string): Promise<{ user: User }> {
    return this.request(`${API_CONFIG.ENDPOINTS.USERS}/${id}`)
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    return this.request(`${API_CONFIG.ENDPOINTS.USERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.USERS}/${id}`, {
      method: "DELETE",
    })
  }

  // School Management
  async getSchools(params?: Record<string, any>): Promise<ApiResponse<School[]> & { schools: School[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.SCHOOLS}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.SCHOOLS
    return this.request(url)
  }

  async getSchoolById(id: string): Promise<{ school: School }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SCHOOLS}/${id}`)
  }

  async createSchool(data: Partial<School> | FormData): Promise<{ school: School; adminCredentials?: any }> {
    if (data instanceof FormData) {
      // Handle FormData for school creation with logo upload
      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SCHOOLS}`

      const headers: Record<string, string> = {}
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`
      } else {
        throw new Error("No access token available. Please log in.")
      }

      // Log the FormData request
      console.group(`📤 School Creation with Logo: POST /api/schools`)
      console.log("📍 Full URL:", url)
      console.log("📋 Headers:", headers)
      console.log(
        "📁 FormData entries:",
        Array.from(data.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
        }))
      )
      console.groupEnd()

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: data,
      })

      // Log the response
      console.group(`📥 School Creation Response: POST /api/schools`)
      console.log("📊 Status:", response.status, response.statusText)
      console.log("✅ OK:", response.ok)
      console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()))
      console.groupEnd()

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.group(`❌ School Creation Error: POST /api/schools`)
        console.log("📊 Status:", response.status, response.statusText)
        console.log("💥 Error Data:", errorData)
        console.groupEnd()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      console.group(`✅ School Creation Success: POST /api/schools`)
      console.log("📦 Response Data:", responseData)
      console.groupEnd()

      return responseData
    } else {
      // Handle regular JSON data
      return this.request(API_CONFIG.ENDPOINTS.SCHOOLS, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  }

  async updateSchool(id: string, data: Partial<School>): Promise<{ school: School }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SCHOOLS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteSchool(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SCHOOLS}/${id}`, {
      method: "DELETE",
    })
  }

  // School Logo Upload
  async uploadSchoolLogo(schoolId: string, logoFile: File): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append("logo", logoFile)

    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SCHOOLS}/${schoolId}/logo`

    const headers: Record<string, string> = {}
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    } else {
      throw new Error("No access token available. Please log in.")
    }

    // Log the file upload request
    console.group(`📤 File Upload: POST /schools/${schoolId}/logo`)
    console.log("📍 Full URL:", url)
    console.log("📋 Headers:", headers)
    console.log("📁 File:", {
      name: logoFile.name,
      size: logoFile.size,
      type: logoFile.type,
    })
    console.groupEnd()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    })

    // Log the upload response
    console.group(`📥 Upload Response: POST /schools/${schoolId}/logo`)
    console.log("📊 Status:", response.status, response.statusText)
    console.log("✅ OK:", response.ok)
    console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()))
    console.groupEnd()

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.group(`❌ Upload Error: POST /schools/${schoolId}/logo`)
      console.log("📊 Status:", response.status, response.statusText)
      console.log("💥 Error Data:", errorData)
      console.groupEnd()
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const responseData = await response.json()

    console.group(`✅ Upload Success: POST /schools/${schoolId}/logo`)
    console.log("📦 Response Data:", responseData)
    console.groupEnd()

    return responseData
  }

  // Student Management
  async getStudents(params?: Record<string, any>): Promise<ApiResponse<Student[]> & { students: Student[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.STUDENTS}?${new URLSearchParams(params)}`
      : API_CONFIG.ENDPOINTS.STUDENTS
    return this.request(url)
  }

  async getStudentById(id: string): Promise<{ student: Student }> {
    return this.request(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`)
  }

  async createStudent(data: Partial<Student>): Promise<{ student: Student }> {
    return this.request(API_CONFIG.ENDPOINTS.STUDENTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<{ student: Student }> {
    return this.request(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteStudent(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`, {
      method: "DELETE",
    })
  }

  // Teacher Management
  async getTeachers(params?: Record<string, any>): Promise<ApiResponse<Teacher[]> & { teachers: Teacher[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.TEACHERS}?${new URLSearchParams(params)}`
      : API_CONFIG.ENDPOINTS.TEACHERS
    return this.request(url)
  }

  async getTeacherById(id: string): Promise<{ teacher: Teacher }> {
    return this.request(`${API_CONFIG.ENDPOINTS.TEACHERS}/${id}`)
  }

  async createTeacher(data: Partial<Teacher> | FormData): Promise<{ teacher: Teacher; generatedCredentials?: any }> {
    if (data instanceof FormData) {
      // Handle FormData for teacher creation with profile image upload
      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.TEACHERS}`

      const headers: Record<string, string> = {}
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`
      } else {
        // Don't add Authorization header if token is null - throw error
        throw new Error("No access token available. Please log in.")
      }

      // Log the FormData request
      console.group(`📤 Teacher Creation with Profile Image: POST /api/teachers`)
      console.log("📍 Full URL:", url)
      console.log("📋 Headers:", headers)
      console.log(
        "📁 FormData entries:",
        Array.from(data.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
        }))
      )
      console.groupEnd()

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: data,
      })

      // Log the response
      console.group(`📥 Teacher Creation Response: POST /api/teachers`)
      console.log("📊 Status:", response.status, response.statusText)
      console.log("✅ OK:", response.ok)
      console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()))
      console.groupEnd()

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.group(`❌ Teacher Creation Error: POST /api/teachers`)
        console.log("📊 Status:", response.status, response.statusText)
        console.log("💥 Error Data:", errorData)
        console.groupEnd()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      console.group(`✅ Teacher Creation Success: POST /api/teachers`)
      console.log("📦 Response Data:", responseData)
      console.groupEnd()

      return responseData
    } else {
      // Handle regular JSON data
      return this.request(API_CONFIG.ENDPOINTS.TEACHERS, {
        method: "POST",
        body: JSON.stringify(data),
      })
    }
  }

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<{ teacher: Teacher }> {
    return this.request(`${API_CONFIG.ENDPOINTS.TEACHERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteTeacher(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.TEACHERS}/${id}`, {
      method: "DELETE",
    })
  }

  // Parent Management
  async getParents(params?: Record<string, any>): Promise<ApiResponse<Parent[]> & { parents: Parent[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.PARENTS}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.PARENTS
    return this.request(url)
  }

  async getParentById(id: string): Promise<{ parent: Parent }> {
    return this.request(`${API_CONFIG.ENDPOINTS.PARENTS}/${id}`)
  }

  async createParent(data: Partial<Parent>): Promise<{ parent: Parent }> {
    return this.request(API_CONFIG.ENDPOINTS.PARENTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateParent(id: string, data: Partial<Parent>): Promise<{ parent: Parent }> {
    return this.request(`${API_CONFIG.ENDPOINTS.PARENTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteParent(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.PARENTS}/${id}`, {
      method: "DELETE",
    })
  }

  // Class Management
  async getClasses(params?: Record<string, any>): Promise<ApiResponse<Class[]> & { classes: Class[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.CLASSES}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.CLASSES
    return this.request(url)
  }

  async getClassById(id: string): Promise<{ class: Class }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLASSES}/${id}`)
  }

  async createClass(data: Partial<Class>): Promise<{ class: Class }> {
    return this.request(API_CONFIG.ENDPOINTS.CLASSES, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateClass(id: string, data: Partial<Class>): Promise<{ class: Class }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLASSES}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteClass(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLASSES}/${id}`, {
      method: "DELETE",
    })
  }

  // Subject Management
  async getSubjects(params?: Record<string, any>): Promise<ApiResponse<Subject[]> & { subjects: Subject[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.SUBJECTS}?${new URLSearchParams(params)}`
      : API_CONFIG.ENDPOINTS.SUBJECTS
    return this.request(url)
  }

  async getSubjectById(id: string): Promise<{ subject: Subject }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SUBJECTS}/${id}`)
  }

  async createSubject(data: Partial<Subject>): Promise<{ subject: Subject }> {
    return this.request(API_CONFIG.ENDPOINTS.SUBJECTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateSubject(id: string, data: Partial<Subject>): Promise<{ subject: Subject }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SUBJECTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteSubject(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SUBJECTS}/${id}`, {
      method: "DELETE",
    })
  }

  async assignTeacherToSubject(subjectId: string, teacherId: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SUBJECTS}/${subjectId}/teachers`, {
      method: "POST",
      body: JSON.stringify({ teacherId }),
    })
  }

  async removeTeacherFromSubject(subjectId: string, teacherId: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.SUBJECTS}/${subjectId}/teachers`, {
      method: "DELETE",
      body: JSON.stringify({ teacherId }),
    })
  }

  // Grade Management
  async getGrades(params?: Record<string, any>): Promise<ApiResponse<Grade[]> & { grades: Grade[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.GRADES}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.GRADES
    return this.request(url)
  }

  async getGradeById(id: string): Promise<{ grade: Grade }> {
    return this.request(`${API_CONFIG.ENDPOINTS.GRADES}/${id}`)
  }

  async createGrade(data: Partial<Grade>): Promise<{ grade: Grade }> {
    return this.request(API_CONFIG.ENDPOINTS.GRADES, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateGrade(id: string, data: Partial<Grade>): Promise<{ grade: Grade }> {
    return this.request(`${API_CONFIG.ENDPOINTS.GRADES}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteGrade(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.GRADES}/${id}`, {
      method: "DELETE",
    })
  }

  // Assignment Management
  async getAssignments(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Assignment[]> & { assignments: Assignment[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}?${new URLSearchParams(params)}`
      : API_CONFIG.ENDPOINTS.ASSIGNMENTS
    return this.request(url)
  }

  async getAssignmentById(id: string): Promise<{ assignment: Assignment }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${id}`)
  }

  async createAssignment(data: Partial<Assignment>): Promise<{ assignment: Assignment }> {
    return this.request(API_CONFIG.ENDPOINTS.ASSIGNMENTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<{ assignment: Assignment }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteAssignment(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${id}`, {
      method: "DELETE",
    })
  }

  async getStudentAssignments(studentId: string, params?: Record<string, any>): Promise<{ assignments: Assignment[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/student/${studentId}?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/student/${studentId}`
    return this.request(url)
  }

  async uploadAssignmentFiles(assignmentId: string, files: FileList): Promise<FileUploadResponse> {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })
    return this.uploadFile(`${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${assignmentId}/files`, formData)
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    files: FileList,
    comments?: string,
  ): Promise<{ submission: any }> {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })
    if (comments) {
      formData.append("comments", comments)
    }
    return this.uploadFile(
      `${API_CONFIG.ENDPOINTS.ASSIGNMENTS}/${assignmentId}/submit?studentId=${studentId}`,
      formData,
    )
  }

  // Event Management
  async getEvents(params?: Record<string, any>): Promise<ApiResponse<Event[]> & { events: Event[] }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.EVENTS}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.EVENTS
    return this.request(url)
  }

  async getUpcomingEvents(params?: Record<string, any>): Promise<{ upcomingEvents: Event[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.EVENTS}/upcoming?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.EVENTS}/upcoming`
    return this.request(url)
  }

  async getEventById(id: string): Promise<{ event: Event }> {
    return this.request(`${API_CONFIG.ENDPOINTS.EVENTS}/${id}`)
  }

  async createEvent(data: Partial<Event>): Promise<{ event: Event }> {
    return this.request(API_CONFIG.ENDPOINTS.EVENTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<{ event: Event }> {
    return this.request(`${API_CONFIG.ENDPOINTS.EVENTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteEvent(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.EVENTS}/${id}`, {
      method: "DELETE",
    })
  }

  async rsvpToEvent(
    eventId: string,
    data: { response: string; attendeeCount?: number; notes?: string },
  ): Promise<{ rsvp: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.EVENTS}/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getEventRSVPs(eventId: string): Promise<{ rsvps: any[]; summary: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.EVENTS}/${eventId}/rsvps`)
  }

  async uploadEventImages(eventId: string, images: FileList): Promise<FileUploadResponse> {
    const formData = new FormData()
    Array.from(images).forEach((image) => {
      formData.append("images", image)
    })
    return this.uploadFile(`${API_CONFIG.ENDPOINTS.EVENTS}/${eventId}/images`, formData)
  }

  // Notification Management
  async getNotifications(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Notification[]> & { notifications: Notification[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?${new URLSearchParams(params)}`
      : API_CONFIG.ENDPOINTS.NOTIFICATIONS
    return this.request(url)
  }

  async getNotificationStats(): Promise<{ stats: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/stats`)
  }

  async getNotificationPreferences(): Promise<{ preferences: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/preferences`)
  }

  async createNotification(data: any): Promise<{ notification: Notification }> {
    return this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/read`, {
      method: "PATCH",
      body: JSON.stringify({ notificationIds }),
    })
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/read-all`, {
      method: "PATCH",
    })
  }

  async updateNotificationPreferences(preferences: any): Promise<{ preferences: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/preferences`, {
      method: "PUT",
      body: JSON.stringify(preferences),
    })
  }

  async deleteNotification(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${id}`, {
      method: "DELETE",
    })
  }

  // Attendance Management
  async recordAttendance(data: {
    studentId: string
    lessonId?: string
    date?: string
    present: boolean
    note?: string
  }): Promise<{ attendance: AttendanceRecord }> {
    return this.request(API_CONFIG.ENDPOINTS.ATTENDANCE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async recordBulkAttendance(data: {
    lessonId?: string
    date?: string
    attendanceRecords: Array<{ studentId: string; present: boolean; note?: string }>
  }): Promise<{ attendance: AttendanceRecord[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ATTENDANCE}/bulk`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getStudentAttendance(
    studentId: string,
    params?: Record<string, any>,
  ): Promise<{ attendance: AttendanceRecord[]; summary: any }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ATTENDANCE}/student/${studentId}?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ATTENDANCE}/student/${studentId}`
    return this.request(url)
  }

  async getClassAttendance(classId: string, params?: Record<string, any>): Promise<{ classAttendance: any[] }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ATTENDANCE}/class/${classId}?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ATTENDANCE}/class/${classId}`
    return this.request(url)
  }

  async getAttendanceAnalytics(params?: Record<string, any>): Promise<{ analytics: AnalyticsData }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ATTENDANCE}/analytics?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ATTENDANCE}/analytics`
    return this.request(url)
  }

  // Analytics
  async getSchoolAnalytics(params?: Record<string, any>): Promise<{ schoolAnalytics: AnalyticsData }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ANALYTICS}/school?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ANALYTICS}/school`
    return this.request(url)
  }

  async getStudentAnalytics(
    studentId: string,
    params?: Record<string, any>,
  ): Promise<{ studentAnalytics: AnalyticsData }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ANALYTICS}/student/${studentId}?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ANALYTICS}/student/${studentId}`
    return this.request(url)
  }

  async getClassAnalytics(classId: string, params?: Record<string, any>): Promise<{ classAnalytics: AnalyticsData }> {
    const url = params
      ? `${API_CONFIG.ENDPOINTS.ANALYTICS}/class/${classId}?${new URLSearchParams(params)}`
      : `${API_CONFIG.ENDPOINTS.ANALYTICS}/class/${classId}`
    return this.request(url)
  }

  async getParentEngagementAnalytics(): Promise<{ parentEngagement: AnalyticsData }> {
    return this.request(`${API_CONFIG.ENDPOINTS.ANALYTICS}/engagement`)
  }

  // Multi-tenant operations
  async getParentChildren(): Promise<{ children: Student[]; summary: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/parent/children`)
  }

  async getParentSchools(): Promise<{ schools: any[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/parent/schools`)
  }

  async addChildToParent(data: {
    studentName: string
    studentSurname: string
    schoolId: string
    registrationNumber: string
    dateOfBirth: string
  }): Promise<{ verificationRequest: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/parent/add-child`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async searchAcrossSchools(query: string, type: string): Promise<{ results: any }> {
    return this.request(
      `${API_CONFIG.ENDPOINTS.MULTI_TENANT}/parent/search?query=${encodeURIComponent(query)}&type=${type}`,
    )
  }

  async getTeacherClasses(): Promise<{ classes: Class[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/teacher/classes`)
  }

  async getTeacherSubjects(): Promise<{ subjects: Subject[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/teacher/subjects`)
  }

  async getTeacherStudents(): Promise<{ students: Student[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/teacher/students`)
  }

  async getPrincipalOverview(): Promise<{ overview: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/principal/overview`)
  }

  async getUnassignedStudents(): Promise<{ students: Student[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/principal/unassigned-students`)
  }

  async assignStudentToClass(studentId: string, classId: string): Promise<{ student: Student }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/students/${studentId}/assign-class`, {
      method: "POST",
      body: JSON.stringify({ classId }),
    })
  }

  async verifyParentChild(
    studentId: string,
    data: { parentId: string; approved: boolean },
  ): Promise<{ verificationRequest: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.MULTI_TENANT}/students/${studentId}/verify-parent`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // File upload method
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {}
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    // Log the file upload request
    console.group(`📤 Generic File Upload: POST ${endpoint}`)
    console.log("📍 Full URL:", url)
    console.log("📋 Headers:", headers)
    console.log(
      "📁 FormData entries:",
      Array.from(formData.entries()).map(([key, value]) => ({
        key,
        value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
      })),
    )
    console.groupEnd()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    })

    // Log the upload response
    console.group(`📥 Upload Response: POST ${endpoint}`)
    console.log("📊 Status:", response.status, response.statusText)
    console.log("✅ OK:", response.ok)
    console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()))
    console.groupEnd()

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.group(`❌ Upload Error: POST ${endpoint}`)
      console.log("📊 Status:", response.status, response.statusText)
      console.log("💥 Error Data:", errorData)
      console.groupEnd()
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const responseData = await response.json()

    console.group(`✅ Upload Success: POST ${endpoint}`)
    console.log("📦 Response Data:", responseData)
    console.groupEnd()

    return responseData
  }

  // Curriculum Management
  async getCurriculums(params?: Record<string, any>): Promise<{ curriculums: any[]; pagination?: any }> {
    const url = params ? `${API_CONFIG.ENDPOINTS.CURRICULUM}?${new URLSearchParams(params)}` : API_CONFIG.ENDPOINTS.CURRICULUM
    return this.request(url)
  }

  async getCurriculumById(id: string): Promise<{ curriculum: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/${id}`)
  }

  async createCurriculum(data: any): Promise<{ curriculum: any }> {
    return this.request(API_CONFIG.ENDPOINTS.CURRICULUM, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCurriculum(id: string, data: any): Promise<{ curriculum: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteCurriculum(id: string): Promise<{ message: string }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/${id}`, {
      method: "DELETE",
    })
  }

  // Curriculum Subjects Management
  async createCurriculumSubject(data: any): Promise<{ curriculumSubject: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/subjects`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Learning Objectives Management
  async getLearningObjectives(curriculumSubjectId: string): Promise<{ curriculumSubject: any; learningObjectives: any[] }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/subjects/${curriculumSubjectId}/objectives`)
  }

  async createLearningObjective(data: any): Promise<{ learningObjective: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/objectives`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Student Progress Management
  async updateStudentProgress(data: any): Promise<{ progress: any }> {
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/progress`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getStudentProgress(studentId: string, curriculumId?: string): Promise<{ student: any; progress: any[]; statistics: any }> {
    const params = curriculumId ? `?curriculumId=${curriculumId}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/progress/student/${studentId}${params}`)
  }

  async getCurriculumProgress(curriculumId: string, params?: Record<string, any>): Promise<{ curriculum: any; studentProgress: any[] }> {
    const queryString = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.CURRICULUM}/${curriculumId}/progress${queryString}`)
  }

  // Generic CRUD methods for additional flexibility
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url)
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
