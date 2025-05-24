import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Interface for POST request body based on schema.sql
interface SubscriptionPlanInput {
  name: string;
  description?: string | null;
  price: number;
  duration_days?: number | null;
  features?: string[] | object | null; // Can be JSON array or object, stored as TEXT
}

// Interface for data from the database and for GET/POST responses
interface SubscriptionPlanDbRow {
  id: string;
  name: string;
  description: string | null;
  price: number; 
  duration_days: number | null;
  features: string[] | object | null; // Parsed from JSON string in DB
  created_at: string;
  updated_at: string;
}

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// GET /api/subscription-plans - Fetch all subscription plans
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    // As per subtask: "All authenticated users can access this."
    // This means if there's no token, they are not authenticated.
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    // Order by name as suggested in subtask
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, name, description, price, duration_days, features, created_at, updated_at FROM SubscriptionPlans ORDER BY name ASC'
    );

    const plans: SubscriptionPlanDbRow[] = rows.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price as string), // Ensure price is a number
      duration_days: plan.duration_days,
      features: plan.features ? JSON.parse(plan.features as string) : null, // Parse features JSON
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    }));

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ message: 'Failed to fetch subscription plans.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// POST /api/subscription-plans - Create a new subscription plan
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to create subscription plans.' }, { status: 403 });
  }

  let connection;
  try {
    const body = (await req.json()) as SubscriptionPlanInput;

    const { name, price, description, duration_days, features } = body;

    // Validate required fields
    if (!name || typeof price === 'undefined' || price === null) {
      return NextResponse.json({ message: 'Missing required fields: name, price.' }, { status: 400 });
    }

    // Validate data types
    if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ message: 'Name must be a non-empty string.' }, { status: 400 });
    }
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ message: 'Price must be a non-negative number.' }, { status: 400 });
    }
    if (duration_days !== undefined && duration_days !== null && (typeof duration_days !== 'number' || !Number.isInteger(duration_days) || duration_days <= 0)) {
      return NextResponse.json({ message: 'Duration (days) must be a positive integer.' }, { status: 400 });
    }
    // Features can be an array or object, will be stringified. Null is also allowed.
    if (features !== undefined && features !== null && typeof features !== 'object' && !Array.isArray(features)) {
        // This check might be too restrictive if a string is directly passed for pre-stringified JSON.
        // However, the interface suggests string[] or object.
        // For simplicity, we'll expect object or array that we stringify.
        return NextResponse.json({ message: 'Features must be an array or object if provided.' }, { status: 400 });
    }


    const newPlanId = uuidv4();
    // Store features as a JSON string or NULL
    const featuresString = (features === undefined || features === null) ? null : JSON.stringify(features);

    connection = await pool.getConnection();
    const insertQuery = `
      INSERT INTO SubscriptionPlans (id, name, description, price, duration_days, features)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(insertQuery, [
      newPlanId,
      name,
      description === undefined ? null : description, // Ensure null if undefined
      price,
      duration_days === undefined ? null : duration_days, // Ensure null if undefined
      featuresString,
    ]);

    // Fetch the newly created plan to return it, including DB-generated timestamps
    const [newPlanRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, name, description, price, duration_days, features, created_at, updated_at FROM SubscriptionPlans WHERE id = ?',
        [newPlanId]
    );
    
    if (newPlanRows.length === 0) {
        return NextResponse.json({ message: 'Failed to retrieve created plan after insert.' }, { status: 500 });
    }

    const createdPlanRow = newPlanRows[0];
    const createdPlan: SubscriptionPlanDbRow = {
        id: createdPlanRow.id,
        name: createdPlanRow.name,
        description: createdPlanRow.description,
        price: parseFloat(createdPlanRow.price as string),
        duration_days: createdPlanRow.duration_days,
        features: createdPlanRow.features ? JSON.parse(createdPlanRow.features as string) : null,
        created_at: createdPlanRow.created_at,
        updated_at: createdPlanRow.updated_at,
    };

    return NextResponse.json(createdPlan, { status: 201 });

  } catch (error: any) {
    console.error('Error creating subscription plan:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) { // Check if error is due to JSON parsing
        return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    // Check for unique constraint violation (MySQL error code 1062 for ER_DUP_ENTRY)
    // The error object from mysql2 might have a 'code' property.
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("SubscriptionPlans.name")) {
      return NextResponse.json({ message: 'Subscription plan with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create subscription plan.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
