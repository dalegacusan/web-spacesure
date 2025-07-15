import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const readStatus = searchParams.get("read_status")

    const offset = (page - 1) * limit

    let query = db.notifications().select("*", { count: "exact" })

    // Users can only see their own notifications unless they're admin
    if (authResult.role !== "admin") {
      query = query.eq("user_id", authResult.user_id)
    }

    if (readStatus) {
      query = query.eq("read_status", readStatus)
    }

    const {
      data: notifications,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("sent_date", { ascending: false })

    if (error) {
      console.error("Notifications fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notifications fetched successfully",
      data: notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { user_id, notification_type, message } = await request.json()

    if (!user_id || !notification_type || !message) {
      return NextResponse.json({ error: "User ID, notification type, and message are required" }, { status: 400 })
    }

    // Verify user exists
    const { data: user, error: userError } = await db.users().select("user_id").eq("user_id", user_id).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create notification
    const { data: newNotification, error } = await db
      .notifications()
      .insert({
        user_id,
        notification_type,
        message,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Notification creation error:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notification sent successfully",
      data: newNotification,
    })
  } catch (error) {
    console.error("Notification creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
