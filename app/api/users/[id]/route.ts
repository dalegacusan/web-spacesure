import type { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { db, logAdminAction } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const userId = Number.parseInt(params.id)

    // Users can only view their own profile unless they're admin
    if (authResult.role !== "admin" && authResult.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: user, error } = await db
      .users()
      .select(
        "user_id, email, first_name, last_name, middle_name, phone_number, role, created_at, account_available_at",
      )
      .eq("user_id", userId)
      .single()

    if (error || !user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({
      message: "User fetched successfully",
      data: { user },
    })
  } catch (error) {
    console.error("User fetch error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const userId = Number.parseInt(params.id)
    const { firstName, lastName, middleName, phoneNumber, email } = await request.json()

    // Users can only update their own profile unless they're admin
    if (authResult.role !== "admin" && authResult.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validation
    if (!firstName || !lastName) {
      return Response.json({ error: "First name and last name are required" }, { status: 400 })
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      phone_number: phoneNumber || null,
      updated_at: new Date().toISOString(),
    }

    // Only admin can update email
    if (authResult.role === "admin" && email) {
      updateData.email = email.toLowerCase()
    }

    const { data: updatedUser, error } = await db
      .users()
      .update(updateData)
      .eq("user_id", userId)
      .select("user_id, email, first_name, last_name, middle_name, phone_number, role")
      .single()

    if (error) {
      console.error("User update error:", error)
      return Response.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log admin action if admin updated another user
    if (authResult.role === "admin" && authResult.id !== userId) {
      await logAdminAction(authResult.id, "UPDATE_USER", `Updated user: ${updatedUser.email}`)
    }

    return Response.json({
      message: "User updated successfully",
      data: { user: updatedUser },
    })
  } catch (error) {
    console.error("User update error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const userId = Number.parseInt(params.id)

    // Soft delete by setting account_available_at to null
    const { data: deletedUser, error } = await db
      .users()
      .update({
        account_available_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("email")
      .single()

    if (error) {
      console.error("User deletion error:", error)
      return Response.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(authResult.id, "DELETE_USER", `Deleted user: ${deletedUser.email}`)

    return Response.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("User deletion error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
