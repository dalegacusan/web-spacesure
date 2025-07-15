import type { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { db, logAdminAction } from "@/lib/database"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""

    const offset = (page - 1) * limit

    let query = db
      .users()
      .select(
        "user_id, email, first_name, last_name, middle_name, phone_number, role, created_at, account_available_at",
      )

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq("role", role)
    }

    // Get total count
    const { count } = await db.users().select("*", { count: "exact", head: true })

    // Get paginated results
    const { data: users, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Users fetch error:", error)
      return Response.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return Response.json({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Users API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const { email, password, firstName, lastName, middleName, phoneNumber, role } = await request.json()

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return Response.json({ error: "Email, password, first name, last name, and role are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await db.users().select("email").eq("email", email.toLowerCase()).single()

    if (existingUser) {
      return Response.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const { data: newUser, error } = await db
      .users()
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        phone_number: phoneNumber || null,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        account_available_at: new Date().toISOString(),
      })
      .select("user_id, email, first_name, last_name, role")
      .single()

    if (error) {
      console.error("User creation error:", error)
      return Response.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(authResult.id, "CREATE_USER", `Created user: ${email}`)

    return Response.json({
      message: "User created successfully",
      data: { user: newUser },
    })
  } catch (error) {
    console.error("User creation error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
