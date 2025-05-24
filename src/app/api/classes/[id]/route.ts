import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise'; // Added OkPacket

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for ClassSchedule details including instructor_name
interface ClassScheduleDetails {
  id: string;
  class_name: string;
  description?: string | null;
  instructor_user_id: string;
  instructor_name: string; 
  start_time: string; // ISO 8601 format
  end_time: string;   // ISO 8601 format
  location?: string | null;
  max_capacity: number;
  current_capacity: number;
  difficulty_level?: string | null;
  equipment_needed?: string | null;
  created_at?: string; 
  updated_at?: string;
}

// Interface for PUT request body
interface ClassScheduleUpdateInput {
  class_name?: string;
  description?: string | null;
  instructor_user_id?: string;
  start_time?: string; // ISO 8601 format
  end_time?: string;   // ISO 8601 format
  location?: string | null;
  max_capacity?: number;
  difficulty_level?: string | null;
  equipment_needed?: string | null;
  // current_capacity is not directly updatable here
}

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string | null | undefined => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts; // Assume already correct format or let it pass
    if (ts === null || ts === undefined) return ts;
    return String(ts);
};

// Helper function to get full class schedule details by ID
async function getClassScheduleDetailsById(classId: string, connection: any): Promise<ClassScheduleDetails | null> {
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
    WHERE cs.id = ?;
  `;
  const [rows] = await connection.execute<RowDataPacket[]>(query, [classId]);

  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    id: row.id,
    class_name: row.class_name,
    description: row.description,
    instructor_user_id: row.instructor_user_id,
    instructor_name: row.instructor_name,
    start_time: formatTimestamp(row.start_time)!, // Non-null assertion as it's a non-null field
    end_time: formatTimestamp(row.end_time)!,   // Non-null assertion
    location: row.location,
    max_capacity: Number(row.max_capacity),
    current_capacity: Number(row.current_capacity),
    difficulty_level: row.difficulty_level,
    equipment_needed: row.equipment_needed,
    created_at: formatTimestamp(row.created_at)!, // Non-null assertion
    updated_at: formatTimestamp(row.updated_at)!, // Non-null assertion
  };
}


// GET /api/classes/{id} - Fetch a single class schedule by its ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    // "All authenticated users can access this."
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: classId } = params;

  if (!classId) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const classSchedule = await getClassScheduleDetailsById(classId, connection);

    if (!classSchedule) {
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    return NextResponse.json(classSchedule, { status: 200 });
  } catch (error) {
    console.error(`Error fetching class schedule ${classId}:`, error);
    return NextResponse.json({ message: `Failed to fetch class schedule ${classId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT /api/classes/{id} - Update a class schedule
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: classId } = params;
  if (!classId) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch current class to get instructor_user_id for authorization and current_capacity
    const [existingClassRows] = await connection.execute<RowDataPacket[]>(
      'SELECT instructor_user_id, current_capacity, max_capacity FROM ClassSchedules WHERE id = ? FOR UPDATE',
      [classId]
    );

    if (existingClassRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    const currentClass = existingClassRows[0];

    // Authorization: Admin or assigned instructor
    if (token.role !== 'admin' && token.userId !== currentClass.instructor_user_id) {
      await connection.rollback();
      return NextResponse.json({ message: 'Forbidden: You do not have permission to update this class schedule.' }, { status: 403 });
    }

    const body = (await req.json()) as ClassScheduleUpdateInput;
    if (Object.keys(body).length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Request body is empty. No fields to update.' }, { status: 400 });
    }

    const {
      class_name, description, instructor_user_id, start_time, end_time,
      location, max_capacity, difficulty_level, equipment_needed
    } = body;

    // Validation
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (start_time !== undefined && !iso8601Regex.test(start_time)) {
        await connection.rollback();
        return NextResponse.json({ message: 'start_time must be in ISO 8601 format.' }, { status: 400 });
    }
    if (end_time !== undefined && !iso8601Regex.test(end_time)) {
        await connection.rollback();
        return NextResponse.json({ message: 'end_time must be in ISO 8601 format.' }, { status: 400 });
    }
    const effectiveStartTime = start_time || currentClass.start_time;
    const effectiveEndTime = end_time || currentClass.end_time;
    if (new Date(effectiveStartTime) >= new Date(effectiveEndTime)) {
        await connection.rollback();
        return NextResponse.json({ message: 'start_time must be before end_time.' }, { status: 400 });
    }
    if (max_capacity !== undefined) {
        if (typeof max_capacity !== 'number' || max_capacity <= 0) {
            await connection.rollback();
            return NextResponse.json({ message: 'max_capacity must be a positive number.' }, { status: 400 });
        }
        if (max_capacity < currentClass.current_capacity) {
            await connection.rollback();
            return NextResponse.json({ message: `max_capacity cannot be less than current bookings (${currentClass.current_capacity}).` }, { status: 400 });
        }
    }
    if (instructor_user_id !== undefined && instructor_user_id !== currentClass.instructor_user_id) {
      const [instructors] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM Users WHERE id = ? AND role = \'instructor\'',
        [instructor_user_id]
      );
      if (instructors.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'New instructor not found or user is not an instructor.' }, { status: 400 });
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && ['class_name', 'description', 'instructor_user_id', 'start_time', 'end_time', 'location', 'max_capacity', 'difficulty_level', 'equipment_needed'].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    updateValues.push(classId);
    const updateQuery = `UPDATE ClassSchedules SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await connection.execute<OkPacket>(updateQuery, updateValues);
    await connection.commit();

    const updatedSchedule = await getClassScheduleDetailsById(classId, connection);
    return NextResponse.json(updatedSchedule, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating class schedule ${classId}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to update class schedule ${classId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// DELETE /api/classes/{id} - Delete a class schedule
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: classId } = params;
  if (!classId) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT instructor_user_id FROM ClassSchedules WHERE id = ?',
      [classId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    const classToDelete = rows[0];

    if (token.role !== 'admin' && token.userId !== classToDelete.instructor_user_id) {
      await connection.rollback();
      return NextResponse.json({ message: 'Forbidden: You do not have permission to delete this class schedule.' }, { status: 403 });
    }

    // ON DELETE CASCADE for class_schedule_id in Bookings table will handle bookings.
    await connection.execute<OkPacket>('DELETE FROM ClassSchedules WHERE id = ?', [classId]);
    await connection.commit();

    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error deleting class schedule ${classId}:`, error);
    return NextResponse.json({ message: `Failed to delete class schedule ${classId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
