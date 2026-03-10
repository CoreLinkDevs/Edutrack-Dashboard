import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    if (!role) {
      return NextResponse.json({ error: "Role parameter is required" }, { status: 400 })
    }

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Map role to backend endpoint
    const roleEndpointMap: Record<string, string> = {
      SUPER_ADMIN: "/api/dashboard/super-admin",
      SCHOOL_ADMIN: "/api/dashboard/school-admin",
      PRINCIPAL: "/api/dashboard/principal",
      TEACHER: "/api/dashboard/teacher",
      PARENT: "/api/dashboard/parent",
    }

    const endpoint = roleEndpointMap[role]
    if (!endpoint) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Forward the request to the actual EduTrack API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Dashboard data fetch failed" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
