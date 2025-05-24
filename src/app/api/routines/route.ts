import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Input Interfaces
interface RoutineExerciseInput {
  exercise_name: string;
  description?: string | null;
  sets?: number | null;
  reps?: string | null; // e.g., "8-12", "15"
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

interface RoutineInput {
  routine_name: string;
  description?: string | null;
  assigned_to_member_user_id: string;
  start_date?: string | null; // ISO 8601 Date string YYYY-MM-DD
  end_date?: string | null;   // ISO 8601 Date string YYYY-MM-DD
  notes?: string | null;
  days: RoutineDayInput[];
}

// Detail/Response Interfaces (matching schema, including generated fields)
interface RoutineExerciseDetails extends RoutineExerciseInput {
  id: string;
  routine_day_id: string;
  // created_at, updated_at if they exist in schema (not specified, assuming not for now)
}

interface RoutineDayDetails extends Omit<RoutineDayInput, 'exercises'> {
  id: string;
  routine_id: string;
  exercises: RoutineExerciseDetails[];
  // created_at, updated_at if they exist in schema
}

interface RoutineDetails extends Omit<RoutineInput, 'days' | 'assigned_to_member_user_id'> {
  id: string;
  assigned_to_member_user_id: string;
  assigned_to_member_name?: string; // For response
  assigned_by_instructor_user_id: string;
  assigned_by_instructor_name?: string; // For response
  days: RoutineDayDetails[];
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts; // Assume already correct format or let it pass
    return String(ts); // Fallback for other types, though typically Date or string from DB
};


export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin' && token.role !== 'instructor') {
    return NextResponse.json({ message: 'Forbidden: Admin or instructor access required.' }, { status: 403 });
  }
  const assigned_by_instructor_user_id = token.userId as string;

  let connection;
  try {
    const body = (await req.json()) as RoutineInput;
    const {
      routine_name, description, assigned_to_member_user_id,
      start_date, end_date, notes, days
    } = body;

    // --- Input Validation ---
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
    // Further validation for unique order_num per level can be added if needed.

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validate assigned_to_member_user_id
    const [memberRows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM Users WHERE id = ? AND role = 'member'",
      [assigned_to_member_user_id]
    );
    if (memberRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Assigned member not found or user is not a member.' }, { status: 400 });
    }

    // --- Create Routine ---
    const newRoutineId = uuidv4();
    await connection.execute<OkPacket>(
      `INSERT INTO Routines (id, routine_name, description, assigned_to_member_user_id, assigned_by_instructor_user_id, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRoutineId, routine_name, description || null, assigned_to_member_user_id,
        assigned_by_instructor_user_id, start_date || null, end_date || null, notes || null
      ]
    );

    for (const dayInput of days) {
      const newRoutineDayId = uuidv4();
      await connection.execute<OkPacket>(
        `INSERT INTO RoutineDays (id, routine_id, day_name, order_num, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [newRoutineDayId, newRoutineId, dayInput.day_name, dayInput.order_num, dayInput.notes || null]
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

    // --- Fetch and return the created routine ---
    // This part can be complex. For simplicity, we'll fetch step-by-step.
    // A more optimized way might involve complex JOINs or multiple parallel queries.

    const [routineData] = await connection.execute<RowDataPacket[]>(
      `SELECT r.*, 
              CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_to_member_name,
              CONCAT(assigner.first_name, ' ', assigner.last_name) AS assigned_by_instructor_name
       FROM Routines r
       JOIN Users assignee ON r.assigned_to_member_user_id = assignee.id
       JOIN Users assigner ON r.assigned_by_instructor_user_id = assigner.id
       WHERE r.id = ?`,
      [newRoutineId]
    );

    const [daysData] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM RoutineDays WHERE routine_id = ? ORDER BY order_num ASC',
      [newRoutineId]
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
        exercises: exercisesData.map(ex => ({ ...ex } as RoutineExerciseDetails)) // Assuming direct mapping
      });
    }
    
    const createdRoutine: RoutineDetails = {
      id: routineData[0].id,
      routine_name: routineData[0].routine_name,
      description: routineData[0].description,
      assigned_to_member_user_id: routineData[0].assigned_to_member_user_id,
      assigned_to_member_name: routineData[0].assigned_to_member_name,
      assigned_by_instructor_user_id: routineData[0].assigned_by_instructor_user_id,
      assigned_by_instructor_name: routineData[0].assigned_by_instructor_name,
      start_date: routineData[0].start_date ? formatTimestamp(routineData[0].start_date) : null,
      end_date: routineData[0].end_date ? formatTimestamp(routineData[0].end_date) : null,
      notes: routineData[0].notes,
      created_at: formatTimestamp(routineData[0].created_at),
      updated_at: formatTimestamp(routineData[0].updated_at),
      days: routineDaysDetails,
    };

    return NextResponse.json(createdRoutine, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error creating routine:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create routine.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { userId, role } = token;
  let connection;

  try {
    connection = await pool.getConnection();
    let baseRoutineQuery = `
      SELECT 
        r.id, r.routine_name, r.description, r.assigned_to_member_user_id, r.assigned_by_instructor_user_id,
        r.start_date, r.end_date, r.notes AS routine_notes, r.created_at, r.updated_at,
        CONCAT(assignee.first_name, ' ', assignee.last_name) AS assigned_to_member_name,
        CONCAT(assigner.first_name, ' ', assigner.last_name) AS assigned_by_instructor_name
      FROM Routines r
      JOIN Users assignee ON r.assigned_to_member_user_id = assignee.id
      JOIN Users assigner ON r.assigned_by_instructor_user_id = assigner.id
    `;
    const queryParams: string[] = [];

    if (role === 'member') {
      baseRoutineQuery += ' WHERE r.assigned_to_member_user_id = ? ORDER BY r.created_at DESC;';
      queryParams.push(userId as string);
    } else if (role === 'instructor') {
      baseRoutineQuery += ' WHERE r.assigned_by_instructor_user_id = ? ORDER BY r.created_at DESC;';
      queryParams.push(userId as string);
    } else if (role === 'admin') {
      baseRoutineQuery += ' ORDER BY r.created_at DESC;';
      // No params for admin
    } else {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
    }

    const [routinesBaseData] = await connection.execute<RowDataPacket[]>(baseRoutineQuery, queryParams);

    if (routinesBaseData.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const routineIds = routinesBaseData.map(r => r.id);

    // Fetch all days for these routines
    const [daysData] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM RoutineDays WHERE routine_id IN (?) ORDER BY order_num ASC`,
      [routineIds] // mysql2/promise driver handles array to IN clause
    );

    const dayIds = daysData.map(d => d.id);
    let exercisesData: RowDataPacket[] = [];
    if (dayIds.length > 0) {
      [exercisesData] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM RoutineExercises WHERE routine_day_id IN (?) ORDER BY order_num ASC`,
        [dayIds]
      );
    }

    // Map exercises to their day_id
    const exercisesByDayId = new Map<string, RoutineExerciseDetails[]>();
    exercisesData.forEach(ex => {
      const exerciseDetail: RoutineExerciseDetails = {
        id: ex.id,
        routine_day_id: ex.routine_day_id,
        exercise_name: ex.exercise_name,
        description: ex.description,
        sets: ex.sets,
        reps: ex.reps,
        duration_minutes: ex.duration_minutes,
        rest_period_seconds: ex.rest_period_seconds,
        order_num: ex.order_num,
        notes: ex.notes,
      };
      if (!exercisesByDayId.has(ex.routine_day_id)) {
        exercisesByDayId.set(ex.routine_day_id, []);
      }
      exercisesByDayId.get(ex.routine_day_id)!.push(exerciseDetail);
    });

    // Map days to their routine_id
    const daysByRoutineId = new Map<string, RoutineDayDetails[]>();
    daysData.forEach(day => {
      const dayDetail: RoutineDayDetails = {
        id: day.id,
        routine_id: day.routine_id,
        day_name: day.day_name,
        order_num: day.order_num,
        notes: day.notes,
        exercises: exercisesByDayId.get(day.id) || [],
      };
      if (!daysByRoutineId.has(day.routine_id)) {
        daysByRoutineId.set(day.routine_id, []);
      }
      daysByRoutineId.get(day.routine_id)!.push(dayDetail);
    });
    
    // Assemble the final routines
    const routinesDetails: RoutineDetails[] = routinesBaseData.map(routine => ({
      id: routine.id,
      routine_name: routine.routine_name,
      description: routine.description,
      assigned_to_member_user_id: routine.assigned_to_member_user_id,
      assigned_to_member_name: routine.assigned_to_member_name,
      assigned_by_instructor_user_id: routine.assigned_by_instructor_user_id,
      assigned_by_instructor_name: routine.assigned_by_instructor_name,
      start_date: routine.start_date ? formatTimestamp(routine.start_date) : null,
      end_date: routine.end_date ? formatTimestamp(routine.end_date) : null,
      notes: routine.routine_notes, // Alias used in query
      created_at: formatTimestamp(routine.created_at),
      updated_at: formatTimestamp(routine.updated_at),
      days: daysByRoutineId.get(routine.id) || [],
    }));

    return NextResponse.json(routinesDetails, { status: 200 });

  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ message: 'Failed to fetch routines.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
