import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization")
  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    // Await params before accessing its properties
    const { id } = await params
    const body = await request.json()

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/subjects/${id}/teachers`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to assign teacher to subject" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Assign teacher to subject API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}