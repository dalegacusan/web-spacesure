import { type NextRequest, NextResponse } from "next/server"
import { db, logAdminAction } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const assignmentId = Number.parseInt(params.id)

    // Get assignment details for logging
    const { data: assignment, error: fetchError } = await db
      .parking_space_admins()
      .select("*")
      .eq("parking_space_admin_id", assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const { error } = await db.parking_space_admins().delete().eq("parking_space_admin_id", assignmentId)

    if (error) {
      console.error("Parking space admin removal error:", error)
      return NextResponse.json({ error: "Failed to remove parking space admin" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(
      authResult.user_id,
      "REMOVE_PARKING_ADMIN",
      `Removed user ${assignment.user_id} from parking space ${assignment.parking_space_id}`,
    )

    return NextResponse.json({
      message: "Parking space admin removed successfully",
    })
  } catch (error) {
    console.error("Parking space admin removal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
