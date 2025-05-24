import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Interface for POST request body
interface PaymentInput {
  member_user_id: string;
  subscription_plan_id?: string | null;
  amount: number;
  payment_date?: string; // ISO 8601 string, defaults to now
  payment_method?: string | null; // e.g., 'credit_card', 'paypal', 'cash'
  transaction_id?: string | null;
  status?: 'pending' | 'completed' | 'failed' | 'refunded'; // Defaults to 'completed'
  notes?: string | null;
}

// Interface for the response after creating a payment
interface PaymentDetails {
  id: string; // Payment ID
  member_user_id: string;
  member_name?: string; // From Users table
  subscription_plan_id?: string | null;
  subscription_plan_name?: string | null; // From SubscriptionPlans table
  amount: number;
  payment_date: string; // ISO 8601 format
  payment_method?: string | null;
  transaction_id?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string | null;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

// Helper to format timestamp fields consistently
const formatTimestamp = (ts: any): string | null | undefined => {
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts;
    if (ts === null || ts === undefined) return ts;
    return String(ts);
};

const ALLOWED_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];
const DEFAULT_PAYMENT_STATUS = 'completed';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  let connection;
  try {
    const body = (await req.json()) as PaymentInput;
    const {
      member_user_id,
      subscription_plan_id,
      amount,
      payment_method,
      transaction_id,
      notes
    } = body;

    let { payment_date, status } = body;

    // Validate required fields
    if (!member_user_id || typeof amount === 'undefined' || amount === null) {
      return NextResponse.json({ message: 'Missing required fields: member_user_id, amount.' }, { status: 400 });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Amount must be a positive number.' }, { status: 400 });
    }

    // Validate and set payment_date
    if (payment_date) {
      if (isNaN(new Date(payment_date).getTime())) {
        return NextResponse.json({ message: 'Invalid payment_date format. Please use ISO 8601.' }, { status: 400 });
      }
    } else {
      payment_date = new Date().toISOString();
    }

    // Validate and set status
    if (status) {
      if (!ALLOWED_PAYMENT_STATUSES.includes(status)) {
        return NextResponse.json({ message: `Invalid status. Allowed statuses are: ${ALLOWED_PAYMENT_STATUSES.join(', ')}.` }, { status: 400 });
      }
    } else {
      status = DEFAULT_PAYMENT_STATUS as 'pending' | 'completed' | 'failed' | 'refunded';
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validate member_user_id
    const [memberRows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM Users WHERE id = ? AND role = 'member'",
      [member_user_id]
    );
    if (memberRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ message: 'Member not found or user is not a member.' }, { status: 400 }); // Or 404
    }

    // Validate subscription_plan_id if provided
    if (subscription_plan_id) {
      const [planRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM SubscriptionPlans WHERE id = ?',
        [subscription_plan_id]
      );
      if (planRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'Subscription plan not found.' }, { status: 400 }); // Or 404
      }
    }
    
    const newPaymentId = uuidv4();

    const insertQuery = `
      INSERT INTO Payments (
        id, member_user_id, subscription_plan_id, amount, payment_date, 
        payment_method, transaction_id, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.execute<OkPacket>(insertQuery, [
      newPaymentId,
      member_user_id,
      subscription_plan_id || null,
      amount,
      new Date(payment_date), // Ensure it's a Date object for MySQL TIMESTAMP
      payment_method || null,
      transaction_id || null,
      status,
      notes || null
    ]);

    await connection.commit();

    // Fetch the created payment details for the response
    const [newPaymentRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 
         p.id, p.member_user_id, p.subscription_plan_id, p.amount, p.payment_date, 
         p.payment_method, p.transaction_id, p.status, p.notes, p.created_at, p.updated_at,
         CONCAT(u.first_name, ' ', u.last_name) AS member_name,
         sp.name AS subscription_plan_name
       FROM Payments p
       JOIN Users u ON p.member_user_id = u.id
       LEFT JOIN SubscriptionPlans sp ON p.subscription_plan_id = sp.id
       WHERE p.id = ?`,
      [newPaymentId]
    );

    if (newPaymentRows.length === 0) {
      // Should not happen if insert was successful
      return NextResponse.json({ message: 'Payment recorded but failed to retrieve details.' }, { status: 500 });
    }

    const createdPayment = newPaymentRows[0];
    const responsePayment: PaymentDetails = {
      id: createdPayment.id,
      member_user_id: createdPayment.member_user_id,
      member_name: createdPayment.member_name,
      subscription_plan_id: createdPayment.subscription_plan_id,
      subscription_plan_name: createdPayment.subscription_plan_name,
      amount: parseFloat(createdPayment.amount), // Ensure number
      payment_date: formatTimestamp(createdPayment.payment_date)!,
      payment_method: createdPayment.payment_method,
      transaction_id: createdPayment.transaction_id,
      status: createdPayment.status,
      notes: createdPayment.notes,
      created_at: formatTimestamp(createdPayment.created_at)!,
      updated_at: formatTimestamp(createdPayment.updated_at)!,
    };

    return NextResponse.json(responsePayment, { status: 201 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error recording payment:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes("Payments.transaction_id")) {
      return NextResponse.json({ message: 'Transaction ID already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to record payment.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { userId, role, name: tokenName } = token; // `name` from token is user's full name
  let connection;

  try {
    connection = await pool.getConnection();
    let query = '';
    const queryParams: string[] = [];
    
    const baseSelect = `
      SELECT 
        p.id, p.member_user_id, p.subscription_plan_id, p.amount, p.payment_date, 
        p.payment_method, p.transaction_id, p.status, p.notes, p.created_at, p.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        sp.name AS subscription_plan_name
      FROM Payments p
      JOIN Users u ON p.member_user_id = u.id
      LEFT JOIN SubscriptionPlans sp ON p.subscription_plan_id = sp.id
    `;

    if (role === 'member') {
      query = `${baseSelect} WHERE p.member_user_id = ? ORDER BY p.payment_date DESC;`;
      queryParams.push(userId as string);
    } else if (role === 'admin') {
      query = `${baseSelect} ORDER BY p.payment_date DESC;`;
      // No queryParams for admin fetching all payments
    } else {
      // For 'instructor' or any other roles, forbid access
      return NextResponse.json({ message: 'Forbidden: You do not have permission to access this resource.' }, { status: 403 });
    }

    const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);

    const payments: PaymentDetails[] = rows.map(row => ({
      id: row.id,
      member_user_id: row.member_user_id,
      member_name: row.member_name, // This will be populated from the JOIN
      subscription_plan_id: row.subscription_plan_id,
      subscription_plan_name: row.subscription_plan_name,
      amount: parseFloat(row.amount), // Ensure number
      payment_date: formatTimestamp(row.payment_date)!,
      payment_method: row.payment_method,
      transaction_id: row.transaction_id,
      status: row.status,
      notes: row.notes,
      created_at: formatTimestamp(row.created_at)!,
      updated_at: formatTimestamp(row.updated_at)!,
    }));

    return NextResponse.json(payments, { status: 200 });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ message: 'Failed to fetch payments.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
