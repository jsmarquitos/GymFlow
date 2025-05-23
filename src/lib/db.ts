import { createPool, Pool, PoolOptions } from 'mysql2/promise';

// Define an interface for the database connection options
// PoolOptions from 'mysql2/promise' can also be used directly
interface DatabaseConfig extends PoolOptions {
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  port?: number;
}

// Retrieve database connection options from environment variables
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPortString = process.env.DB_PORT;

// Validate essential environment variables
if (!dbHost || !dbUser || !dbName) {
  console.error(
    'Missing essential database environment variables: DB_HOST, DB_USER, DB_NAME must be set.'
  );
  // Depending on the application's needs, you might throw an error here or allow it to fail at pool creation.
  // For now, we'll log an error and let createPool handle the potential failure.
}

// Parse DB_PORT to a number, default to 3306 if not provided or invalid
const dbPort = dbPortString ? parseInt(dbPortString, 10) : 3306;
if (isNaN(dbPort)) {
  console.warn(
    `Invalid DB_PORT: "${dbPortString}". Using default port 3306.`
  );
}

// Configuration for the connection pool
const poolOptions: DatabaseConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword, // Can be undefined if password is not set
  database: dbName,
  port: isNaN(dbPort) ? 3306 : dbPort, // Ensure port is a valid number
  waitForConnections: true,
  connectionLimit: 10, // Adjust as per your application's needs
  queueLimit: 0, // No limit on the queue of connections waiting
};

let pool: Pool;

try {
  // Create the connection pool
  pool = createPool(poolOptions);

  // Optionally, you can try to get a connection to check if the pool is working
  // This is asynchronous, so it's better done in an async function if needed at startup.
  // For this utility, we export the pool directly.
  // pool.getConnection()
  //   .then(connection => {
  //     console.log('Successfully connected to the database pool.');
  //     connection.release();
  //   })
  //   .catch(err => {
  //     console.error('Failed to create a connection from the pool:', err);
  //   });

  console.log('Database connection pool created successfully.');

} catch (error) {
  console.error('Failed to create database connection pool:', error);
  // If pool creation fails catastrophically (e.g., due to misconfiguration not caught above),
  // the application might not be able to run. We'll re-throw or handle as appropriate.
  // For now, 'pool' will be undefined, and attempts to use it will fail.
  // It's often better to let the application crash early if the DB is essential.
  // To ensure 'pool' is always a Pool type or throws, this structure might need adjustment
  // or the consuming code needs to handle 'pool' potentially being undefined.
  // However, createPool itself typically throws if options are fundamentally wrong.
  throw error; // Re-throw to make it clear that pool creation failed
}

// Export the created pool instance
export default pool;
