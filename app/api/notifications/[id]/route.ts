import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const notificationId = Number.parseInt(params.id)
    const { read_status } = await request.json()

    if (!read_status || !["read", "unread"].includes(read_status)) {
      return NextResponse.json({ error: "Valid read status is required" }, { status: 400 })
    }

    // Get notification to check ownership
    const { data: notification, error: fetchError } = await db
      .notifications()
      .select("*")
      .eq("notification_id", notificationId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Users can only update their own notifications unless they're admin
    if (authResult.role !== "admin" && notification.user_id !== authResult.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: updatedNotification, error } = await db
      .notifications()
      .update({ read_status })
      .eq("notification_id", notificationId)
      .select("*")
      .single()

    if (error) {
      console.error("Notification update error:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notification updated successfully",
      data: updatedNotification,
    })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const notificationId = Number.parseInt(params.id)

    // Get notification to check ownership
    const { data: notification, error: fetchError } = await db
      .notifications()
      .select("*")
      .eq("notification_id", notificationId)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Users can only delete their own notifications unless they're admin
    if (authResult.role !== "admin" && notification.user_id !== authResult.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await db.notifications().delete().eq("notification_id", notificationId)

    if (error) {
      console.error("Notification deletion error:", error)
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("Notification deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
