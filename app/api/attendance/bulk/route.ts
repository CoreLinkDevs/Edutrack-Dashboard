import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const response = await fetch(`http://localhost:3000/api/attendance/bulk`, {
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
        { error: errorData.message || "Failed to record bulk attendance" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Record bulk attendance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
