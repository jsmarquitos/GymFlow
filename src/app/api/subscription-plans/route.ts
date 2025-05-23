import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserFromToken extends JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Interface for SubscriptionPlan based on the schema
interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number; // Stored as DECIMAL, retrieved as number/string
  duration_days: number | null; // e.g., 30 for monthly, 365 for yearly
  features?: string[] | null; // Stored as JSON string in TEXT, retrieved as array
  created_at?: string;
  updated_at?: string;
}

// Interface for POST request body
type DurationType = 'Mensual' | 'Trimestral' | 'Anual' | 'Otro';
interface CreateSubscriptionPlanInput {
  name: string;
  price: number;
  duration: DurationType;
  duration_days_manual?: number; // Required if duration is 'Otro'
  features: string[];
  description?: string;
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

function mapDurationToDays(duration: DurationType, manualDays?: number): number | null {
    switch (duration) {
        case 'Mensual': return 30;
        case 'Trimestral': return 90;
        case 'Anual': return 365;
        case 'Otro': return manualDays !== undefined && manualDays > 0 ? manualDays : null;
        default: return null;
    }
}


// GET /api/subscription-plans - Fetch all subscription plans
export async function GET(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin', 'instructor', 'member']);
  if (authResult.errorResponse) return authResult.errorResponse;

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT id, name, description, price, duration_days, features, created_at, updated_at
      FROM SubscriptionPlans
      ORDER BY price ASC;
    `;
    const [rows] = (await connection.execute(query)) as RowDataPacket[][];
    
    const plans = rows.map(plan => ({
        ...plan,
        price: parseFloat(plan.price as string), // Ensure price is number
        features: plan.features ? JSON.parse(plan.features as string) : [],
    })) as SubscriptionPlan[];

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ message: 'Failed to fetch subscription plans.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST /api/subscription-plans - Create a new subscription plan (Admin Only)
export async function POST(req: NextRequest) {
  const authResult = await authenticateAndAuthorize(req, ['admin']);
  if (authResult.errorResponse) return authResult.errorResponse;
  if (!authResult.user) return NextResponse.json({ message: 'Authentication failed.' }, { status: 401 });

  let connection;
  try {
    const body = (await req.json()) as CreateSubscriptionPlanInput;
    const { name, price, duration, duration_days_manual, features, description } = body;

    // Input Validation
    if (!name || price === undefined || !duration || !features) {
      return NextResponse.json(
        { message: 'Missing required fields: name, price, duration, features.' },
        { status: 400 }
      );
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ message: 'Price must be a positive number.' }, { status: 400 });
    }
    if (!Array.isArray(features)) {
      return NextResponse.json({ message: 'Features must be an array of strings.' }, { status: 400 });
    }
    
    const calculatedDurationDays = mapDurationToDays(duration, duration_days_manual);
    if (duration === 'Otro' && (calculatedDurationDays === null || calculatedDurationDays <=0) ) {
        return NextResponse.json({ message: 'For duration "Otro", a positive duration_days_manual must be provided.' }, { status: 400 });
    }
    if (calculatedDurationDays === null && duration !== 'Otro') { // Should not happen if enum values are correct
        return NextResponse.json({ message: 'Invalid duration type.' }, { status: 400 });
    }


    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for existing name
    const [existingPlans] = (await connection.execute(
      'SELECT id FROM SubscriptionPlans WHERE name = ?', [name]
    )) as RowDataPacket[][];
    if (existingPlans.length > 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Subscription plan name already exists.' }, { status: 409 });
    }

    const newPlanId = uuidv4();
    const featuresJson = JSON.stringify(features);

    const insertQuery = `
      INSERT INTO SubscriptionPlans (id, name, description, price, duration_days, features)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(insertQuery, [
      newPlanId, name, description || null, price, calculatedDurationDays, featuresJson
    ]);

    await connection.commit();

    // Fetch the newly created plan for response (to include auto-generated timestamps)
    const [newPlanData] = (await connection.execute(
      'SELECT * FROM SubscriptionPlans WHERE id = ?', [newPlanId]
    )) as RowDataPacket[][];
    
    const createdPlan = {
        ...newPlanData[0],
        price: parseFloat(newPlanData[0].price as string),
        features: newPlanData[0].features ? JSON.parse(newPlanData[0].features as string) : [],
    } as SubscriptionPlan;

    return NextResponse.json(createdPlan, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error creating subscription plan:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes('Duplicate entry'))) {
      return NextResponse.json({ message: 'Subscription plan name already exists.' }, { status: 409 });
    }
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ message: 'Invalid JSON format in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create subscription plan.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
