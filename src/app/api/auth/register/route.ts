import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Adjust path if necessary, assuming @/lib points to src/lib
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, password }s = await req.json();

    // 1. Input Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!name) {
      // Name is often desired, but the prompt implies email/password are critical
      // Depending on strictness, you might make name mandatory too.
      // For now, we'll proceed if name is missing but log it or handle as optional.
      // Let's assume name is also required for a better UX
      return NextResponse.json(
        { message: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }


    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format.' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // 2. Check for Existing User
      const [existingUsers] = (await connection.execute(
        'SELECT id FROM Users WHERE email = ?',
        [email]
      )) as RowDataPacket[][];

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { message: 'User with this email already exists.' },
          { status: 409 } // 409 Conflict
        );
      }

      // 3. Password Hashing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 4. User Creation
      const userId = uuidv4();
      const userRole = 'member'; // Default role

      const [result] = (await connection.execute(
        'INSERT INTO Users (id, first_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, hashedPassword, userRole]
      )) as any[]; // Using any for result type from execute for simplicity here

      if (result.affectedRows === 1) {
        // 5. Response
        return NextResponse.json(
          {
            id: userId,
            name, // Assuming 'name' is stored in 'first_name' or a similar field
            email,
            role: userRole,
          },
          { status: 201 } // 201 Created
        );
      } else {
        // This case should ideally not be reached if no error was thrown before
        console.error('User insertion failed, affectedRows was not 1.');
        return NextResponse.json(
          { message: 'User registration failed.' },
          { status: 500 }
        );
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Check if the error is a known type, e.g., from bcrypt or database
    // For instance, if (error instanceof SomeSpecificDbError) { ... }
    return NextResponse.json(
      { message: 'An unexpected error occurred during registration.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}
