"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  GraduationCap,
  Activity,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"

// Mock authentication hook
const useAuth = () => ({
  user: { role: "PRINCIPAL" }
})

// Mock data with enhanced structure
const mockAttendanceData = [
  { month: "Jan", present: 85, absent: 15, target: 90 },
  { month: "Feb", present: 90, absent: 10, target: 90 },
  { month: "Mar", present: 88, absent: 12, target: 90 },
  { month: "Apr", present: 92, absent: 8, target: 90 },
  { month: "May", present: 89, absent: 11, target: 90 },
  { month: "Jun", present: 91, absent: 9, target: 90 },
]

const mockPerformanceData = [
  { subject: "Math", average: 85, improvement: 5, students: 120 },
  { subject: "Science", average: 78, improvement: -2, students: 115 },
  { subject: "English", average: 88, improvement: 3, students: 118 },
  { subject: "History", average: 82, improvement: 8, students: 110 },
  { subject: "Geography", average: 75, improvement: 1, students: 108 },
]

const mockGradeDistribution = [
  { grade: "A", count: 30, percentage: 29.4, fill: "#16a34a" },
  { grade: "B", count: 45, percentage: 44.1, fill: "#3b82f6" },
  { grade: "C", count: 20, percentage: 19.6, fill: "#f59e0b" },
  { grade: "D", count: 5, percentage: 4.9, fill: "#f97316" },
  { grade: "F", count: 2, percentage: 2.0, fill: "#ef4444" },
]

const mockRevenueData = [
  { month: "Jan", revenue: 20000, expenses: 15000, net: 5000 },
  { month: "Feb", revenue: 22000, expenses: 16000, net: 6000 },
  { month: "Mar", revenue: 21000, expenses: 15500, net: 5500 },
  { month: "Apr", revenue: 23000, expenses: 17000, net: 6000 },
  { month: "May", revenue: 24000, expenses: 18000, net: 6000 },
  { month: "Jun", revenue: 25000, expenses: 19000, net: 6000 },
]

const mockUserActivityData = [
  { day: "Mon", logins: 450, activities: 320 },
  { day: "Tue", logins: 380, activities: 280 },
  { day: "Wed", logins: 420, activities: 300 },
  { day: "Thu", logins: 390, activities: 290 },
  { day: "Fri", logins: 460, activities: 350 },
  { day: "Sat", logins: 200, activities: 150 },
  { day: "Sun", logins: 180, activities: 120 },
]

// Enhanced Card component
const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
)

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
)

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
)

// Enhanced Tabs component
const Tabs = ({ children, defaultValue, className = "", ...props }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  
  return (
    <div className={`w-full ${className}`} {...props}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  )
}

const TabsList = ({ children, activeTab, setActiveTab, className = "", ...props }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`} {...props}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
)

const TabsTrigger = ({ children, value, activeTab, setActiveTab, className = "", ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'hover:bg-gray-200'
    } ${className}`}
    onClick={() => setActiveTab(value)}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeTab, className = "", ...props }) => (
  activeTab === value ? (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`} {...props}>
      {children}
    </div>
  ) : null
)

// Metric Card Component
const MetricCard = ({ title, value, change, changeType, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    purple: "text-purple-600 bg-purple-50"
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [dateRange, setDateRange] = React.useState("30d")
  const [selectedMetric, setSelectedMetric] = React.useState("attendance")

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleExport = () => {
    // Simulate export functionality
    console.log("Exporting data...")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into school performance and operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Students"
            value="1,247"
            change="+12% from last month"
            changeType="increase"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active Teachers"
            value="67"
            change="+3 new this month"
            changeType="increase"
            icon={GraduationCap}
            color="green"
          />
          <MetricCard
            title="Attendance Rate"
            value="94.2%"
            change="+2.1% from last week"
            changeType="increase"
            icon={Activity}
            color="purple"
          />
          <MetricCard
            title="Revenue"
            value="$127,340"
            change="+8.2% from last month"
            changeType="increase"
            icon={DollarSign}
            color="green"
          />
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Monthly attendance vs targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="present" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="absent" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly User Activity</CardTitle>
                  <CardDescription>System logins and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockUserActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="logins" fill="#3b82f6" />
                      <Bar dataKey="activities" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>Real-time attendance statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-green-600">Present Today</p>
                        <p className="text-2xl font-bold text-green-800">1,174</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm text-red-600">Absent Today</p>
                        <p className="text-2xl font-bold text-red-800">73</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm text-orange-600">Late Arrivals</p>
                        <p className="text-2xl font-bold text-orange-800">28</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>6-month attendance pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} />
                      <Line type="monotone" dataKey="target" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Overall student performance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockGradeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ grade, percentage }) => `${grade} (${percentage}%)`}
                      >
                        {mockGradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Average scores and improvements by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="average" fill="#3b82f6" />
                      <Bar dataKey="improvement" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                    <CardDescription>Current month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">$127,340</div>
                    <p className="text-sm text-gray-600 mt-1">+8.2% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>Operating costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">$89,250</div>
                    <p className="text-sm text-gray-600 mt-1">+3.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Net Profit</CardTitle>
                    <CardDescription>After expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">$38,090</div>
                    <p className="text-sm text-gray-600 mt-1">+15.7% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Revenue vs expenses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={mockRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Platform users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { role: "Students", count: 1247, color: "bg-blue-500" },
                      { role: "Teachers", count: 67, color: "bg-green-500" },
                      { role: "Parents", count: 892, color: "bg-purple-500" },
                      { role: "Staff", count: 23, color: "bg-orange-500" },
                      { role: "Admins", count: 5, color: "bg-red-500" }
                    ].map((item) => (
                      <div key={item.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="font-medium">{item.role}</span>
                        </div>
                        <span className="text-lg font-bold">{item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Daily active users</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockUserActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="logins" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}