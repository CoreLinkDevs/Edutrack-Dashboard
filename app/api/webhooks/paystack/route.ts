import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/webhooks/paystack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to handle Paystack webhook" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Paystack webhook API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}