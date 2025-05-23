import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Combined Instructor Data for GET/PUT response
interface InstructorDetails {
  user_id: string; // From Users.id
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_picture_url?: string | null;
  bio?: string | null;
  phone_number?: string | null;
  role?: string; // Should always be 'instructor'
  instructor_record_id: string; // From Instructors.id
  specialization?: string | null;
  years_of_experience?: number | null;
  certification?: string | null;
  availability_schedule?: string | null;
  join_date?: string; // From Instructors.created_at
}

// Interface for PUT request body (all fields optional)
interface UpdateInstructorInput {
  // User fields
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  bio?: string;
  phone_number?: string;
  // Instructor fields
  specialization?: string;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/instructors/[userId] - Fetch an instructor by User ID
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorize(req, ['admin', 'instructor', 'member']);
  if (authResult.errorResponse) return authResult.errorResponse;

  const { userId } = params;
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT
        u.id AS user_id, u.first_name, u.last_name, u.email, u.role,
        u.profile_picture_url, u.bio, u.phone_number,
        i.id AS instructor_record_id, i.specialization, i.years_of_experience,
        i.certification, i.availability_schedule, i.created_at AS join_date
      FROM Users u
      JOIN Instructors i ON u.id = i.user_id
      WHERE u.id = ? AND u.role = 'instructor';
    `;
    const [rows] = (await connection.execute(query, [userId])) as RowDataPacket[][];

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Instructor not found or user is not an instructor.' }, { status: 404 });
    }
    return NextResponse.json(rows[0] as InstructorDetails, { status: 200 });
  } catch (error) {
    console.error(`Error fetching instructor ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch instructor.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT /api/instructors/[userId] - Update an instructor by User ID (Admin Only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  const { userId } = params;
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    const body = (await req.json()) as UpdateInstructorInput;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body cannot be empty for update.' }, { status: 400 });
    }

    // Validate email format if provided
    if (body.email && !EMAIL_REGEX.test(body.email)) {
        return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify user exists and is an instructor
    const [existingUsers] = (await connection.execute(
      'SELECT id, email, role FROM Users WHERE id = ? FOR UPDATE', // Lock user row
      [userId]
    )) as RowDataPacket[][];

    if (existingUsers.length === 0 || existingUsers[0].role !== 'instructor') {
      await connection.rollback();
      return NextResponse.json({ message: 'Instructor not found or user is not an instructor.' }, { status: 404 });
    }
    const currentUserData = existingUsers[0];

    // If email is being updated, check for uniqueness
    if (body.email && body.email !== currentUserData.email) {
      const [emailCheck] = (await connection.execute(
        'SELECT id FROM Users WHERE email = ? AND id != ?',
        [body.email, userId]
      )) as RowDataPacket[][];
      if (emailCheck.length > 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'Email is already in use by another user.' }, { status: 409 });
      }
    }

    // Update Users table
    const userUpdateFields: string[] = [];
    const userUpdateValues: any[] = [];
    const allowedUserFields: (keyof UpdateInstructorInput)[] = [
      'email', 'first_name', 'last_name', 'profile_picture_url', 'bio', 'phone_number'
    ];
    allowedUserFields.forEach(field => {
      if (body[field] !== undefined) {
        userUpdateFields.push(`${field} = ?`);
        userUpdateValues.push(body[field]);
      }
    });

    if (userUpdateFields.length > 0) {
      userUpdateValues.push(userId);
      const userUpdateQuery = `UPDATE Users SET ${userUpdateFields.join(', ')} WHERE id = ?`;
      await connection.execute(userUpdateQuery, userUpdateValues);
    }

    // Update Instructors table
    const instructorUpdateFields: string[] = [];
    const instructorUpdateValues: any[] = [];
    const allowedInstructorFields: (keyof UpdateInstructorInput)[] = [
      'specialization', 'years_of_experience', 'certification', 'availability_schedule'
    ];
    allowedInstructorFields.forEach(field => {
      if (body[field] !== undefined) {
        instructorUpdateFields.push(`${field} = ?`);
        instructorUpdateValues.push(body[field]);
      }
    });

    if (instructorUpdateFields.length > 0) {
      instructorUpdateValues.push(userId); // user_id in Instructors table
      const instructorUpdateQuery = `UPDATE Instructors SET ${instructorUpdateFields.join(', ')} WHERE user_id = ?`;
      await connection.execute(instructorUpdateQuery, instructorUpdateValues);
    }
    
    if (userUpdateFields.length === 0 && instructorUpdateFields.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'No valid fields provided for update.'}, { status: 400 });
    }

    await connection.commit();

    // Fetch and return updated instructor details
    const [updatedRows] = (await connection.execute(
      `SELECT
        u.id AS user_id, u.first_name, u.last_name, u.email, u.role,
        u.profile_picture_url, u.bio, u.phone_number,
        i.id AS instructor_record_id, i.specialization, i.years_of_experience,
        i.certification, i.availability_schedule, i.created_at AS join_date
      FROM Users u
      JOIN Instructors i ON u.id = i.user_id
      WHERE u.id = ? AND u.role = 'instructor';`,
      [userId]
    )) as RowDataPacket[][];
    
    return NextResponse.json(updatedRows[0] as InstructorDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating instructor ${userId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json({ message: 'Email already registered by another user.' }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update instructor.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// DELETE /api/instructors/[userId] - Delete an instructor by User ID (Admin Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  const { userId } = params;
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify user exists and is an instructor
    const [users] = (await connection.execute(
      'SELECT role FROM Users WHERE id = ?',
      [userId]
    )) as RowDataPacket[][];

    if (users.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    if (users[0].role !== 'instructor') {
      await connection.rollback();
      return NextResponse.json({ message: 'User is not an instructor. Cannot delete via this endpoint.' }, { status: 403 });
    }

    // Deleting from Users table will cascade to Instructors table
    // due to ON DELETE CASCADE on Instructors.user_id
    const [deleteResult] = (await connection.execute(
      'DELETE FROM Users WHERE id = ?',
      [userId]
    )) as ResultSetHeader[];

    if (deleteResult.affectedRows === 0) {
      // Should not happen if existence check passed
      await connection.rollback();
      return NextResponse.json({ message: 'Failed to delete instructor.' }, { status: 404 });
    }

    await connection.commit();
    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting instructor ${userId}:`, error);
    // Foreign key constraints from other tables (e.g. ClassSchedules.instructor_user_id)
    // might prevent deletion if not handled (e.g. ON DELETE SET NULL or ON DELETE RESTRICT).
    // Our ClassSchedules table has ON DELETE CASCADE for instructor_user_id, so this should also cascade.
    return NextResponse.json({ message: 'Failed to delete instructor.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
