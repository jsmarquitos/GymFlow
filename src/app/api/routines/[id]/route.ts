import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// --- Reused Interfaces from /api/routines/route.ts ---
interface RoutineExerciseInput {
  exercise_name: string;
  description?: string | null;
  sets?: number | null;
  reps?: string | null;
  duration_minutes?: number | null;
  rest_period_seconds?: number | null;
  order_num: number;
  notes?: string | null;
}

interface RoutineDayInput {
  day_name: string;
  order_num: number;
  notes?: string | null;
  exercises: RoutineExerciseInput[];
}

interface RoutineInput { // Used for PUT body
  routine_name: string;
  description?: string | null;
  assigned_to_member_user_id: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  days: RoutineDayInput[];
}

interface RoutineExerciseDetails extends RoutineExerciseInput {
  id: string;
  routine_day_id: string;
}

interface RoutineDayDetails extends Omit<RoutineDayInput, 'exercises'> {
  id: string;
  routine_id: string;
  exercises: RoutineExerciseDetails[];
}

interface RoutineDetails { // Used for GET and PUT response
  id: string;
  routine_name: string;
  description?: string | null;
  assigned_to_member_user_id: string;
  assigned_to_member_name?: string;
  assigned_by_instructor_user_id: string;
  assigned_by_instructor_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  days: RoutineDayDetails[];
  created_at: string;
  updated_at: string;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatTimestamp = (ts: any): string => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts;
    return String(ts);
};

// Helper function to get full routine details by ID
async function getRoutineDetailsById(routineId: string, connection: any): Promise<RoutineDetails | null> {
    const [routineData] = await connection.execute<RowDataPacket[]>(
      `SELECT r.*, 
              CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_to_member_name,
              CONCAT(assigner.first_name, ' ', assigner.last_name) AS assigned_by_instructor_name
       FROM Routines r
       JOIN Users assignee ON r.assigned_to_member_user_id = assignee.id
       JOIN Users assigner ON r.assigned_by_instructor_user_id = assigner.id
       WHERE r.id = ?`,
      [routineId]
    );

    if (routineData.length === 0) return null;

    const [daysData] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM RoutineDays WHERE routine_id = ? ORDER BY order_num ASC',
      [routineId]
    );

    const routineDaysDetails: RoutineDayDetails[] = [];
    for (const dayRow of daysData) {
      const [exercisesData] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM RoutineExercises WHERE routine_day_id = ? ORDER BY order_num ASC',
        [dayRow.id]
      );
      routineDaysDetails.push({
        id: dayRow.id,
        routine_id: dayRow.routine_id,
        day_name: dayRow.day_name,
        order_num: dayRow.order_num,
        notes: dayRow.notes,
        exercises: exercisesData.map((ex: any) => ({ ...ex } as RoutineExerciseDetails))
      });
    }
    
    const routine = routineData[0];
    return {
      id: routine.id,
      routine_name: routine.routine_name,
      description: routine.description,
      assigned_to_member_user_id: routine.assigned_to_member_user_id,
      assigned_to_member_name: routine.assigned_to_member_name,
      assigned_by_instructor_user_id: routine.assigned_by_instructor_user_id,
      assigned_by_instructor_name: routine.assigned_by_instructor_name,
      start_date: routine.start_date ? formatTimestamp(routine.start_date) : null,
      end_date: routine.end_date ? formatTimestamp(routine.end_date) : null,
      notes: routine.notes,
      created_at: formatTimestamp(routine.created_at),
      updated_at: formatTimestamp(routine.updated_at),
      days: routineDaysDetails,
    };
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: routineId } = params;
  if (!routineId) {
    return NextResponse.json({ message: 'Routine ID is required.' }, { status: 400 });
  }

  const { userId, role } = token;
  let connection;

  try {
    const body = (await req.json()) as RoutineInput;
    const {
      routine_name, description, assigned_to_member_user_id,
      start_date, end_date, notes, days
    } = body;

    // --- Input Validation (similar to POST) ---
    if (!routine_name || !assigned_to_member_user_id || !days || days.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: routine_name, assigned_to_member_user_id, and at least one day.' }, { status: 400 });
    }
    if (start_date && (!DATE_REGEX.test(start_date) || isNaN(new Date(start_date).getTime()))) {
        return NextResponse.json({ message: 'Invalid start_date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    if (end_date && (!DATE_REGEX.test(end_date) || isNaN(new Date(end_date).getTime()))) {
        return NextResponse.json({ message: 'Invalid end_date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        return NextResponse.json({ message: 'start_date cannot be after end_date.' }, { status: 400 });
    }
    for (const day of days) {
        if (!day.day_name || typeof day.order_num !== 'number' || !day.exercises || day.exercises.length === 0) {
            return NextResponse.json({ message: 'Each day must have a day_name, order_num, and at least one exercise.' }, { status: 400 });
        }
        for (const exercise of day.exercises) {
            if (!exercise.exercise_name || typeof exercise.order_num !== 'number') {
                return NextResponse.json({ message: 'Each exercise must have an exercise_name and order_num.' }, { status: 400 });
            }
        }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // --- Authorization Check ---
    const [existingRoutineRows] = await connection.execute<RowDataPacket[]>(
      'SELECT assigned_by_instructor_user_id FROM Routines WHERE id = ? FOR UPDATE', // Lock row
      [routineId]
    );
    if (existingRoutineRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Routine not found.' }, { status: 404 });
    }
    const existingRoutine = existingRoutineRows[0];
    if (role !== 'admin' && userId !== existingRoutine.assigned_by_instructor_user_id) {
      await connection.rollback();
      return NextResponse.json({ message: 'Forbidden: You do not have permission to update this routine.' }, { status: 403 });
    }

    // Validate new assigned_to_member_user_id
    const [memberRows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM Users WHERE id = ? AND role = 'member'",
      [assigned_to_member_user_id]
    );
    if (memberRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Assigned member not found or user is not a member.' }, { status: 400 });
    }

    // --- Update Main Routine Details ---
    // assigned_by_instructor_user_id is NOT updated
    await connection.execute<OkPacket>(
      `UPDATE Routines SET routine_name = ?, description = ?, assigned_to_member_user_id = ?, 
       start_date = ?, end_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        routine_name, description || null, assigned_to_member_user_id,
        start_date || null, end_date || null, notes || null, routineId
      ]
    );

    // --- Replace Nested Collections ---
    // Delete old days (exercises will cascade delete due to schema ON DELETE CASCADE)
    await connection.execute<OkPacket>('DELETE FROM RoutineDays WHERE routine_id = ?', [routineId]);

    // Insert new days and exercises (similar to POST)
    for (const dayInput of days) {
      const newRoutineDayId = uuidv4();
      await connection.execute<OkPacket>(
        `INSERT INTO RoutineDays (id, routine_id, day_name, order_num, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [newRoutineDayId, routineId, dayInput.day_name, dayInput.order_num, dayInput.notes || null]
      );

      for (const exerciseInput of dayInput.exercises) {
        const newRoutineExerciseId = uuidv4();
        await connection.execute<OkPacket>(
          `INSERT INTO RoutineExercises (id, routine_day_id, exercise_name, description, sets, reps, duration_minutes, rest_period_seconds, order_num, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newRoutineExerciseId, newRoutineDayId, exerciseInput.exercise_name, exerciseInput.description || null,
            exerciseInput.sets || null, exerciseInput.reps || null, exerciseInput.duration_minutes || null,
            exerciseInput.rest_period_seconds || null, exerciseInput.order_num, exerciseInput.notes || null
          ]
        );
      }
    }

    await connection.commit();

    const updatedRoutineDetails = await getRoutineDetailsById(routineId, connection);
    if (!updatedRoutineDetails) {
        // Should not happen if all went well
        return NextResponse.json({ message: 'Failed to retrieve updated routine details.' }, { status: 500 });
    }
    return NextResponse.json(updatedRoutineDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating routine ${routineId}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to update routine ${routineId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: routineId } = params;
  if (!routineId) {
    return NextResponse.json({ message: 'Routine ID is required.' }, { status: 400 });
  }

  const { userId, role } = token;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Fetch the routine to check existence and for authorization
    const [routineRows] = await connection.execute<RowDataPacket[]>(
      'SELECT assigned_by_instructor_user_id FROM Routines WHERE id = ?',
      [routineId]
    );

    if (routineRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Routine not found.' }, { status: 404 });
    }
    const routine = routineRows[0];

    // Authorization check
    if (role !== 'admin' && userId !== routine.assigned_by_instructor_user_id) {
      await connection.rollback();
      return NextResponse.json({ message: 'Forbidden: You do not have permission to delete this routine.' }, { status: 403 });
    }

    // Delete the routine. Cascading deletes will handle RoutineDays and RoutineExercises.
    const [deleteResult] = await connection.execute<OkPacket>(
      'DELETE FROM Routines WHERE id = ?',
      [routineId]
    );

    if (deleteResult.affectedRows === 0) {
      // Should not happen if the existence check passed, but as a safeguard
      await connection.rollback();
      return NextResponse.json({ message: 'Routine not found or already deleted.' }, { status: 404 });
    }

    await connection.commit();

    return new NextResponse(null, { status: 204 }); // No Content success status

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error deleting routine ${routineId}:`, error);
    return NextResponse.json({ message: `Failed to delete routine ${routineId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
