import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const actionType = searchParams.get("action_type")
    const adminUserId = searchParams.get("admin_user_id")

    const offset = (page - 1) * limit

    let query = db.admin_log().select(
      `
        *,
        users!inner(first_name, last_name, email)
      `,
      { count: "exact" },
    )

    if (actionType) {
      query = query.eq("action_type", actionType)
    }

    if (adminUserId) {
      query = query.eq("admin_user_id", Number.parseInt(adminUserId))
    }

    const {
      data: logs,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("timestamp", { ascending: false })

    if (error) {
      console.error("Admin logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch admin logs" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Admin logs fetched successfully",
      data: logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
