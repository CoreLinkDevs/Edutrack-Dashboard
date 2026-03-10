import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const queryString = searchParams.toString()
    const url = `${API_CONFIG.BASE_URL}/api/academic-calendar/calendar${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch academic calendar" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Academic calendar API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}