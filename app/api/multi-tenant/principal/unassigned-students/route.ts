import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/multi-tenant/principal/unassigned-students`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch unassigned students" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Unassigned students API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
