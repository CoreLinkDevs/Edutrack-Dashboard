"use client"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useAuth } from "@/lib/auth-context"
import { StatsCard } from "./stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts"
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  School,
  UserCheck,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react"

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function DashboardContent() {
  const { user } = useAuth()
  const { data, isLoading, error } = useDashboardData()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No dashboard data available</AlertDescription>
      </Alert>
    )
  }

  switch (user?.role) {
    case "SUPER_ADMIN":
      return <SuperAdminDashboard data={data} />
    case "SCHOOL_ADMIN":
      return <SchoolAdminDashboard data={data} />
    case "PRINCIPAL":
      return <PrincipalDashboard data={data} />
    case "TEACHER":
      return <TeacherDashboard data={data} />
    case "PARENT":
      return <ParentDashboard data={data} />
    default:
      return <div>Unknown user role</div>
  }
}

function SuperAdminDashboard({ data }: { data: any }) {
  const { overview, recentSchools, schoolStats } = data

  // Revenue data based on totalRevenue from API
  const revenueData = [
    { month: 'Jan', revenue: overview?.totalRevenue || 0, growth: 12 },
    { month: 'Feb', revenue: (overview?.totalRevenue || 0) * 1.15, growth: 15 },
    { month: 'Mar', revenue: (overview?.totalRevenue || 0) * 1.07, growth: -8 },
    { month: 'Apr', revenue: (overview?.totalRevenue || 0) * 1.34, growth: 27 },
    { month: 'May', revenue: (overview?.totalRevenue || 0) * 1.29, growth: -5 },
    { month: 'Jun', revenue: (overview?.totalRevenue || 0) * 1.49, growth: 15 },
  ]

  const userDistribution = [
    { name: 'Students', value: overview?.totalStudents || 0, color: '#0088FE' },
    { name: 'Teachers', value: (overview?.totalUsers || 0) * 0.15, color: '#00C49F' },
    { name: 'Parents', value: (overview?.totalUsers || 0) * 0.35, color: '#FFBB28' },
    { name: 'Admins', value: (overview?.totalUsers || 0) * 0.05, color: '#FF8042' },
  ]

  const schoolStatusData = [
    { name: 'Approved', value: schoolStats?.APPROVED || 0, color: '#00C49F' },
    { name: 'Pending', value: schoolStats?.PENDING || 0, color: '#FFBB28' },
    { name: 'Rejected', value: schoolStats?.REJECTED || 0, color: '#FF8042' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Schools"
          value={overview?.totalSchools || 0}
          description="Registered schools"
          icon={School}
        />
        <StatsCard
          title="Verified Schools"
          value={overview?.verifiedSchools || 0}
          description="Approved schools"
          icon={CheckCircle}
        />
        <StatsCard
          title="Pending Schools"
          value={overview?.pendingSchools || 0}
          description="Awaiting approval"
          icon={Clock}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${overview?.totalRevenue?.toLocaleString() || 0}`}
          description="Platform revenue"
          icon={DollarSign}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>Monthly revenue and growth rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              School Status Distribution
            </CardTitle>
            <CardDescription>School registration status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={schoolStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {schoolStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Schools']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* School Statistics & Recent Schools */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              School Registration Stats
            </CardTitle>
            <CardDescription>School approval status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={schoolStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Approved</span>
                <Badge variant="secondary">{schoolStats?.APPROVED || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <Badge variant="secondary">{schoolStats?.PENDING || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rejected</span>
                <Badge variant="secondary">{schoolStats?.REJECTED || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Schools</CardTitle>
            <CardDescription>Latest school registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSchools?.slice(0, 5).map((school: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <School className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{school.name}</p>
                    <p className="text-xs text-gray-500">{school.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={school.registrationStatus === 'PENDING' ? 'outline' : 'secondary'}>
                        {school.registrationStatus}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(school.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent schools</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SchoolAdminDashboard({ data }: { data: any }) {
  const { overview, recentEvents } = data

  const paymentData = [
    { name: 'Completed Payments', value: overview?.completedPayments || 0, color: '#00C49F' },
    { name: 'Pending Payments', value: overview?.pendingPayments || 0, color: '#FFBB28' },
  ]

  const attendanceData = [
    { day: 'Mon', attendance: overview?.attendanceRate || 0 },
    { day: 'Tue', attendance: (overview?.attendanceRate || 0) * 0.95 },
    { day: 'Wed', attendance: (overview?.attendanceRate || 0) * 1.02 },
    { day: 'Thu', attendance: (overview?.attendanceRate || 0) * 0.98 },
    { day: 'Fri', attendance: (overview?.attendanceRate || 0) * 0.96 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={overview?.totalStudents || 0}
          description="Enrolled students"
          icon={GraduationCap}
        />
        <StatsCard
          title="Total Teachers"
          value={overview?.totalTeachers || 0}
          description="Active teachers"
          icon={UserCheck}
        />
        <StatsCard
          title="Total Parents"
          value={overview?.totalParents || 0}
          description="Registered parents"
          icon={Users}
        />
        <StatsCard
          title="Total Classes"
          value={overview?.totalClasses || 0}
          description="Active classes"
          icon={BookOpen}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pending Payments"
          value={overview?.pendingPayments || 0}
          description="Outstanding payments"
          icon={Clock}
        />
        <StatsCard
          title="Completed Payments"
          value={overview?.completedPayments || 0}
          description="Paid payments"
          icon={CheckCircle}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${overview?.attendanceRate || 0}%`}
          description="Overall attendance"
          icon={UserCheck}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Overview
            </CardTitle>
            <CardDescription>Payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Payments']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completed</span>
                <Badge variant="secondary">{overview?.completedPayments || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pending</span>
                <Badge variant="outline">{overview?.pendingPayments || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Attendance
            </CardTitle>
            <CardDescription>Attendance rate trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Rate</span>
                <Badge variant="secondary">{overview?.attendanceRate || 0}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest school events and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents?.slice(0, 5).map((event: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 mt-1 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.eventType}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.startTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )) || <p className="text-sm text-gray-500">No recent events</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PrincipalDashboard({ data }: { data: any }) {
  const { overview, recentAssignments, upcomingEvents } = data

  const attendanceData = [
    { day: 'Mon', attendance: overview?.attendanceRate || 0 },
    { day: 'Tue', attendance: (overview?.attendanceRate || 0) * 0.95 },
    { day: 'Wed', attendance: (overview?.attendanceRate || 0) * 1.02 },
    { day: 'Thu', attendance: (overview?.attendanceRate || 0) * 0.98 },
    { day: 'Fri', attendance: (overview?.attendanceRate || 0) * 0.96 },
  ]

  const performanceData = [
    { subject: 'Math', average: 85 },
    { subject: 'Science', average: 82 },
    { subject: 'English', average: 88 },
    { subject: 'History', average: 79 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={overview?.totalStudents || 0}
          description="Enrolled students"
          icon={GraduationCap}
        />
        <StatsCard
          title="Total Teachers"
          value={overview?.totalTeachers || 0}
          description="Active teachers"
          icon={UserCheck}
        />
        <StatsCard
          title="Total Classes"
          value={overview?.totalClasses || 0}
          description="Active classes"
          icon={BookOpen}
        />
        <StatsCard
          title="Pending Approvals"
          value={overview?.pendingApprovals || 0}
          description="Awaiting approval"
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance Rate"
          value={`${overview?.attendanceRate || 0}%`}
          description="Overall attendance"
          icon={CheckCircle}
        />
        <StatsCard
          title="Average Performance"
          value={`${overview?.averagePerformance || 0}%`}
          description="Academic average"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Weekly Attendance
            </CardTitle>
            <CardDescription>Attendance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>Average grades by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average Grade']} />
                <Bar dataKey="average" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Latest assignment submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssignments?.slice(0, 5).map((assignment: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <FileText className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-gray-500">
                      {assignment.teacher?.user?.name} {assignment.teacher?.user?.surname} - {assignment.subject?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {assignment._count?.submissions || 0} submissions
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent assignments</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>School events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents?.slice(0, 5).map((event: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.eventType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No upcoming events</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


function TeacherDashboard({ data }: { data: any }) {
  const { overview, myClasses, mySubjects, recentAssignments, recentAttendance, upcomingLessons } = data

  const assignmentProgress = [
    { name: 'Completed', value: 75, color: '#00C49F' },
    { name: 'In Progress', value: 20, color: '#FFBB28' },
    { name: 'Not Started', value: 5, color: '#FF8042' },
  ]

  const gradingData = [
    { subject: 'Math', pending: 12, completed: 23 },
    { subject: 'Science', pending: 8, completed: 19 },
    { subject: 'History', pending: 5, completed: 15 },
    { subject: 'English', pending: 9, completed: 21 },
  ]

  const submissionTrends = [
    { day: 'Mon', submissions: 15 },
    { day: 'Tue', submissions: 23 },
    { day: 'Wed', submissions: 18 },
    { day: 'Thu', submissions: 29 },
    { day: 'Fri', submissions: 12 },
    { day: 'Sat', submissions: 6 },
    { day: 'Sun', submissions: 4 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Classes"
          value={overview?.totalClasses || 0}
          description="Classes assigned"
          icon={BookOpen}
        />
        <StatsCard
          title="Total Subjects"
          value={overview?.totalSubjects || 0}
          description="Subjects taught"
          icon={BookOpen}
        />
        <StatsCard
          title="Total Assignments"
          value={overview?.totalAssignments || 0}
          description="Assignments created"
          icon={FileText}
        />
        <StatsCard
          title="Pending Submissions"
          value={overview?.pendingSubmissions || 0}
          description="Awaiting review"
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Assignment Progress
            </CardTitle>
            <CardDescription>Student completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={assignmentProgress}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assignmentProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Grading Overview
            </CardTitle>
            <CardDescription>Pending vs completed by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" fill="#FF8042" name="Pending" />
                <Bar dataKey="completed" fill="#00C49F" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Submission Trends
            </CardTitle>
            <CardDescription>Weekly submission patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Classes I teach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myClasses?.slice(0, 5).map((classItem: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{classItem.name}</p>
                    <p className="text-xs text-gray-500">
                      {classItem.grade?.name} - {classItem.capacity} students
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {classItem._count?.students || 0} enrolled
                    </Badge>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No classes assigned</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Subjects</CardTitle>
            <CardDescription>Subjects I teach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mySubjects?.slice(0, 5).map((subject: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{subject.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {subject._count?.assignments || 0} assignments
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      {subject._count?.lessons || 0} lessons
                    </Badge>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No subjects assigned</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Latest assignments created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssignments?.slice(0, 5).map((assignment: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <FileText className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-gray-500">{assignment.subject?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {assignment._count?.submissions || 0} submissions
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent assignments</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance?.slice(0, 5).map((record: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <UserCheck className={`w-4 h-4 mt-1 ${record.present ? 'text-green-500' : 'text-red-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {record.student?.name} {record.student?.surname}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.lesson?.subject?.name} - {record.lesson?.class?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent attendance records</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Lessons</CardTitle>
            <CardDescription>Scheduled lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingLessons?.slice(0, 5).map((lesson: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lesson.lesson?.subject?.name}</p>
                    <p className="text-xs text-gray-500">{lesson.lesson?.class?.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(lesson.startTime).toLocaleString()} - {new Date(lesson.endTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No upcoming lessons</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
function ParentDashboard({ data }: { data: any }) {
  const { overview, children, recentNotifications, upcomingEvents, pendingPayments, recentResults } = data

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Children"
          value={overview?.totalChildren || 0}
          description="Children enrolled"
          icon={Users}
        />
        <StatsCard
          title="Schools Count"
          value={overview?.schoolsCount || 0}
          description="Schools attended"
          icon={School}
        />
        <StatsCard
          title="Pending Payments"
          value={overview?.pendingPaymentsCount || 0}
          description="Outstanding payments"
          icon={Clock}
        />
        <StatsCard
          title="Unread Notifications"
          value={overview?.unreadNotifications || 0}
          description="Unread messages"
          icon={AlertCircle}
        />
      </div>

      {/* Children Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children?.map((child: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{child.name} {child.surname}</CardTitle>
              <CardDescription>
                {child.school?.name} - {child.class?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Grade</span>
                <Badge variant="secondary">{child.grade?.name}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Attendance Rate</span>
                <Badge variant="secondary">{child.attendanceSummary?.attendance_rate || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Days</span>
                <Badge variant="outline">{child.attendanceSummary?.total_days || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        )) || <p className="text-sm text-gray-500">No children data available</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest messages and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications?.slice(0, 5).map((notification: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertCircle className={`w-4 h-4 mt-1 ${notification.isRead ? 'text-gray-400' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={notification.type === 'ASSIGNMENT' ? 'secondary' : 'outline'}>
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent notifications</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>School events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents?.slice(0, 5).map((event: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.eventType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No upcoming events</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Outstanding payment obligations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments?.slice(0, 5).map((payment: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <DollarSign className="w-4 h-4 mt-1 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{payment.feeStructure?.name}</p>
                    <p className="text-xs text-gray-500">{payment.school?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        ₦{payment.amount?.toLocaleString() || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No pending payments</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResults?.slice(0, 5).map((result: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <FileText className="w-4 h-4 mt-1 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{result.assignment?.title}</p>
                    <p className="text-xs text-gray-500">
                      {result.student?.name} {result.student?.surname} - {result.assignment?.subject?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {result.score}/{result.maxScore} ({result.percentage}%)
                      </Badge>
                      <Badge variant={result.grade === 'A' ? 'default' : 'outline'}>
                        Grade {result.grade}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No recent results</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-6 w-[60px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
