import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Assuming @/lib points to src/lib
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// Define a type for the user data retrieved from the database
interface UserRecord extends RowDataPacket {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  // Add other fields if needed, e.g., last_name, profile_picture_url
}

// Define a type for the decoded JWT payload
interface DecodedToken extends JwtPayload {
  userId: string;
  // Other fields from the token payload like email, role can also be here
}

export async function GET(req: Request) {
  try {
    // 1. Extract Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization header missing or malformed.' },
        { status: 401 } // Unauthorized
      );
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      return NextResponse.json(
        { message: 'Server configuration error.' },
        { status: 500 } // Internal Server Error
      );
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      // Handle specific JWT errors
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { message: `Invalid token: ${error.message}` },
          { status: 401 } // Unauthorized
        );
      }
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { message: 'Token expired.' },
          { status: 401 } // Unauthorized
        );
      }
      // For other unexpected errors during verification
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Failed to verify token.' },
        { status: 500 }
      );
    }

    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { message: 'Invalid token payload.' },
        { status: 401 } // Unauthorized
      );
    }

    const { userId } = decodedToken;

    // 3. Retrieve User from Database
    let connection;
    try {
      connection = await pool.getConnection();
      const [users] = (await connection.execute(
        'SELECT id, email, role, first_name FROM Users WHERE id = ?',
        [userId]
      )) as UserRecord[][];

      if (users.length === 0) {
        // This case implies a valid token for a user that no longer exists.
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 } // Not Found
        );
      }

      const user = users[0];

      // 4. Response
      return NextResponse.json(
        {
          id: user.id,
          email: user.email,
          name: user.first_name || '', // Use first_name for name, provide default if null
          role: user.role,
          // Include other details as needed, ensuring no sensitive info like password_hash
        },
        { status: 200 } // OK
      );
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Get "me" error:', error);
    // Generic error for any other unhandled exceptions
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 } // Internal Server Error
    );
  }
}
