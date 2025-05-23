import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
  instructor_name?: string; // Added for GET/PUT response
  start_time: string; 
  end_time: string;   
  location?: string | null;
  max_capacity: number;
  current_capacity: number; // Number of currently booked slots
  difficulty_level?: string | null;
  equipment_needed?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface for PUT request body (all fields optional for update)
interface ClassScheduleUpdateInput {
  class_name?: string;
  description?: string;
  instructor_user_id?: string;
  start_time?: string; // Expect ISO 8601 format
  end_time?: string;   // Expect ISO 8601 format
  location?: string;
  max_capacity?: number;
  // current_capacity is typically managed by booking/cancellation logic, not direct update here.
  // However, if max_capacity changes, current_capacity might need validation against it.
  difficulty_level?: string;
  equipment_needed?: string;
}

// Helper function to verify JWT and get user details (copied from previous task for direct use)
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

const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// GET /api/classes/[id] - Fetch a class schedule by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateAndAuthorize(req); // All authenticated users can view
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT 
        cs.id, cs.class_name, cs.description, cs.instructor_user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS instructor_name,
        cs.start_time, cs.end_time, cs.location, cs.max_capacity, 
        cs.current_capacity, cs.difficulty_level, cs.equipment_needed,
        cs.created_at, cs.updated_at
      FROM ClassSchedules cs
      JOIN Users u ON cs.instructor_user_id = u.id
      WHERE cs.id = ?;
    `;
    const [rows] = (await connection.execute(query, [id])) as RowDataPacket[][];

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    return NextResponse.json(rows[0] as ClassSchedule, { status: 200 });
  } catch (error) {
    console.error(`Error fetching class schedule ${id}:`, error);
    return NextResponse.json(
      { message: 'Failed to fetch class schedule.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT /api/classes/[id] - Update a class schedule by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateAndAuthorize(req, ['admin']); // Only admin can update
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }
   if (!authResult.user) { 
      return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    const body = (await req.json()) as ClassScheduleUpdateInput;

    // Validate that body is not empty
    if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'Request body cannot be empty for update.' }, { status: 400 });
    }
    
    // Validate specific fields if they are provided
    if (body.start_time && !iso8601Regex.test(body.start_time)) {
        return NextResponse.json({ message: 'start_time must be in ISO 8601 format.' }, { status: 400 });
    }
    if (body.end_time && !iso8601Regex.test(body.end_time)) {
        return NextResponse.json({ message: 'end_time must be in ISO 8601 format.' }, { status: 400 });
    }
    if (body.start_time && body.end_time && new Date(body.start_time) >= new Date(body.end_time)) {
        return NextResponse.json({ message: 'start_time must be before end_time.' }, { status: 400 });
    }
    if (body.max_capacity !== undefined && (typeof body.max_capacity !== 'number' || body.max_capacity <= 0)) {
        return NextResponse.json({ message: 'max_capacity must be a positive number.' }, { status: 400 });
    }


    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if class schedule exists and get current_capacity
    const [existingSchedules] = (await connection.execute(
      'SELECT * FROM ClassSchedules WHERE id = ? FOR UPDATE', // Lock row for update
      [id]
    )) as RowDataPacket[][];

    if (existingSchedules.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    const currentSchedule = existingSchedules[0] as ClassSchedule;

    // If instructor_user_id is being updated, verify the new instructor
    if (body.instructor_user_id && body.instructor_user_id !== currentSchedule.instructor_user_id) {
      const [instructors] = (await connection.execute(
        'SELECT id, role FROM Users WHERE id = ? AND role = ?',
        [body.instructor_user_id, 'instructor']
      )) as RowDataPacket[][];
      if (instructors.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { message: 'New instructor not found or user is not an instructor.' },
          { status: 400 }
        );
      }
    }
    
    // Validate max_capacity against current_capacity (number of booked slots)
    if (body.max_capacity !== undefined && body.max_capacity < currentSchedule.current_capacity) {
        await connection.rollback();
        return NextResponse.json(
            { message: `max_capacity cannot be less than current bookings (${currentSchedule.current_capacity}).` },
            { status: 400 }
        );
    }


    // Construct SET clause for the update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    const allowedFields: (keyof ClassScheduleUpdateInput)[] = [
      'class_name', 'description', 'instructor_user_id', 'start_time', 
      'end_time', 'location', 'max_capacity', 'difficulty_level', 'equipment_needed'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(body[field]);
      }
    });

    if (updateFields.length === 0) {
      await connection.rollback(); // Nothing to update
      return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    updateValues.push(id); // For WHERE id = ?

    const updateQuery = `UPDATE ClassSchedules SET ${updateFields.join(', ')} WHERE id = ?`;
    const [updateResult] = (await connection.execute(updateQuery, updateValues)) as ResultSetHeader[];

    if (updateResult.affectedRows === 0) {
      // Should not happen if existence check passed, but good for safety
      await connection.rollback();
      return NextResponse.json({ message: 'Failed to update class schedule, or no changes made.' }, { status: 404 });
    }

    await connection.commit();

    // Fetch the updated class schedule with instructor name for response
    const [updatedRows] = (await connection.execute(
      `SELECT cs.*, CONCAT(u.first_name, ' ', u.last_name) AS instructor_name 
       FROM ClassSchedules cs
       JOIN Users u ON cs.instructor_user_id = u.id
       WHERE cs.id = ?`,
      [id]
    )) as RowDataPacket[][];
    
    return NextResponse.json(updatedRows[0] as ClassSchedule, { status: 200 });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error updating class schedule ${id}:`, error);
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Failed to update class schedule.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// DELETE /api/classes/[id] - Delete a class schedule by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateAndAuthorize(req, ['admin']); // Only admin can delete
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }
   if (!authResult.user) {
      return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Class ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if the class schedule exists before attempting to delete
    const [existingSchedules] = (await connection.execute(
      'SELECT id, current_capacity FROM ClassSchedules WHERE id = ?',
      [id]
    )) as RowDataPacket[][];

    if (existingSchedules.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    
    // Consideration: Check for existing bookings.
    // For this task, direct delete. In a real app, you might prevent this if current_capacity > 0
    // or handle it via FK constraints (e.g., ON DELETE SET NULL or RESTRICT for bookings).
    // Our current schema for Bookings has ON DELETE CASCADE for class_schedule_id.
    // This means deleting a class will cascade and delete associated bookings.
    // This is a valid approach if that's the desired business logic.

    const [deleteResult] = (await connection.execute(
      'DELETE FROM ClassSchedules WHERE id = ?',
      [id]
    )) as ResultSetHeader[];

    if (deleteResult.affectedRows === 0) {
      // Should not happen if existence check passed
      await connection.rollback();
      return NextResponse.json({ message: 'Failed to delete class schedule.' }, { status: 404 });
    }

    await connection.commit();
    // Return 204 No Content for successful deletion as there's no body.
    // Or 200 OK with a message. 204 is often preferred for DELETE.
    return new NextResponse(null, { status: 204 }); 

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting class schedule ${id}:`, error);
    // If error is due to foreign key constraint (e.g. bookings exist and ON DELETE RESTRICT was used)
    // you might return a 409 Conflict.
    // For now, general 500.
    return NextResponse.json(
      { message: 'Failed to delete class schedule.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
