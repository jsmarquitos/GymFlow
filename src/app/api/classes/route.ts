import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Interface for ClassSchedule based on the schema
interface ClassSchedule {
  id: string;
  class_name: string;
  description?: string | null;
  instructor_user_id: string;
  instructor_name?: string; // Added for GET response
  start_time: string; // Should be ISO 8601 format
  end_time: string;   // Should be ISO 8601 format
  location?: string | null;
  max_capacity: number;
  current_capacity: number;
  difficulty_level?: string | null;
  equipment_needed?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface for POST request body, omitting generated fields like id, current_capacity
interface ClassScheduleInput {
  class_name: string;
  description?: string;
  instructor_user_id: string;
  start_time: string; // Expect ISO 8601 format
  end_time: string;   // Expect ISO 8601 format
  location?: string;
  max_capacity: number;
  difficulty_level?: string;
  equipment_needed?: string;
}

// Helper function to verify JWT and get user details (simplified for direct use)
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
      errorResponse: NextResponse.json(
        { message: 'Server configuration error.' },
        { status: 500 }
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as UserFromToken;
    if (!decoded || !decoded.userId || !decoded.role) {
      return {
        errorResponse: NextResponse.json(
          { message: 'Invalid token payload.' },
          { status: 401 }
        ),
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
      return {
        errorResponse: NextResponse.json({ message: `Invalid token: ${error.message}` }, { status: 401 }),
      };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { errorResponse: NextResponse.json({ message: 'Token expired.' }, { status: 401 }) };
    }
    console.error('Token verification error:', error);
    return {
      errorResponse: NextResponse.json({ message: 'Failed to verify token.' }, { status: 500 }),
    };
  }
}


// GET /api/classes - Fetch all class schedules
export async function GET(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req); // All authenticated users can view
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }
  // If authResult.user is undefined here, it means no specific roles were required, just a valid token.
  // Which is fine for this GET request.

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT 
        cs.id, 
        cs.class_name, 
        cs.description, 
        cs.instructor_user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
        cs.start_time, 
        cs.end_time, 
        cs.location, 
        cs.max_capacity, 
        cs.current_capacity,
        cs.difficulty_level, 
        cs.equipment_needed,
        cs.created_at,
        cs.updated_at
      FROM ClassSchedules cs
      JOIN Users u ON cs.instructor_user_id = u.id
      ORDER BY cs.start_time ASC;
    `;
    const [rows] = (await connection.execute(query)) as RowDataPacket[][];
    return NextResponse.json(rows as ClassSchedule[], { status: 200 });
  } catch (error) {
    console.error('Error fetching class schedules:', error);
    return NextResponse.json(
      { message: 'Failed to fetch class schedules.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// POST /api/classes - Create a new class schedule
export async function POST(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin']); // Only admin can create
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }
  if (!authResult.user) { // Should be handled by errorResponse, but for type safety
      return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });
  }

  let connection;
  try {
    const body = (await req.json()) as ClassScheduleInput;

    // Input Validation
    const {
      class_name,
      instructor_user_id,
      start_time,
      end_time,
      max_capacity,
      description,
      location,
      difficulty_level,
      equipment_needed,
    } = body;

    if (!class_name || !instructor_user_id || !start_time || !end_time || !max_capacity) {
      return NextResponse.json(
        { message: 'Missing required fields: class_name, instructor_user_id, start_time, end_time, max_capacity.' },
        { status: 400 }
      );
    }

    if (typeof max_capacity !== 'number' || max_capacity <= 0) {
        return NextResponse.json({ message: 'max_capacity must be a positive number.' }, { status: 400 });
    }
    
    // Validate ISO8601 datetime format for start_time and end_time
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (!iso8601Regex.test(start_time) || !iso8601Regex.test(end_time)) {
        return NextResponse.json({ message: 'start_time and end_time must be in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ssZ).' }, { status: 400 });
    }

    const startTimeDate = new Date(start_time);
    const endTimeDate = new Date(end_time);
    if (startTimeDate >= endTimeDate) {
        return NextResponse.json({ message: 'start_time must be before end_time.' }, { status: 400 });
    }


    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify instructor_user_id exists and is an instructor
    const [instructors] = (await connection.execute(
      'SELECT id, role FROM Users WHERE id = ? AND role = ?',
      [instructor_user_id, 'instructor']
    )) as RowDataPacket[][];

    if (instructors.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: 'Instructor not found or user is not an instructor.' },
        { status: 400 } // Or 404 if preferred for "not found"
      );
    }

    const newClassId = uuidv4();
    const current_capacity = max_capacity; // Set available slots to total slots

    const newClassSchedule: Omit<ClassSchedule, 'instructor_name' | 'created_at' | 'updated_at'> = {
      id: newClassId,
      class_name,
      description: description || null,
      instructor_user_id,
      start_time,
      end_time,
      location: location || null,
      max_capacity,
      current_capacity,
      difficulty_level: difficulty_level || null,
      equipment_needed: equipment_needed || null,
    };

    const insertQuery = `
      INSERT INTO ClassSchedules (
        id, class_name, description, instructor_user_id, start_time, end_time, 
        location, max_capacity, current_capacity, difficulty_level, equipment_needed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(insertQuery, [
      newClassSchedule.id,
      newClassSchedule.class_name,
      newClassSchedule.description,
      newClassSchedule.instructor_user_id,
      newClassSchedule.start_time,
      newClassSchedule.end_time,
      newClassSchedule.location,
      newClassSchedule.max_capacity,
      newClassSchedule.current_capacity,
      newClassSchedule.difficulty_level,
      newClassSchedule.equipment_needed,
    ]);

    await connection.commit();

    // Fetch the newly created class with instructor name for the response
    const [createdClassRows] = (await connection.execute(
        `SELECT cs.*, CONCAT(u.first_name, ' ', u.last_name) AS instructor_name 
         FROM ClassSchedules cs 
         JOIN Users u ON cs.instructor_user_id = u.id 
         WHERE cs.id = ?`,
        [newClassId]
    )) as RowDataPacket[][];


    return NextResponse.json(createdClassRows[0] as ClassSchedule, { status: 201 });

  } catch (error) {
    if (connection) await connection.rollback(); // Rollback on any error during transaction
    console.error('Error creating class schedule:', error);
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Failed to create class schedule.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
