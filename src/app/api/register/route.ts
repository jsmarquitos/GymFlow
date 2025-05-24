import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

interface UserRegistrationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

const ALLOWED_ROLES = ['admin', 'instructor', 'member'];
const DEFAULT_ROLE = 'member';
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = (await req.json()) as UserRegistrationInput;

    const { email, password, firstName, lastName } = body;
    let { role } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Missing required fields: email, password, firstName, lastName.' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` }, { status: 400 });
    }

    // Validate and set role
    if (role) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ message: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}.` }, { status: 400 });
      }
    } else {
      role = DEFAULT_ROLE;
    }

    connection = await pool.getConnection();

    // Check for existing user
    const [existingUsers] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Generate new user ID
    const newUserId = uuidv4();

    // Insert the new user
    await connection.execute(
      'INSERT INTO Users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, email, hashedPassword, role, firstName, lastName]
    );

    return NextResponse.json({ message: 'User registered successfully', userId: newUserId }, { status: 201 });

  } catch (error) {
    console.error('Error during user registration:', error);
    // Specific error for JSON parsing
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
