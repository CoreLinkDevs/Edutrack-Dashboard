import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const { id } = await params
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/principals/${id}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch principal" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Get principal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id } = await params

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/principals/${id}`, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to update principal" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Update principal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const { id } = await params
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/principals/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to delete principal" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Delete principal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}