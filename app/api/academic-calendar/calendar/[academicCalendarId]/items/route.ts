import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ academicCalendarId: string }> }
) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const { academicCalendarId } = await params
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/academic-calendar/calendar/${academicCalendarId}/items`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch calendar items" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Calendar items API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}