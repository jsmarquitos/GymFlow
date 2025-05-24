import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: bookingId } = params;
  if (!bookingId) {
    return NextResponse.json({ message: 'Booking ID is required.' }, { status: 400 });
  }

  const { userId, role } = token;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch the booking
    const [bookingRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, member_user_id, class_schedule_id, status FROM Bookings WHERE id = ?',
      [bookingId]
    );

    if (bookingRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
    }
    const booking = bookingRows[0];

    // 2. Authorize Deletion
    if (role !== 'admin' && booking.member_user_id !== userId) {
      await connection.rollback();
      return NextResponse.json({ message: 'Forbidden: You do not have permission to cancel this booking.' }, { status: 403 });
    }

    // 3. Check if already cancelled
    if (booking.status === 'cancelled') {
      await connection.rollback();
      return NextResponse.json({ message: 'Booking is already cancelled.' }, { status: 400 }); // Or 409 Conflict
    }

    // 4. Fetch associated ClassSchedules record and lock it
    const [classRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, start_time, current_capacity FROM ClassSchedules WHERE id = ? FOR UPDATE',
      [booking.class_schedule_id]
    );

    if (classRows.length === 0) {
      // This case should be rare if booking exists, implies data inconsistency
      await connection.rollback();
      return NextResponse.json({ message: 'Associated class schedule not found.' }, { status: 500 });
    }
    const classSchedule = classRows[0];

    // 5. Check if class start_time is in the past
    const classStartTime = new Date(classSchedule.start_time);
    if (classStartTime < new Date()) {
      await connection.rollback();
      return NextResponse.json({ message: 'Cannot cancel a booking for a class that has already started or is in the past.' }, { status: 400 });
    }

    // 6. Update booking status to 'cancelled'
    await connection.execute<OkPacket>(
      'UPDATE Bookings SET status = ? WHERE id = ?',
      ['cancelled', bookingId]
    );

    // 7. Decrement current_capacity if original status was 'confirmed' (and class not in past)
    if (booking.status === 'confirmed') {
      const newCapacity = Math.max(0, classSchedule.current_capacity - 1); // Ensure capacity doesn't go below 0
      await connection.execute<OkPacket>(
        'UPDATE ClassSchedules SET current_capacity = ? WHERE id = ?',
        [newCapacity, booking.class_schedule_id]
      );
    }

    await connection.commit();

    return NextResponse.json({ message: 'Booking cancelled successfully.' }, { status: 200 });
    // Alternatively, return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error cancelling booking ${bookingId}:`, error);
    return NextResponse.json({ message: `Failed to cancel booking ${bookingId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
