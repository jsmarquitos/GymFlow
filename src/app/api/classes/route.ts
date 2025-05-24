import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt'; // Added
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise'; // Used /promise

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET; // Added

// Interface for ClassSchedule based on the schema
// This interface is also used for the response of GET and POST
interface ClassSchedule {
  id: string;
  class_name: string;
  description?: string | null;
  instructor_user_id: string;
  instructor_name: string; // For GET response, ensure this is always populated
  start_time: string; // ISO 8601 format
  end_time: string;   // ISO 8601 format
  location?: string | null;
  max_capacity: number;
  current_capacity: number;
  difficulty_level?: string | null;
  equipment_needed?: string | null;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

// Interface for POST request body, omitting generated fields like id, current_capacity, instructor_name
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

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts; // Assume already correct format or let it pass
    if (ts === null || ts === undefined) return ts;
    return String(ts);
};

// GET /api/classes - Fetch all class schedules
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  // All authenticated users can view, so no role check needed here.

  let connection;
  try {
    connection = await pool.getConnection();
    // Ensure RowDataPacket from mysql2/promise is used if execute returns it
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
    const [rows] = await connection.execute<RowDataPacket[]>(query);
    
    const schedules: ClassSchedule[] = rows.map(row => ({
      id: row.id,
      class_name: row.class_name,
      description: row.description,
      instructor_user_id: row.instructor_user_id,
      instructor_name: row.instructor_name,
      start_time: formatTimestamp(row.start_time),
      end_time: formatTimestamp(row.end_time),
      location: row.location,
      max_capacity: Number(row.max_capacity),
      current_capacity: Number(row.current_capacity),
      difficulty_level: row.difficulty_level,
      equipment_needed: row.equipment_needed,
      created_at: formatTimestamp(row.created_at),
      updated_at: formatTimestamp(row.updated_at),
    }));

    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    console.error('Error fetching class schedules:', error);
    // Ensure OkPacket and ResultSetHeader are imported from 'mysql2/promise' if used elsewhere
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
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
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
    // current_capacity should be initialized based on how bookings are handled.
    // If new classes start empty, it's 0. If max_capacity means available spots, it's max_capacity.
    // The schema implies current_capacity is "Number of currently booked members", so for a new class it's 0.
    const initial_current_capacity = 0;


    // The object for insertion does not need instructor_name, created_at, updated_at
    const newClassScheduleData = {
      id: newClassId,
      class_name,
      description: description || null,
      instructor_user_id,
      start_time,
      end_time,
      location: location || null,
      max_capacity,
      current_capacity: initial_current_capacity, // Use initialized value
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
      newClassScheduleData.id,
      newClassScheduleData.class_name,
      newClassScheduleData.description,
      newClassScheduleData.instructor_user_id,
      newClassScheduleData.start_time,
      newClassScheduleData.end_time,
      newClassScheduleData.location,
      newClassScheduleData.max_capacity,
      newClassScheduleData.current_capacity,
      newClassScheduleData.difficulty_level,
      newClassScheduleData.equipment_needed,
    ]);

    await connection.commit();

    // Fetch the newly created class with instructor name and all fields for the response
    const [createdClassRows] = await connection.execute<RowDataPacket[]>(
        `SELECT cs.id, cs.class_name, cs.description, cs.instructor_user_id,
                CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
                cs.start_time, cs.end_time, cs.location, cs.max_capacity,
                cs.current_capacity, cs.difficulty_level, cs.equipment_needed,
                cs.created_at, cs.updated_at
         FROM ClassSchedules cs 
         JOIN Users u ON cs.instructor_user_id = u.id 
         WHERE cs.id = ?`,
        [newClassId]
    );
    
    if (createdClassRows.length === 0) {
        // This should not happen if insert was successful
        return NextResponse.json({ message: 'Failed to retrieve created class schedule.' }, { status: 500 });
    }

    const createdClass = createdClassRows[0];
    const responseSchedule: ClassSchedule = {
        id: createdClass.id,
        class_name: createdClass.class_name,
        description: createdClass.description,
        instructor_user_id: createdClass.instructor_user_id,
        instructor_name: createdClass.instructor_name,
        start_time: formatTimestamp(createdClass.start_time),
        end_time: formatTimestamp(createdClass.end_time),
        location: createdClass.location,
        max_capacity: Number(createdClass.max_capacity),
        current_capacity: Number(createdClass.current_capacity),
        difficulty_level: createdClass.difficulty_level,
        equipment_needed: createdClass.equipment_needed,
        created_at: formatTimestamp(createdClass.created_at),
        updated_at: formatTimestamp(createdClass.updated_at),
    };

    return NextResponse.json(responseSchedule, { status: 201 });

  } catch (error) {
    if (connection) await connection.rollback();
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
