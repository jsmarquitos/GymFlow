import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

interface MemberDetails {
  user_id: string; // From Users.id
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'member'; // Should always be 'member'
  phone_number?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  // Fields from Members table
  subscription_plan_id?: string | null;
  date_of_birth?: string | null; // YYYY-MM-DD
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  health_conditions?: string | null;
  fitness_goals?: string | null;
  membership_start_date?: string | null; // YYYY-MM-DD
  membership_end_date?: string | null; // YYYY-MM-DD
  // Field from SubscriptionPlans table
  subscription_plan_name?: string | null;
}

// GET /api/members - Fetch all members (Admin only)
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    // Using DATE_FORMAT for DATE fields to ensure YYYY-MM-DD
    // Assuming DATETIME/TIMESTAMP fields are returned in a format that JSON.stringify handles well (like ISO 8601)
    // For schema fields like `membership_start_date DATE`, `membership_end_date DATE`, `date_of_birth DATE`
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
        m.subscription_plan_id,
        DATE_FORMAT(m.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        m.address,
        m.emergency_contact_name,
        m.emergency_contact_phone,
        m.health_conditions,
        m.fitness_goals,
        DATE_FORMAT(m.membership_start_date, '%Y-%m-%d') AS membership_start_date,
        DATE_FORMAT(m.membership_end_date, '%Y-%m-%d') AS membership_end_date,
        sp.name AS subscription_plan_name
      FROM Users u
      JOIN Members m ON u.id = m.user_id
      LEFT JOIN SubscriptionPlans sp ON m.subscription_plan_id = sp.id
      WHERE u.role = 'member'
      ORDER BY u.last_name ASC, u.first_name ASC;
    `;
    const [rows] = await connection.execute<RowDataPacket[]>(query);

    const members: MemberDetails[] = rows.map(row => ({
      user_id: row.user_id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role as 'member',
      phone_number: row.phone_number,
      profile_picture_url: row.profile_picture_url,
      bio: row.bio,
      subscription_plan_id: row.subscription_plan_id,
      date_of_birth: row.date_of_birth,
      address: row.address,
      emergency_contact_name: row.emergency_contact_name,
      emergency_contact_phone: row.emergency_contact_phone,
      health_conditions: row.health_conditions,
      fitness_goals: row.fitness_goals,
      membership_start_date: row.membership_start_date,
      membership_end_date: row.membership_end_date,
      subscription_plan_name: row.subscription_plan_name,
    }));

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ message: 'Failed to fetch members.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
