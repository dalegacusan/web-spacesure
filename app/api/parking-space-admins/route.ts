import { type NextRequest, NextResponse } from "next/server"
import { db, logAdminAction } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const parkingSpaceId = searchParams.get("parking_space_id")

    let query = db.parking_space_admins().select(`
        *,
        parking_spaces!inner(establishment_name, city),
        users!parking_space_admins_user_id_fkey(first_name, last_name, email),
        assigned_by:users!parking_space_admins_assigned_by_user_id_fkey(first_name, last_name, email)
      `)

    if (parkingSpaceId) {
      query = query.eq("parking_space_id", Number.parseInt(parkingSpaceId))
    }

    const { data: assignments, error } = await query.order("assigned_at", { ascending: false })

    if (error) {
      console.error("Parking space admins fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch parking space admins" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Parking space admins fetched successfully",
      data: assignments,
    })
  } catch (error) {
    console.error("Parking space admins API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { parking_space_id, user_id } = await request.json()

    if (!parking_space_id || !user_id) {
      return NextResponse.json({ error: "Parking space ID and user ID are required" }, { status: 400 })
    }

    // Verify parking space exists
    const { data: parkingSpace, error: spaceError } = await db
      .parking_spaces()
      .select("parking_space_id")
      .eq("parking_space_id", parking_space_id)
      .eq("isdeleted", false)
      .single()

    if (spaceError || !parkingSpace) {
      return NextResponse.json({ error: "Parking space not found" }, { status: 404 })
    }

    // Verify user exists and has appropriate role
    const { data: user, error: userError } = await db.users().select("user_id, role").eq("user_id", user_id).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!["admin", "establishment"].includes(user.role)) {
      return NextResponse.json({ error: "User must be admin or establishment role" }, { status: 400 })
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await db
      .parking_space_admins()
      .select("parking_space_admin_id")
      .eq("parking_space_id", parking_space_id)
      .eq("user_id", user_id)
      .single()

    if (existingAssignment) {
      return NextResponse.json({ error: "User is already assigned to this parking space" }, { status: 409 })
    }

    // Create assignment
    const { data: newAssignment, error } = await db
      .parking_space_admins()
      .insert({
        parking_space_id,
        user_id,
        assigned_by_user_id: authResult.user_id,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Parking space admin assignment error:", error)
      return NextResponse.json({ error: "Failed to assign parking space admin" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(
      authResult.user_id,
      "ASSIGN_PARKING_ADMIN",
      `Assigned user ${user_id} to parking space ${parking_space_id}`,
    )

    return NextResponse.json({
      message: "Parking space admin assigned successfully",
      data: newAssignment,
    })
  } catch (error) {
    console.error("Parking space admin assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
