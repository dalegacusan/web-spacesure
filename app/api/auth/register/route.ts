import { db } from '@/lib/database';
import { UserRole } from '@/lib/enums/roles.enum';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      role = UserRole.DRIVER,
    } = await request.json();

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return Response.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await db
      .users()
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

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
      .select('user_id, email, first_name, last_name, role')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return Response.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return Response.json({
      message: 'User registered successfully',
      data: { user: newUser },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
