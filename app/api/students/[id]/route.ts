import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/students/${params.id}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch student" }, { status: response.status })
    }

    const data = await response.json()

    // Transform response to match new API specification
    return NextResponse.json({
      message: data.message || "Student retrieved successfully",
      student: data.student
    })
  } catch (error) {
    console.error("Get student API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Transform request body to match backend expectations
    const transformedBody = {
      name: body.name,
      surname: body.surname,
      address: body.address,
      classId: body.classId,
      gradeId: body.gradeId,
      // Include other fields as needed
      ...body
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/students/${params.id}`, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformedBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to update student" }, { status: response.status })
    }

    const data = await response.json()

    // Transform response to match new API specification
    return NextResponse.json({
      message: data.message || "Student updated successfully",
      student: data.student
    })
  } catch (error) {
    console.error("Update student API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/students/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to delete student" }, { status: response.status })
    }

    const data = await response.json()

    // Transform response to match new API specification
    return NextResponse.json({
      message: data.message || "Student deleted successfully"
    })
  } catch (error) {
    console.error("Delete student API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
