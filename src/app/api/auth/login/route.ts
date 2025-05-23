import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Assuming @/lib points to src/lib
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// Define a type for the user data retrieved from the database
interface UserRecord extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string | null; // Assuming 'name' is stored as 'first_name'
  // Add other fields if necessary, like last_name, profile_picture_url etc.
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Input Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // 2. Retrieve User
      const [users] = (await connection.execute(
        'SELECT id, email, password_hash, role, first_name FROM Users WHERE email = ?',
        [email]
      )) as UserRecord[][];

      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Invalid email or password.' },
          { status: 401 } // Unauthorized
        );
      }

      const user = users[0];

      // 3. Verify Password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Invalid email or password.' },
          { status: 401 } // Unauthorized
        );
      }

      // 4. Generate JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in environment variables.');
        return NextResponse.json(
          { message: 'Server configuration error.' },
          { status: 500 }
        );
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.first_name || '', // Use first_name for name, provide default if null
      };

      const token = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: '24h', // Token expiration time
      });

      // 5. Response
      return NextResponse.json(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.first_name || '',
            role: user.role,
          },
        },
        { status: 200 } // OK
      );
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred during login.' },
      { status: 500 } // Internal Server Error
    );
  }
}
