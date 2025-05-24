import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

type GymSettingValue = string | number | boolean | object | null;
type GymSettingsObject = Record<string, GymSettingValue>;

interface GymSettingFromDb {
  id: string;
  setting_name: string;
  setting_value: string | null; // Stored as TEXT in DB
  description?: string | null;
}

// Helper to parse setting_value from TEXT to its likely type
function parseSettingValue(value: string | null): GymSettingValue {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    // Attempt to parse if it looks like JSON (object or array)
    if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
      return JSON.parse(value);
    }
  } catch (e) {
    // Not valid JSON, return as string
    return value;
  }
  // Check for common string representations of boolean or number
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  
  return value; // Default to string
}

// GET /api/settings - Fetch all gym settings
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  // All authenticated users can access settings

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT setting_name, setting_value FROM GymSettings'
    );

    const settingsObject: GymSettingsObject = {};
    rows.forEach(row => {
      settingsObject[row.setting_name] = parseSettingValue(row.setting_value);
    });

    return NextResponse.json(settingsObject, { status: 200 });
  } catch (error) {
    console.error('Error fetching gym settings:', error);
    return NextResponse.json({ message: 'Failed to fetch gym settings.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT /api/settings - Update gym settings (Admin only)
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (token.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  let connection;
  try {
    const body = (await req.json()) as GymSettingsObject;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: 'Request body is empty. No settings to update.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(body)) {
      const setting_name = key;
      let setting_value_to_store: string | null;

      if (value === null || value === undefined) {
        setting_value_to_store = null;
      } else if (typeof value === 'string') {
        setting_value_to_store = value;
      } else {
        setting_value_to_store = JSON.stringify(value);
      }
      
      const newId = uuidv4(); // Generate new ID for potential insert

      // Using INSERT ... ON DUPLICATE KEY UPDATE
      // Assuming setting_name has a UNIQUE constraint.
      // Description is not managed via this PUT for now, defaults to current or NULL if new.
      // If a description is already in the DB for an existing setting, it will be preserved.
      // If it's a new setting, description will be NULL.
      // To manage description, it would need to be part of the input GymSettingsObject.
      const query = `
        INSERT INTO GymSettings (id, setting_name, setting_value, description) 
        VALUES (?, ?, ?, NULL) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
      `;
      await connection.execute<OkPacket>(query, [newId, setting_name, setting_value_to_store]);
    }

    await connection.commit();

    // Fetch and return all settings after update
    const [updatedRows] = await connection.execute<RowDataPacket[]>(
      'SELECT setting_name, setting_value FROM GymSettings'
    );
    const updatedSettingsObject: GymSettingsObject = {};
    updatedRows.forEach(row => {
      updatedSettingsObject[row.setting_name] = parseSettingValue(row.setting_value);
    });

    return NextResponse.json(updatedSettingsObject, { status: 200 });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('Error updating gym settings:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update gym settings.' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
