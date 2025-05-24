import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for PUT request body (all fields optional)
interface SubscriptionPlanUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  duration_days?: number | null;
  features?: string[] | object | null;
}

// Interface for data from the database and for API responses
// (Consistent with the one in src/app/api/subscription-plans/route.ts)
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

// Helper function to fetch a plan by ID and parse it
async function getPlanById(id: string, connection: any): Promise<SubscriptionPlanDbRow | null> {
  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT id, name, description, price, duration_days, features, created_at, updated_at FROM SubscriptionPlans WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  const plan = rows[0];
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: parseFloat(plan.price as string),
    duration_days: plan.duration_days,
    features: plan.features ? JSON.parse(plan.features as string) : null,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

// GET /api/subscription-plans/{id}
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Subscription plan ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const plan = await getPlanById(id, connection);

    if (!plan) {
      return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 404 });
    }
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error(`Error fetching subscription plan ${id}:`, error);
    return NextResponse.json({ message: `Failed to fetch subscription plan ${id}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT /api/subscription-plans/{id}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Subscription plan ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    const body = (await req.json()) as SubscriptionPlanUpdateInput;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'No fields provided for update.' }, { status: 400 });
    }

    const { name, description, price, duration_days, features } = body;
    const updateFields: string[] = [];
    const values: any[] = [];

    // Validate and add fields to update query
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ message: 'Name must be a non-empty string.' }, { status: 400 });
      }
      updateFields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description === null ? null : description);
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json({ message: 'Price must be a non-negative number.' }, { status: 400 });
      }
      updateFields.push('price = ?');
      values.push(price);
    }
    if (duration_days !== undefined) {
        if (duration_days !== null && (typeof duration_days !== 'number' || !Number.isInteger(duration_days) || duration_days <= 0)) {
            return NextResponse.json({ message: 'Duration (days) must be a positive integer or null.' }, { status: 400 });
        }
        updateFields.push('duration_days = ?');
        values.push(duration_days);
    }
    if (features !== undefined) {
        if (features !== null && typeof features !== 'object' && !Array.isArray(features)) {
            return NextResponse.json({ message: 'Features must be an array or object if provided, or null to clear.' }, { status: 400 });
        }
        updateFields.push('features = ?');
        values.push(features === null ? null : JSON.stringify(features));
    }
    
    if (updateFields.length === 0) { // Should be caught by Object.keys check, but good for safety
        return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    values.push(id); // For the WHERE clause

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if plan exists
    const [existingPlanRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM SubscriptionPlans WHERE id = ? FOR UPDATE', // Lock row
      [id]
    );
    if (existingPlanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 404 });
    }

    const updateQuery = `UPDATE SubscriptionPlans SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const [updateResult] = await connection.execute<OkPacket>(updateQuery, values);

    if (updateResult.affectedRows === 0) {
      // This case should ideally be caught by the existence check, but as a safeguard
      await connection.rollback();
      return NextResponse.json({ message: 'Subscription plan not found or no changes made.' }, { status: 404 });
    }
    
    await connection.commit();
    
    // Fetch and return the updated plan
    const updatedPlan = await getPlanById(id, connection);
    return NextResponse.json(updatedPlan, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating subscription plan ${id}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("SubscriptionPlans.name")) {
      return NextResponse.json({ message: 'Subscription plan with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Failed to update subscription plan ${id}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// DELETE /api/subscription-plans/{id}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'Subscription plan ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if plan exists before attempting to delete
    const [existingPlanRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM SubscriptionPlans WHERE id = ?',
      [id]
    );
    if (existingPlanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 404 });
    }

    const [deleteResult] = await connection.execute<OkPacket>(
      'DELETE FROM SubscriptionPlans WHERE id = ?',
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      // Should be caught by existence check, but good for safety
      await connection.rollback();
      return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 404 });
    }

    await connection.commit();
    return NextResponse.json({ message: 'Subscription plan deleted successfully.' }, { status: 200 });
    // Or return new NextResponse(null, { status: 204 }); if no message body is preferred

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error deleting subscription plan ${id}:`, error);
    // Foreign key constraint errors could be caught here if ON DELETE RESTRICT was used,
    // but schema has ON DELETE SET NULL, so direct deletion should be fine.
    return NextResponse.json({ message: `Failed to delete subscription plan ${id}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
