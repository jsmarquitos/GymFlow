import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for POST request body
interface BookingInput {
  class_schedule_id: string;
  notes?: string | null;
}

// Interface for the response after creating a booking
interface BookingDetails {
  id: string; // Booking ID
  member_user_id: string;
  class_schedule_id: string;
  booking_time: string; // ISO 8601 format
  status: 'confirmed' | 'cancelled' | 'waitlisted'; // From ENUM
  notes?: string | null;
  // Class details
  class_name?: string;
  class_start_time?: string; // ISO 8601 format
  instructor_name?: string;
  // Member details (for admin view)
  member_name?: string; 
}

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string | null | undefined => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts;
    if (ts === null || ts === undefined) return ts;
    return String(ts);
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'member') {
    return NextResponse.json({ message: 'Forbidden: Only members can create bookings.' }, { status: 403 });
  }

  const member_user_id = token.userId as string;

  let connection;
  try {
    const body = (await req.json()) as BookingInput;
    const { class_schedule_id, notes } = body;

    if (!class_schedule_id) {
      return NextResponse.json({ message: 'class_schedule_id is required.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch the ClassSchedules record and lock it for update
    const [classRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, start_time, current_capacity, max_capacity FROM ClassSchedules WHERE id = ? FOR UPDATE',
      [class_schedule_id]
    );

    if (classRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class schedule not found.' }, { status: 404 });
    }
    const classSchedule = classRows[0];

    // 2. Check if class start_time is in the past
    const classStartTime = new Date(classSchedule.start_time);
    if (classStartTime < new Date()) {
      await connection.rollback();
      return NextResponse.json({ message: 'Cannot book a class that has already started or is in the past.' }, { status: 400 });
    }

    // 3. Check if current_capacity < max_capacity
    if (classSchedule.current_capacity >= classSchedule.max_capacity) {
      await connection.rollback();
      return NextResponse.json({ message: 'Class is full.' }, { status: 409 }); // Conflict
    }

    // 4. Check for double booking by the same member for the same class
    const [existingBookings] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM Bookings WHERE member_user_id = ? AND class_schedule_id = ? AND status != ?',
      [member_user_id, class_schedule_id, 'cancelled'] // Active bookings
    );

    if (existingBookings.length > 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'You are already booked for this class.' }, { status: 409 });
    }

    // 5. Increment current_capacity in ClassSchedules
    const newCapacity = classSchedule.current_capacity + 1;
    await connection.execute<OkPacket>(
      'UPDATE ClassSchedules SET current_capacity = ? WHERE id = ?',
      [newCapacity, class_schedule_id]
    );

    // 6. Insert the new booking
    const newBookingId = uuidv4();
    const booking_time = new Date(); // Current time
    const booking_status = 'confirmed';

    await connection.execute<OkPacket>(
      'INSERT INTO Bookings (id, member_user_id, class_schedule_id, booking_time, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [newBookingId, member_user_id, class_schedule_id, booking_time, booking_status, notes || null]
    );

    await connection.commit();

    // 7. Fetch and return the created booking details
    const [newBookingRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 
         b.id, b.member_user_id, b.class_schedule_id, b.booking_time, b.status, b.notes,
         cs.class_name, cs.start_time AS class_start_time,
         CONCAT(u.first_name, ' ', u.last_name) AS instructor_name
       FROM Bookings b
       JOIN ClassSchedules cs ON b.class_schedule_id = cs.id
       JOIN Users u ON cs.instructor_user_id = u.id
       WHERE b.id = ?`,
      [newBookingId]
    );
    
    if (newBookingRows.length === 0) {
        // This should not happen if insert was successful
        // No need to rollback as commit was successful, but indicates an issue fetching
        return NextResponse.json({ message: 'Booking created but failed to retrieve details.' }, { status: 500 });
    }

    const createdBooking = newBookingRows[0];
    const responseBooking: BookingDetails = {
      id: createdBooking.id,
      member_user_id: createdBooking.member_user_id,
      class_schedule_id: createdBooking.class_schedule_id,
      booking_time: formatTimestamp(createdBooking.booking_time)!,
      status: createdBooking.status,
      notes: createdBooking.notes,
      class_name: createdBooking.class_name,
      class_start_time: formatTimestamp(createdBooking.class_start_time)!,
      instructor_name: createdBooking.instructor_name,
    };

    return NextResponse.json(responseBooking, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error creating booking:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // Specific error for duplicate key on unique constraint (member_user_id, class_schedule_id) if one was added
    // if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("your_unique_constraint_name")) {
    //    return NextResponse.json({ message: 'You are already booked for this class.' }, { status: 409 });
    // }
    return NextResponse.json({ message: 'Failed to create booking.' }, { status: 500 });
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
    let query = '';
    const queryParams: string[] = [];

    if (role === 'member') {
      query = `
        SELECT 
          b.id, b.member_user_id, b.class_schedule_id, b.booking_time, b.status, b.notes,
          cs.class_name, cs.start_time AS class_start_time,
          CONCAT(u_instructor.first_name, ' ', u_instructor.last_name) AS instructor_name
        FROM Bookings b
        JOIN ClassSchedules cs ON b.class_schedule_id = cs.id
        JOIN Users u_instructor ON cs.instructor_user_id = u_instructor.id
        WHERE b.member_user_id = ?
        ORDER BY cs.start_time DESC;
      `;
      queryParams.push(userId as string);
    } else if (role === 'admin') {
      query = `
        SELECT 
          b.id, b.member_user_id, b.class_schedule_id, b.booking_time, b.status, b.notes,
          cs.class_name, cs.start_time AS class_start_time,
          CONCAT(u_instructor.first_name, ' ', u_instructor.last_name) AS instructor_name,
          CONCAT(u_member.first_name, ' ', u_member.last_name) AS member_name
        FROM Bookings b
        JOIN ClassSchedules cs ON b.class_schedule_id = cs.id
        JOIN Users u_instructor ON cs.instructor_user_id = u_instructor.id
        JOIN Users u_member ON b.member_user_id = u_member.id
        ORDER BY b.booking_time DESC;
      `;
      // No queryParams for admin fetching all bookings
    } else {
      // For 'instructor' or any other roles, forbid access
      return NextResponse.json({ message: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
    }

    const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);

    const bookings: BookingDetails[] = rows.map(row => ({
      id: row.id,
      member_user_id: row.member_user_id,
      class_schedule_id: row.class_schedule_id,
      booking_time: formatTimestamp(row.booking_time)!,
      status: row.status,
      notes: row.notes,
      class_name: row.class_name,
      class_start_time: formatTimestamp(row.class_start_time)!,
      instructor_name: row.instructor_name,
      member_name: role === 'admin' ? row.member_name : undefined, // Only include for admin
    }));

    return NextResponse.json(bookings, { status: 200 });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ message: 'Failed to fetch bookings.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
