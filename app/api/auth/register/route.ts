import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmailOrUsername, createUser } from '@/lib/mongodb';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  user_type: z.number().int().min(1).max(2), // 1 = Buyer, 2 = Seller
  country_id: z.number().optional(),
  service_city: z.string().optional(),
  service_area: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email or username already exists via MongoDB
    const existingByEmail = await getUserByEmailOrUsername(validatedData.email);
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    const existingByUsername = await getUserByEmailOrUsername(validatedData.username);
    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user in MongoDB with local file fallback
    const newUser = await createUser({
      name: validatedData.name,
      username: validatedData.username,
      email: validatedData.email,
      phone: validatedData.phone || '+234 800 000 0000',
      password: hashedPassword,
      user_type: validatedData.user_type, // 1 = Buyer, 2 = Seller
      user_status: 1,
      service_city: validatedData.service_city || 'Lagos',
      country: 'Nigeria',
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now log in.',
      userId: String(newUser.id),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
