import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for PUT request body (all fields optional)
interface PaymentUpdateInput {
  subscription_plan_id?: string | null;
  amount?: number;
  payment_date?: string; // ISO 8601 string
  payment_method?: string | null;
  transaction_id?: string | null;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string | null;
  // member_user_id is NOT updatable for an existing payment
}

// Interface for response (consistent with GET /api/payments and POST /api/payments)
interface PaymentDetails {
  id: string;
  member_user_id: string;
  member_name?: string;
  subscription_plan_id?: string | null;
  subscription_plan_name?: string | null;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  transaction_id?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string | null | undefined => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts;
    if (ts === null || ts === undefined) return ts;
    return String(ts);
};

const ALLOWED_PAYMENT_STATUSES_UPDATE = ['pending', 'completed', 'failed', 'refunded'];

// Helper function to get full payment details by ID
async function getPaymentDetailsById(paymentId: string, connection: any): Promise<PaymentDetails | null> {
  const query = `
    SELECT 
      p.id, p.member_user_id, p.subscription_plan_id, p.amount, p.payment_date, 
      p.payment_method, p.transaction_id, p.status, p.notes, p.created_at, p.updated_at,
      CONCAT(u.first_name, ' ', u.last_name) AS member_name,
      sp.name AS subscription_plan_name
    FROM Payments p
    JOIN Users u ON p.member_user_id = u.id
    LEFT JOIN SubscriptionPlans sp ON p.subscription_plan_id = sp.id
    WHERE p.id = ?;
  `;
  const [rows] = await connection.execute<RowDataPacket[]>(query, [paymentId]);

  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    id: row.id,
    member_user_id: row.member_user_id,
    member_name: row.member_name,
    subscription_plan_id: row.subscription_plan_id,
    subscription_plan_name: row.subscription_plan_name,
    amount: parseFloat(row.amount),
    payment_date: formatTimestamp(row.payment_date)!,
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    status: row.status,
    notes: row.notes,
    created_at: formatTimestamp(row.created_at)!,
    updated_at: formatTimestamp(row.updated_at)!,
  };
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const { id: paymentId } = params;
  if (!paymentId) {
    return NextResponse.json({ message: 'Payment ID is required.' }, { status: 400 });
  }

  let connection;
  try {
    const body = (await req.json()) as PaymentUpdateInput;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body is empty. No fields to update.' }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Validate and collect fields
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0) {
        return NextResponse.json({ message: 'Amount must be a positive number.' }, { status: 400 });
      }
      updateFields.push('amount = ?');
      updateValues.push(body.amount);
    }
    if (body.payment_date !== undefined) {
      if (body.payment_date === null || isNaN(new Date(body.payment_date).getTime())) {
          return NextResponse.json({ message: 'Invalid payment_date format. Please use ISO 8601 or null.' }, { status: 400 });
      }
      updateFields.push('payment_date = ?');
      updateValues.push(body.payment_date ? new Date(body.payment_date) : null);
    }
    if (body.status !== undefined) {
      if (!ALLOWED_PAYMENT_STATUSES_UPDATE.includes(body.status)) {
        return NextResponse.json({ message: `Invalid status. Allowed statuses are: ${ALLOWED_PAYMENT_STATUSES_UPDATE.join(', ')}.` }, { status: 400 });
      }
      updateFields.push('status = ?');
      updateValues.push(body.status);
    }
    if (body.payment_method !== undefined) {
      updateFields.push('payment_method = ?');
      updateValues.push(body.payment_method);
    }
    if (body.transaction_id !== undefined) {
      updateFields.push('transaction_id = ?');
      updateValues.push(body.transaction_id);
    }
    if (body.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(body.notes);
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validate subscription_plan_id if provided
    if (body.subscription_plan_id !== undefined) {
        if (body.subscription_plan_id !== null) {
            const [planRows] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM SubscriptionPlans WHERE id = ?',
                [body.subscription_plan_id]
            );
            if (planRows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 400 });
            }
        }
        updateFields.push('subscription_plan_id = ?');
        updateValues.push(body.subscription_plan_id);
    }


    if (updateFields.length === 0) {
      // This might happen if only subscription_plan_id was null and it was the only field.
      // Or if other fields were undefined, which is fine.
      // The Object.keys(body).length === 0 check handles empty body.
      // If after validation, no fields are valid for DB update, then it's effectively no update.
      await connection.rollback(); // No actual DB fields to update
      return NextResponse.json({ message: 'No valid updatable fields provided.' }, { status: 400 });
    }

    // Check if payment exists
    const [paymentExistsRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM Payments WHERE id = ? FOR UPDATE',
        [paymentId]
    );
    if (paymentExistsRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'Payment not found.' }, { status: 404 });
    }

    updateValues.push(paymentId);
    const updateQuery = `UPDATE Payments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await connection.execute<OkPacket>(updateQuery, updateValues);
    await connection.commit();

    const updatedPaymentDetails = await getPaymentDetailsById(paymentId, connection);
    return NextResponse.json(updatedPaymentDetails, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`Error updating payment ${paymentId}:`, error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("Payments.transaction_id")) {
      return NextResponse.json({ message: 'Transaction ID already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Failed to update payment ${paymentId}.` }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
