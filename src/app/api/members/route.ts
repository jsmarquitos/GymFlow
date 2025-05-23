import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Type for GET response (AdminMember)
interface AdminMember {
  user_id: string; // Users.id
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_picture_url?: string | null;
  join_date?: string | null; // Members.membership_start_date
  status?: string; // Members.status (assuming this field exists or is derived)
  subscription_plan_id?: string | null;
  subscription_plan_name?: string | null; // SubscriptionPlans.name
  // Other member-specific fields from Members table can be added if needed
  member_record_id: string; // Members.id
}

// Interface for POST request body
interface CreateMemberInput {
  email: string;
  password_hash: string; // Hashed password
  first_name: string;
  last_name: string;
  profile_picture_url?: string; // For Users table
  // Member-specific fields
  membership_start_date?: string; // YYYY-MM-DD, maps to joinDate
  status?: 'active' | 'inactive' | 'suspended'; // Assuming these are the possible values
  subscription_plan_id?: string;
  // Other fields from Members table like date_of_birth, address etc. can be added
  date_of_birth?: string; // YYYY-MM-DD
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  health_conditions?: string;
  fitness_goals?: string;
  membership_end_date?: string; // YYYY-MM-DD
}


// Helper function to verify JWT and get user details
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
      errorResponse: NextResponse.json({ message: 'Server configuration error.' }, { status: 500 }),
    };
  }
  try {
    const decoded = jwt.verify(token, jwtSecret) as UserFromToken;
    if (!decoded || !decoded.userId || !decoded.role) {
      return {
        errorResponse: NextResponse.json({ message: 'Invalid token payload.' }, { status: 401 }),
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
      return { errorResponse: NextResponse.json({ message: `Invalid token: ${error.message}` }, { status: 401 }) };
    } if (error instanceof jwt.TokenExpiredError) {
      return { errorResponse: NextResponse.json({ message: 'Token expired.' }, { status: 401 }) };
    }
    console.error('Token verification error:', error);
    return { errorResponse: NextResponse.json({ message: 'Failed to verify token.' }, { status: 500 }) };
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// GET /api/members - Fetch all members (Admin Only)
export async function GET(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;

  let connection;
  try {
    connection = await pool.getConnection();
    // Note: Members.status is not in the current schema.sql.
    // I will select a placeholder for it or assume it exists for the purpose of this API.
    // For now, I'll add it to the SELECT query as if it exists.
    // The schema provided for Members has: id, user_id, subscription_plan_id, date_of_birth, address,
    // emergency_contact_name, emergency_contact_phone, health_conditions, fitness_goals,
    // membership_start_date, membership_end_date.
    // I will use membership_start_date as join_date.
    // `status` is a requested field for AdminMember type, so I'll add it to the query.
    // If it doesn't exist, the query might fail or return null.
    // Let's assume 'active' as a default if the field is missing, for demonstration.
    const query = `
      SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_picture_url,
        m.id as member_record_id,
        m.membership_start_date AS join_date,
        -- m.status, -- Assuming 'status' field exists in Members table
        -- If status doesn't exist, we might derive it or return a default:
        CASE 
            WHEN m.membership_end_date IS NOT NULL AND m.membership_end_date < CURDATE() THEN 'inactive'
            ELSE 'active' -- Default or derive based on other fields if 'status' column is absent
        END AS status,
        m.subscription_plan_id,
        sp.name AS subscription_plan_name
      FROM Users u
      JOIN Members m ON u.id = m.user_id
      LEFT JOIN SubscriptionPlans sp ON m.subscription_plan_id = sp.id
      WHERE u.role = 'member'
      ORDER BY u.last_name, u.first_name;
    `;
    const [rows] = (await connection.execute(query)) as RowDataPacket[][];
    return NextResponse.json(rows as AdminMember[], { status: 200 });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ message: 'Failed to fetch members.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST /api/members - Create a new member (Admin Only)
export async function POST(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  let connection;
  try {
    const { 
        email, password, firstName, lastName, profilePictureUrl, // User fields
        joinDate, status, subscriptionPlanId, // Member fields from prompt
        // Additional fields from schema for Members
        date_of_birth, address, emergency_contact_name, emergency_contact_phone,
        health_conditions, fitness_goals, membership_end_date
    } = await req.json();

    // Input Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields: email, password, firstName, lastName.' },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ message: 'Invalid email format.' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (joinDate && !DATE_REGEX.test(joinDate)) {
        return NextResponse.json({ message: 'Invalid joinDate format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    if (date_of_birth && !DATE_REGEX.test(date_of_birth)) {
        return NextResponse.json({ message: 'Invalid date_of_birth format. Use YYYY-MM-DD.' }, { status: 400 });
    }
     if (membership_end_date && !DATE_REGEX.test(membership_end_date)) {
        return NextResponse.json({ message: 'Invalid membership_end_date format. Use YYYY-MM-DD.' }, { status: 400 });
    }


    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for existing email
    const [existingUsers] = (await connection.execute(
      'SELECT id FROM Users WHERE email = ?', [email]
    )) as RowDataPacket[][];
    if (existingUsers.length > 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
    }

    // Verify subscription_plan_id if provided
    if (subscriptionPlanId) {
        const [plans] = await connection.execute('SELECT id FROM SubscriptionPlans WHERE id = ?', [subscriptionPlanId]) as RowDataPacket[][];
        if (plans.length === 0) {
            await connection.rollback();
            return NextResponse.json({ message: 'Invalid subscription_plan_id.' }, { status: 400 });
        }
    }

    // Create User
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUserId = uuidv4();
    const userRole = 'member';

    const userInsertQuery = `
      INSERT INTO Users (id, email, password_hash, role, first_name, last_name, profile_picture_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(userInsertQuery, [
      newUserId, email, hashedPassword, userRole, firstName, lastName, profilePictureUrl || null
    ]);

    // Create Member
    const newMemberRecordId = uuidv4();
    // Use joinDate for membership_start_date, default to NOW() if not provided
    const finalMembershipStartDate = joinDate ? joinDate : new Date().toISOString().split('T')[0];
    // The 'status' field is not in schema.sql. I will omit it from insert.
    // If it were, it would be: status || 'active'

    const memberInsertQuery = `
      INSERT INTO Members (id, user_id, subscription_plan_id, membership_start_date, 
                           date_of_birth, address, emergency_contact_name, emergency_contact_phone,
                           health_conditions, fitness_goals, membership_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(memberInsertQuery, [
      newMemberRecordId, newUserId, subscriptionPlanId || null, finalMembershipStartDate,
      date_of_birth || null, address || null, emergency_contact_name || null, emergency_contact_phone || null,
      health_conditions || null, fitness_goals || null, membership_end_date || null
    ]);

    await connection.commit();

    // Fetch the newly created member data for response
    const [newMemberData] = (await connection.execute(
        `SELECT
            u.id AS user_id, u.first_name, u.last_name, u.email, u.profile_picture_url,
            m.id as member_record_id,
            m.membership_start_date AS join_date,
            CASE 
                WHEN m.membership_end_date IS NOT NULL AND m.membership_end_date < CURDATE() THEN 'inactive'
                ELSE 'active'
            END AS status,
            m.subscription_plan_id, sp.name AS subscription_plan_name
         FROM Users u
         JOIN Members m ON u.id = m.user_id
         LEFT JOIN SubscriptionPlans sp ON m.subscription_plan_id = sp.id
         WHERE u.id = ?`,
        [newUserId]
    )) as RowDataPacket[][];

    return NextResponse.json(newMemberData[0] as AdminMember, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error creating member:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create member.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
