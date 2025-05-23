import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string; // ID of the authenticated user
  role: string;
  email: string;
}

// Type for GET/PUT response (AdminMember or UserMember view)
interface MemberDetails {
  user_id: string; // Users.id
  first_name: string | null;
  last_name: string | null;
  email: string; // Email cannot be changed by member themselves
  profile_picture_url?: string | null;
  phone_number?: string | null; // From Users table
  role?: string; // Should always be 'member'
  member_record_id: string; // Members.id
  join_date?: string | null; // Members.membership_start_date
  status?: string; // Derived from Members.membership_end_date
  subscription_plan_id?: string | null;
  subscription_plan_name?: string | null; // SubscriptionPlans.name
  date_of_birth?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  health_conditions?: string | null;
  fitness_goals?: string | null;
  membership_end_date?: string | null;
}

// Interface for PUT request body
interface UpdateMemberInput {
  // User fields (admin or self-update with restrictions)
  email?: string; // Admin only
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  phone_number?: string; // From Users table

  // Member fields (admin or self-update with restrictions)
  subscription_plan_id?: string; // Admin only
  membership_start_date?: string; // Admin only (status-related)
  membership_end_date?: string; // Admin only (status-related)
  
  // Fields members can update for themselves & admins can update:
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  health_conditions?: string;
  fitness_goals?: string;
}


// Helper function to verify JWT and get user details
async function authenticateAndAuthorizeMemberAccess(
  req: NextRequest,
  targetUserIdParams: string 
): Promise<{ user?: UserFromToken; errorResponse?: NextResponse; isOwner: boolean; isAdmin: boolean }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json({ message: 'Authorization header missing or malformed.' }, { status: 401 }),
      isOwner: false, isAdmin: false,
    };
  }
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined.');
    return {
      errorResponse: NextResponse.json({ message: 'Server configuration error.' }, { status: 500 }),
      isOwner: false, isAdmin: false,
    };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as UserFromToken;
    if (!decoded || !decoded.userId || !decoded.role) {
      return {
        errorResponse: NextResponse.json({ message: 'Invalid token payload.' }, { status: 401 }),
        isOwner: false, isAdmin: false,
      };
    }
    
    const isAdmin = decoded.role === 'admin';
    const isOwner = decoded.userId === targetUserIdParams;

    if (!isAdmin && !isOwner) {
        return {
            errorResponse: NextResponse.json({ message: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 }),
            isOwner: false, isAdmin: false, user: decoded
        };
    }
    
    return { user: decoded, isOwner, isAdmin };

  } catch (error) {
    let errorResponse: NextResponse;
    if (error instanceof jwt.JsonWebTokenError) {
      errorResponse = NextResponse.json({ message: `Invalid token: ${error.message}` }, { status: 401 });
    } else if (error instanceof jwt.TokenExpiredError) {
      errorResponse = NextResponse.json({ message: 'Token expired.' }, { status: 401 });
    } else {
      console.error('Token verification error:', error);
      errorResponse = NextResponse.json({ message: 'Failed to verify token.' }, { status: 500 });
    }
    return { errorResponse, isOwner: false, isAdmin: false };
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// GET /api/members/[userId] - Fetch a member by User ID
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorizeMemberAccess(req, params.userId);
  if (authResult.errorResponse) return authResult.errorResponse;
  // User is either admin or owner, access granted.

  const { userId } = params; // This is Users.id
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT
        u.id AS user_id, u.first_name, u.last_name, u.email, u.role,
        u.profile_picture_url, u.phone_number,
        m.id AS member_record_id,
        m.membership_start_date AS join_date,
        CASE 
            WHEN m.membership_end_date IS NOT NULL AND m.membership_end_date < CURDATE() THEN 'inactive'
            ELSE 'active'
        END AS status,
        m.subscription_plan_id, sp.name AS subscription_plan_name,
        m.date_of_birth, m.address, m.emergency_contact_name, m.emergency_contact_phone,
        m.health_conditions, m.fitness_goals, m.membership_end_date
      FROM Users u
      JOIN Members m ON u.id = m.user_id
      LEFT JOIN SubscriptionPlans sp ON m.subscription_plan_id = sp.id
      WHERE u.id = ? AND u.role = 'member';
    `;
    const [rows] = (await connection.execute(query, [userId])) as RowDataPacket[][];

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Member not found or user is not a member.' }, { status: 404 });
    }
    return NextResponse.json(rows[0] as MemberDetails, { status: 200 });
  } catch (error) {
    console.error(`Error fetching member ${userId}:`, error);
    return NextResponse.json({ message: 'Failed to fetch member.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT /api/members/[userId] - Update a member by User ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorizeMemberAccess(req, params.userId);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  const { isAdmin, isOwner } = authResult;
  const { userId: targetUserId } = params; // User ID from URL

  let connection;
  try {
    const body = (await req.json()) as UpdateMemberInput;
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body cannot be empty.' }, { status: 400 });
    }

    // Validate formats
    if (body.email && !EMAIL_REGEX.test(body.email)) {
        return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }
    const dateFields: (keyof UpdateMemberInput)[] = ['membership_start_date', 'membership_end_date', 'date_of_birth'];
    for (const field of dateFields) {
        if (body[field] && !DATE_REGEX.test(body[field]!)) {
            return NextResponse.json({ message: `Invalid ${field} format. Use YYYY-MM-DD.` }, { status: 400 });
        }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = (await connection.execute('SELECT id, email, role FROM Users WHERE id = ? FOR UPDATE', [targetUserId])) as RowDataPacket[][];
    if (users.length === 0 || users[0].role !== 'member') {
      await connection.rollback();
      return NextResponse.json({ message: 'Member not found.' }, { status: 404 });
    }
    const currentUserData = users[0];

    // Define allowed fields based on role
    const userUpdateFields: string[] = [];
    const userUpdateValues: any[] = [];
    const memberUpdateFields: string[] = [];
    const memberUpdateValues: any[] = [];

    // Fields members can update for themselves
    const selfUpdatableUserFields: (keyof UpdateMemberInput)[] = ['first_name', 'last_name', 'profile_picture_url', 'phone_number'];
    const selfUpdatableMemberFields: (keyof UpdateMemberInput)[] = ['date_of_birth', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'health_conditions', 'fitness_goals'];

    // Fields admins can update
    const adminUpdatableUserFields: (keyof UpdateMemberInput)[] = [...selfUpdatableUserFields, 'email'];
    const adminUpdatableMemberFields: (keyof UpdateMemberInput)[] = [...selfUpdatableMemberFields, 'subscription_plan_id', 'membership_start_date', 'membership_end_date'];

    const allowedUserFields = isAdmin ? adminUpdatableUserFields : selfUpdatableUserFields;
    const allowedMemberFields = isAdmin ? adminUpdatableMemberFields : selfUpdatableMemberFields;

    allowedUserFields.forEach(field => {
      if (body[field] !== undefined) {
        // Email specific checks (admin only)
        if (field === 'email') {
            if (!isAdmin) { /* skip if not admin, this should not happen if logic is correct */ return; }
            if (body.email && body.email !== currentUserData.email) {
                // This check will be done more robustly later
            } else if (!body.email) { // prevent setting email to empty
                /* skip */ return;
            }
        }
        userUpdateFields.push(`${field} = ?`);
        userUpdateValues.push(body[field]);
      }
    });

    allowedMemberFields.forEach(field => {
      if (body[field] !== undefined) {
        // Subscription plan specific checks (admin only)
        if (field === 'subscription_plan_id') {
            if (!isAdmin) { /* skip */ return; }
            // Validity check for subscription_plan_id will be done later
        }
        memberUpdateFields.push(`${field} = ?`);
        memberUpdateValues.push(body[field]);
      }
    });
    
    // Additional Validations for Admin-only fields
    if (isAdmin && body.email && body.email !== currentUserData.email) {
        const [emailCheck] = (await connection.execute('SELECT id FROM Users WHERE email = ? AND id != ?', [body.email, targetUserId])) as RowDataPacket[][];
        if (emailCheck.length > 0) {
            await connection.rollback();
            return NextResponse.json({ message: 'Email is already in use by another user.' }, { status: 409 });
        }
    }
    if (isAdmin && body.subscription_plan_id) {
        const [plans] = await connection.execute('SELECT id FROM SubscriptionPlans WHERE id = ?', [body.subscription_plan_id]) as RowDataPacket[][];
        if (plans.length === 0) {
            await connection.rollback();
            return NextResponse.json({ message: 'Invalid subscription_plan_id.' }, { status: 400 });
        }
    }


    if (userUpdateFields.length > 0) {
      userUpdateValues.push(targetUserId);
      await connection.execute(`UPDATE Users SET ${userUpdateFields.join(', ')} WHERE id = ?`, userUpdateValues);
    }
    if (memberUpdateFields.length > 0) {
      memberUpdateValues.push(targetUserId); // user_id in Members table
      await connection.execute(`UPDATE Members SET ${memberUpdateFields.join(', ')} WHERE user_id = ?`, memberUpdateValues);
    }

    if (userUpdateFields.length === 0 && memberUpdateFields.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'No valid or permitted fields provided for update.' }, { status: 400 });
    }

    await connection.commit();

    const [updatedRows] = (await connection.execute(
        `SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.role,
                u.profile_picture_url, u.phone_number,
                m.id AS member_record_id, m.membership_start_date AS join_date,
                CASE WHEN m.membership_end_date IS NOT NULL AND m.membership_end_date < CURDATE() THEN 'inactive' ELSE 'active' END AS status,
                m.subscription_plan_id, sp.name AS subscription_plan_name,
                m.date_of_birth, m.address, m.emergency_contact_name, m.emergency_contact_phone,
                m.health_conditions, m.fitness_goals, m.membership_end_date
         FROM Users u JOIN Members m ON u.id = m.user_id LEFT JOIN SubscriptionPlans sp ON m.subscription_plan_id = sp.id
         WHERE u.id = ? AND u.role = 'member';`,
        [targetUserId]
    )) as RowDataPacket[][];

    return NextResponse.json(updatedRows[0] as MemberDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating member ${targetUserId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json({ message: 'Email already registered by another user.' }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update member.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// DELETE /api/members/[userId] - Delete a member by User ID (Admin Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await authenticateAndAuthorizeMemberAccess(req, params.userId);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.isAdmin) { // Explicitly check if the authenticated user is an admin
    return NextResponse.json({ message: 'Forbidden: Only admins can delete members.' }, { status: 403 });
  }
  // If we reach here, user is an admin and token is valid.

  const { userId: targetUserId } = params;
  if (!targetUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = (await connection.execute('SELECT role FROM Users WHERE id = ?', [targetUserId])) as RowDataPacket[][];
    if (users.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    if (users[0].role !== 'member') {
      await connection.rollback();
      return NextResponse.json({ message: 'User is not a member. Cannot delete via this endpoint.' }, { status: 403 });
    }

    // ON DELETE CASCADE in schema.sql for Members.user_id, Bookings.member_user_id,
    // Payments.member_user_id, Routines.assigned_to_member_user_id will handle related deletions.
    const [deleteResult] = (await connection.execute('DELETE FROM Users WHERE id = ?', [targetUserId])) as ResultSetHeader[];

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Failed to delete member.' }, { status: 404 }); // Or 500
    }

    await connection.commit();
    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting member ${targetUserId}:`, error);
    return NextResponse.json({ message: 'Failed to delete member.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
