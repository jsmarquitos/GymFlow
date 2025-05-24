import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise'; // Added OkPacket

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for combined member data (consistent with .../members/route.ts)
interface MemberDetails {
  user_id: string; 
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'member';
  phone_number?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  subscription_plan_id?: string | null;
  date_of_birth?: string | null; 
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  health_conditions?: string | null;
  fitness_goals?: string | null;
  membership_start_date?: string | null;
  membership_end_date?: string | null;
  subscription_plan_name?: string | null;
}

// Interface for PUT request body
interface MemberUpdateInput {
  // Users table fields
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  // Members table fields
  subscription_plan_id?: string | null;
  date_of_birth?: string | null; // Expected 'YYYY-MM-DD'
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  health_conditions?: string | null;
  fitness_goals?: string | null;
  membership_start_date?: string | null; // Expected 'YYYY-MM-DD'
  membership_end_date?: string | null; // Expected 'YYYY-MM-DD'
}

// Helper function to get full member details by user_id
async function getMemberDetailsByUserId(userId: string, connection: any): Promise<MemberDetails | null> {
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
    WHERE u.id = ? AND u.role = 'member';
  `;
  const [rows] = await connection.execute<RowDataPacket[]>(query, [userId]);

  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
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
  };
}

// GET /api/members/{id} - Fetch a single member by user_id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: targetUserId } = params; // The {id} in path is user_id

  if (!targetUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  // Authorization check: Admin can access any, member can access self
  if (token.role !== 'admin' && (token.role !== 'member' || token.userId !== targetUserId)) {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const member = await getMemberDetailsByUserId(targetUserId, connection);

    if (!member) {
      return NextResponse.json({ message: 'Member not found or user is not a member.' }, { status: 404 });
    }
    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.error(`Error fetching member ${targetUserId}:`, error);
    return NextResponse.json({ message: `Failed to fetch member ${targetUserId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT /api/members/{id} - Update member details
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { id: targetUserId } = params;

  // Authorization: Admin or self-update
  if (token.role !== 'admin' && (token.role !== 'member' || token.userId !== targetUserId)) {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  let connection;
  try {
    const body = (await req.json()) as MemberUpdateInput;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body is empty. No fields to update.' }, { status: 400 });
    }
    
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

    // Fields for Users table
    const userFields: { [key: string]: any } = {};
    if (body.first_name !== undefined) userFields.first_name = body.first_name;
    if (body.last_name !== undefined) userFields.last_name = body.last_name;
    if (body.phone_number !== undefined) userFields.phone_number = body.phone_number;
    if (body.profile_picture_url !== undefined) userFields.profile_picture_url = body.profile_picture_url;
    if (body.bio !== undefined) userFields.bio = body.bio;

    // Fields for Members table
    const memberFields: { [key: string]: any } = {};
    if (body.subscription_plan_id !== undefined) memberFields.subscription_plan_id = body.subscription_plan_id;
    if (body.date_of_birth !== undefined) {
        if (body.date_of_birth !== null && !DATE_REGEX.test(body.date_of_birth)) {
            return NextResponse.json({ message: 'Invalid date_of_birth format. Use YYYY-MM-DD or null.' }, { status: 400 });
        }
        memberFields.date_of_birth = body.date_of_birth;
    }
    if (body.address !== undefined) memberFields.address = body.address;
    if (body.emergency_contact_name !== undefined) memberFields.emergency_contact_name = body.emergency_contact_name;
    if (body.emergency_contact_phone !== undefined) memberFields.emergency_contact_phone = body.emergency_contact_phone;
    if (body.health_conditions !== undefined) memberFields.health_conditions = body.health_conditions;
    if (body.fitness_goals !== undefined) memberFields.fitness_goals = body.fitness_goals;
    if (body.membership_start_date !== undefined) {
        if (body.membership_start_date !== null && !DATE_REGEX.test(body.membership_start_date)) {
            return NextResponse.json({ message: 'Invalid membership_start_date format. Use YYYY-MM-DD or null.' }, { status: 400 });
        }
        memberFields.membership_start_date = body.membership_start_date;
    }
    if (body.membership_end_date !== undefined) {
        if (body.membership_end_date !== null && !DATE_REGEX.test(body.membership_end_date)) {
            return NextResponse.json({ message: 'Invalid membership_end_date format. Use YYYY-MM-DD or null.' }, { status: 400 });
        }
        memberFields.membership_end_date = body.membership_end_date;
    }

    if (Object.keys(userFields).length === 0 && Object.keys(memberFields).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if the user exists and is a member
    const [existingUserRows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM Users WHERE id = ? AND role = 'member' FOR UPDATE",
      [targetUserId]
    );
    if (existingUserRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Member not found.' }, { status: 404 });
    }

    // Validate subscription_plan_id if provided
    if (memberFields.subscription_plan_id !== undefined && memberFields.subscription_plan_id !== null) {
      const [planRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM SubscriptionPlans WHERE id = ?',
        [memberFields.subscription_plan_id]
      );
      if (planRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 400 }); // Or 404 for the plan
      }
    }

    if (Object.keys(userFields).length > 0) {
      const userSetClauses = Object.keys(userFields).map(key => `${key} = ?`).join(', ');
      const userValues = [...Object.values(userFields), targetUserId];
      const userUpdateQuery = `UPDATE Users SET ${userSetClauses} WHERE id = ?`;
      await connection.execute<OkPacket>(userUpdateQuery, userValues);
    }

    if (Object.keys(memberFields).length > 0) {
      const memberSetClauses = Object.keys(memberFields).map(key => `${key} = ?`).join(', ');
      const memberValues = [...Object.values(memberFields), targetUserId];
      const memberUpdateQuery = `UPDATE Members SET ${memberSetClauses} WHERE user_id = ?`;
      await connection.execute<OkPacket>(memberUpdateQuery, memberValues);
    }

    await connection.commit();

    const updatedMemberDetails = await getMemberDetailsByUserId(targetUserId, connection);
    if (!updatedMemberDetails) {
      // Should not happen if update was successful
      return NextResponse.json({ message: 'Failed to retrieve updated member details.' }, { status: 500 });
    }
    return NextResponse.json(updatedMemberDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating member ${targetUserId}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: `Failed to update member ${targetUserId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
