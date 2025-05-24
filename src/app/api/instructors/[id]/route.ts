import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for combined instructor data (consistent with .../instructors/route.ts)
interface InstructorDetails {
  user_id: string; 
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'instructor';
  phone_number?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  specialization?: string | null;
  years_of_experience?: number | null;
  certification?: string | null;
  availability_schedule?: any | null; // Stored as TEXT, can be JSON
}

// Interface for PUT request body
interface InstructorUpdateInput {
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  specialization?: string | null;
  years_of_experience?: number | null;
  certification?: string | null;
  availability_schedule?: any | null; // Will be stringified
}


// Helper function to fetch full instructor details (used by GET and after PUT)
async function getInstructorDetailsById(userId: string, connection: any): Promise<InstructorDetails | null> {
  const query = `
    SELECT 
      u.id AS user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.phone_number,
      u.profile_picture_url,
      u.bio,
      i.specialization,
      i.years_of_experience,
      i.certification,
      i.availability_schedule
    FROM Users u
    JOIN Instructors i ON u.id = i.user_id
    WHERE u.id = ? AND u.role = 'instructor';
  `;
  const [rows] = await connection.execute<RowDataPacket[]>(query, [userId]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  let availability_schedule = row.availability_schedule;
  if (typeof availability_schedule === 'string') {
    try {
      availability_schedule = JSON.parse(availability_schedule);
    } catch (e) {
      console.warn(`Failed to parse availability_schedule for user ${row.user_id}. Content: "${availability_schedule}". Error:`, e);
    }
  }

  return {
    user_id: row.user_id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role as 'instructor',
    phone_number: row.phone_number,
    profile_picture_url: row.profile_picture_url,
    bio: row.bio,
    specialization: row.specialization,
    years_of_experience: row.years_of_experience,
    certification: row.certification,
    availability_schedule: availability_schedule,
  };
}


// GET /api/instructors/{id} - Fetch a single instructor by user_id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    // "All authenticated users can access this."
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: userId } = params; // The {id} in path is user_id

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const instructor = await getInstructorDetailsById(userId, connection);

    if (!instructor) {
      return NextResponse.json({ message: 'Instructor not found or user is not an instructor.' }, { status: 404 });
    }
    return NextResponse.json(instructor, { status: 200 });
  } catch (error) {
    console.error(`Error fetching instructor ${userId}:`, error);
    return NextResponse.json({ message: `Failed to fetch instructor ${userId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


// PUT /api/instructors/{id} - Update instructor details
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: targetUserId } = params; // ID of the instructor to update

  // Authorization: Admin or self-update
  if (token.role !== 'admin' && token.userId !== targetUserId) {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  let connection;
  try {
    const body = (await req.json()) as InstructorUpdateInput;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body is empty. No fields to update.' }, { status: 400 });
    }

    // Fields for Users table
    const userFields: { [key: string]: any } = {};
    if (body.first_name !== undefined) userFields.first_name = body.first_name;
    if (body.last_name !== undefined) userFields.last_name = body.last_name;
    if (body.phone_number !== undefined) userFields.phone_number = body.phone_number; // Can be null
    if (body.profile_picture_url !== undefined) userFields.profile_picture_url = body.profile_picture_url; // Can be null
    if (body.bio !== undefined) userFields.bio = body.bio; // Can be null

    // Fields for Instructors table
    const instructorFields: { [key: string]: any } = {};
    if (body.specialization !== undefined) instructorFields.specialization = body.specialization; // Can be null
    if (body.years_of_experience !== undefined) {
        if (body.years_of_experience !== null && (typeof body.years_of_experience !== 'number' || body.years_of_experience < 0)) {
            return NextResponse.json({ message: 'Years of experience must be a non-negative number or null.' }, { status: 400 });
        }
        instructorFields.years_of_experience = body.years_of_experience;
    }
    if (body.certification !== undefined) instructorFields.certification = body.certification; // Can be null
    if (body.availability_schedule !== undefined) {
        instructorFields.availability_schedule = body.availability_schedule === null ? null : JSON.stringify(body.availability_schedule);
    }
    
    if (Object.keys(userFields).length === 0 && Object.keys(instructorFields).length === 0) {
        return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if the user exists and is an instructor
    const [existingUserRows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM Users WHERE id = ? AND role = 'instructor' FOR UPDATE",
      [targetUserId]
    );
    if (existingUserRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Instructor not found.' }, { status: 404 });
    }

    let userUpdateOccurred = false;
    if (Object.keys(userFields).length > 0) {
      const userSetClauses = Object.keys(userFields).map(key => `${key} = ?`).join(', ');
      const userValues = Object.values(userFields);
      userValues.push(targetUserId);
      
      const userUpdateQuery = `UPDATE Users SET ${userSetClauses} WHERE id = ?`;
      const [userUpdateResult] = await connection.execute<OkPacket>(userUpdateQuery, userValues);
      if (userUpdateResult.changedRows > 0) userUpdateOccurred = true; // changedRows indicates if values actually changed
    }

    let instructorUpdateOccurred = false;
    if (Object.keys(instructorFields).length > 0) {
      const instructorSetClauses = Object.keys(instructorFields).map(key => `${key} = ?`).join(', ');
      const instructorValues = Object.values(instructorFields);
      instructorValues.push(targetUserId);

      const instructorUpdateQuery = `UPDATE Instructors SET ${instructorSetClauses} WHERE user_id = ?`;
      const [instructorUpdateResult] = await connection.execute<OkPacket>(instructorUpdateQuery, instructorValues);
       if (instructorUpdateResult.changedRows > 0) instructorUpdateOccurred = true;
    }
    
    // MySQL ON UPDATE CURRENT_TIMESTAMP handles updated_at automatically if schema is set up
    // If not, and an update occurred, we might need to touch Users.updated_at manually if no userFields were changed but instructorFields were.
    // However, the schema *does* have ON UPDATE CURRENT_TIMESTAMP for Users.updated_at.
    // For Instructors.updated_at, this is also true.

    await connection.commit();

    const updatedInstructorDetails = await getInstructorDetailsById(targetUserId, connection);
    if (!updatedInstructorDetails) {
        // Should not happen if update was successful and instructor existed
        return NextResponse.json({ message: 'Failed to retrieve updated instructor details.' }, { status: 500 });
    }

    return NextResponse.json(updatedInstructorDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating instructor ${targetUserId}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to update instructor ${targetUserId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
