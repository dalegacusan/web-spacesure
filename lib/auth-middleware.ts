import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { db } from "./database"

export interface AuthUser {
  id: number
  email: string
  role: string
  first_name: string
  last_name: string
}

export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user from database to ensure they still exist and are active
    const { data: user, error } = await db
      .users()
      .select("*")
      .eq("user_id", decoded.userId)
      .eq("account_available_at", true)
      .single()

    if (error || !user) {
      return null
    }

    return {
      id: user.user_id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export function requireAuth(allowedRoles?: string[]) {
  return async (request: NextRequest) => {
    const user = await verifyToken(request)

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    return user
  }
}
