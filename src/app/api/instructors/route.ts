import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for combined instructor data
interface InstructorDetails {
  user_id: string; // From Users.id
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

// GET /api/instructors - Fetch all instructors
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    // "All authenticated users can access this."
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
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
      WHERE u.role = 'instructor'
      ORDER BY u.last_name ASC, u.first_name ASC;
    `;
    const [rows] = await connection.execute<RowDataPacket[]>(query);

    const instructors: InstructorDetails[] = rows.map(row => {
      let availability_schedule = row.availability_schedule;
      if (typeof availability_schedule === 'string') {
        try {
          availability_schedule = JSON.parse(availability_schedule);
        } catch (e) {
          console.warn(`Failed to parse availability_schedule for user ${row.user_id}. Content: "${availability_schedule}". Error:`, e);
          // Keep as string or set to a default/null if parsing fails
        }
      }
      return {
        user_id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role as 'instructor', // Should always be 'instructor' due to WHERE clause
        phone_number: row.phone_number,
        profile_picture_url: row.profile_picture_url,
        bio: row.bio,
        specialization: row.specialization,
        years_of_experience: row.years_of_experience,
        certification: row.certification,
        availability_schedule: availability_schedule,
      };
    });

    return NextResponse.json(instructors, { status: 200 });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json({ message: 'Failed to fetch instructors.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
