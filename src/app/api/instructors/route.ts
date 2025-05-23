import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Combined Instructor Data for GET response
interface InstructorDetails {
  user_id: string; // From Users.id
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_picture_url?: string | null; // From Users.profile_picture_url
  bio?: string | null; // From Users.bio
  instructor_record_id: string; // From Instructors.id
  specialization?: string | null;
  years_of_experience?: number | null;
  certification?: string | null;
  availability_schedule?: string | null;
  join_date?: string; // From Instructors.created_at
}

// Interface for POST request body
interface CreateInstructorInput {
  email: string;
  password_hash: string; // Renamed from password for clarity, will be hashed
  first_name: string;
  last_name: string;
  // User-specific optional fields
  profile_picture_url?: string;
  bio?: string;
  phone_number?: string;
  // Instructor-specific fields
  specialization: string;
  years_of_experience?: number;
  certification?: string;
  availability_schedule?: string;
}


// Helper function to verify JWT and get user details
async function authenticateAndAuthorize(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user?: UserFromToken; errorResponse?: NextResponse }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json(
        { message: 'Authorization header missing or malformed.' },
        { status: 401 }
      ),
    };
  }
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined.');
    return {
      errorResponse: NextResponse.json({ message: 'Server configuration error.' }, { status: 500 }),
    };
  }
  try {
    const decoded = jwt.verify(token, jwtSecret) as UserFromToken;
    if (!decoded || !decoded.userId || !decoded.role) {
      return {
        errorResponse: NextResponse.json({ message: 'Invalid token payload.' }, { status: 401 }),
      };
    }
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Forbidden: You do not have permission to perform this action.' },
          { status: 403 }
        ),
      };
    }
    return { user: decoded };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { errorResponse: NextResponse.json({ message: `Invalid token: ${error.message}` }, { status: 401 }) };
    } if (error instanceof jwt.TokenExpiredError) {
      return { errorResponse: NextResponse.json({ message: 'Token expired.' }, { status: 401 }) };
    }
    console.error('Token verification error:', error);
    return { errorResponse: NextResponse.json({ message: 'Failed to verify token.' }, { status: 500 }) };
  }
}

// GET /api/instructors - Fetch all instructors
export async function GET(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin', 'instructor', 'member']); // All authenticated users
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_picture_url,
        u.bio,
        i.id AS instructor_record_id,
        i.specialization,
        i.years_of_experience,
        i.certification,
        i.availability_schedule,
        i.created_at AS join_date 
      FROM Users u
      JOIN Instructors i ON u.id = i.user_id
      WHERE u.role = 'instructor'
      ORDER BY u.last_name, u.first_name;
    `;
    const [rows] = (await connection.execute(query)) as RowDataPacket[][];
    return NextResponse.json(rows as InstructorDetails[], { status: 200 });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json({ message: 'Failed to fetch instructors.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST /api/instructors - Create a new instructor (Admin Only)
export async function POST(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  let connection;
  try {
    // Changed to reflect the names from prompt: email, password, firstName, lastName
    const { 
        email, password, firstName, lastName, 
        profilePictureUrl, bio, phoneNumber, // User fields
        specialization, years_of_experience, certification, availability_schedule // Instructor fields
    } = await req.json();


    // Input Validation
    if (!email || !password || !firstName || !lastName || !specialization) {
      return NextResponse.json(
        { message: 'Missing required fields: email, password, firstName, lastName, specialization.' },
        { status: 400 }
      );
    }
    
    // Basic password strength (e.g., min length)
    if (password.length < 8) {
        return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    // Basic email validation
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }


    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for existing email
    const [existingUsers] = (await connection.execute(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    )) as RowDataPacket[][];

    if (existingUsers.length > 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Email already registered.' }, { status: 409 }); // Conflict
    }

    // Create User
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUserId = uuidv4();
    const userRole = 'instructor';

    const userInsertQuery = `
      INSERT INTO Users (id, email, password_hash, role, first_name, last_name, profile_picture_url, bio, phone_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(userInsertQuery, [
      newUserId, email, hashedPassword, userRole, firstName, lastName, 
      profilePictureUrl || null, bio || null, phoneNumber || null
    ]);

    // Create Instructor
    const newInstructorRecordId = uuidv4();
    // joinDate is Instructors.created_at (handled by DB)

    const instructorInsertQuery = `
      INSERT INTO Instructors (id, user_id, specialization, years_of_experience, certification, availability_schedule)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(instructorInsertQuery, [
      newInstructorRecordId, newUserId, specialization, 
      years_of_experience || null, certification || null, availability_schedule || null
    ]);

    await connection.commit();

    // Fetch the newly created combined instructor data for response
    const [newInstructorData] = (await connection.execute(
        `SELECT
            u.id AS user_id, u.first_name, u.last_name, u.email,
            u.profile_picture_url, u.bio,
            i.id AS instructor_record_id, i.specialization, i.years_of_experience,
            i.certification, i.availability_schedule, i.created_at AS join_date
         FROM Users u
         JOIN Instructors i ON u.id = i.user_id
         WHERE u.id = ?`,
        [newUserId]
    )) as RowDataPacket[][];


    return NextResponse.json(newInstructorData[0] as InstructorDetails, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error creating instructor:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
    }
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create instructor.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
