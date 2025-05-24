# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Database Setup

This project requires a MySQL database. The schema for the database is defined in the `schema.sql` file.

**Steps to set up the database:**

1.  **Ensure MySQL is Installed and Running:**
    *   Make sure you have a MySQL server installed and running on your system or accessible to your application.

2.  **Create a Database:**
    *   You need to create a database instance for this application. You can do this using a MySQL client or admin tool. For example, using the `mysql` command-line client:
        ```sql
        CREATE DATABASE your_database_name;
        ```
        Replace `your_database_name` with the name you want to use (e.g., `fitness_app_db`). This name should match the `DB_NAME` environment variable you will set up for the application.

3.  **Set Up Environment Variables:**
    *   The application uses environment variables for configuration, including database credentials and NextAuth.js settings.
    *   For local development, create a `.env.local` file in the root of your project. Add the following variables to this file:

        *   `DB_HOST`: The hostname or IP address of your MySQL server (e.g., `localhost`, `127.0.0.1`).
        *   `DB_USER`: The MySQL username that has permissions to access the database.
        *   `DB_PASSWORD`: The password for the MySQL user.
        *   `DB_NAME`: The name of the database you created in step 2 (e.g., `fitness_app_db`).
        *   `DB_PORT`: The port number for your MySQL server (default is usually `3306`).
        *   `NEXTAUTH_URL`: The absolute URL of your Next.js application.
            *   For development, this is typically `http://localhost:3000`.
            *   For production, this should be your live application URL.
            *   This is important for NextAuth.js for OAuth redirects, callback URLs, and general API route behavior.
        *   `NEXTAUTH_SECRET`: A secret key used by NextAuth.js to sign tokens, cookies, and encrypt sensitive information.
            *   This should be a strong, random string. You can generate one using a command like `openssl rand -hex 32`.
            *   **Keep this secret confidential.**

    *   Ensure these variables are also set appropriately in your deployment environment if deploying the application.

    ### `.env.local` Example

    For local development, your `.env.local` file in the project root might look like this:

    ```
    DB_HOST=localhost
    DB_USER=your_mysql_user
    DB_PASSWORD=your_mysql_password
    DB_NAME=fitness_app_db
    DB_PORT=3306

    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_super_strong_random_secret_generated_here 
    ```
    **Note:** Do not commit your `.env.local` file (or any `.env*` files containing secrets) to version control. The project's `.gitignore` file should already be configured to ignore `*.local` files.


4.  **Run the Schema Script:**
    *   Once the database is created and the user has the necessary permissions, you need to execute the `schema.sql` script to create all the required tables and relationships.
    *   You can do this using a MySQL client. For example, using the `mysql` command-line client:
        ```bash
        mysql -u your_username -p your_database_name < schema.sql
        ```
        *   Replace `your_username` with your MySQL username.
        *   Replace `your_database_name` with the database name.
        *   You will be prompted for your MySQL password.
    *   Alternatively, you can use a graphical MySQL tool (like MySQL Workbench, DBeaver, phpMyAdmin) to open `schema.sql` and execute its content against your database.

5.  **Verify Setup:**
    *   After running the script, you can connect to your database and check if all tables (`Users`, `SubscriptionPlans`, `Members`, `Instructors`, `ClassSchedules`, `Bookings`, `Payments`, `Routines`, `RoutineDays`, `RoutineExercises`, `GymSettings`) have been created successfully.

Once these steps are completed, your database should be ready for the application.

## Testing Strategy

Thorough testing is crucial to ensure the reliability and security of the API. This section outlines the recommended testing strategy. A combination of unit tests, integration tests, and end-to-end (API) tests should be implemented.

**Recommended Tools:**
*   **Testing Framework:** Jest, Mocha, or similar.
*   **HTTP Client for API testing:** Supertest (for testing Next.js API routes within Jest), or Postman/Insomnia for manual API testing.
*   **Mocking:** Jest's built-in mocking capabilities.
*   **Test Database:** Use a separate database instance for testing to avoid conflicts with development or production data. Scripts to seed and reset the test database will be necessary.

**Key Areas to Test for Each API Endpoint:**

**1. Authentication & Authorization:**
    *   **Protected Routes:** Verify that endpoints requiring authentication return a 401 Unauthorized status if no token (or an invalid token) is provided.
    *   **Role-Based Access Control (RBAC):**
        *   For endpoints restricted to specific roles (e.g., 'admin', 'instructor'), test that users with other roles receive a 403 Forbidden status.
        *   Test that users with the correct role can access the endpoint.
        *   For endpoints allowing access by self (e.g., a member updating their own profile), test that this logic is correctly enforced and users cannot access/modify data of others unless they are admins.

**2. Input Validation:**
    *   **Required Fields:** Test that requests missing required fields return a 400 Bad Request status with a clear error message.
    *   **Data Types:** Test that providing incorrect data types (e.g., string where number is expected, invalid date format) results in a 400 Bad Request.
    *   **Specific Constraints:** Test constraints like email format, password strength (if applicable during registration), enum values, positive numbers for amounts/capacities, date order (start_time before end_time), etc.
    *   **Uniqueness Constraints:** Test for violations of unique constraints (e.g., duplicate email for registration, duplicate transaction_id for payments, duplicate setting_name for GymSettings) and ensure a 409 Conflict status is returned.

**3. Successful Operations (Happy Path):**
    *   **`POST` (Create):** Verify that valid data results in a 201 Created status, the correct data is stored in the database (check all fields), and the response body contains the created resource, including any server-generated fields (IDs, timestamps).
    *   **`GET` (Read All):** Verify a 200 OK status, correct data structure, and accurate data retrieval (including joins for related data like instructor names, member names, plan names). Test ordering and filtering if applicable.
    *   **`GET` (Read One by ID):** Verify a 200 OK status for existing resources and a 404 Not Found for non-existent ones. Ensure correct data is returned.
    *   **`PUT` (Update):** Verify a 200 OK status, that only provided fields are updated in the database, `updated_at` timestamps are modified, and the response body contains the updated resource. Test partial updates (only some fields provided) and full updates. Verify a 404 if the resource to update doesn't exist.
    *   **`DELETE`:** Verify a 200 OK or 204 No Content status. Confirm the resource is actually deleted or marked as inactive/cancelled in the database. Test for 404 if the resource to delete doesn't exist. Check for cascading effects if applicable (e.g., deleting a routine should delete its days and exercises).

**4. Error Handling:**
    *   **Server Errors:** While harder to test deterministically, ensure that generic 500 Internal Server Error responses are returned for unexpected issues.
    *   **Not Found (404):** Test that requests for non-existent resources (e.g., GET/PUT/DELETE by an unknown ID) return a 404 status.
    *   **Invalid JSON:** Test that requests with malformed JSON bodies return a 400 Bad Request.

**5. Specific Business Logic:**
    *   **Bookings:**
        *   Test class capacity limits (prevent booking full classes).
        *   Test prevention of double booking.
        *   Test `current_capacity` increment/decrement in `ClassSchedules` when bookings are made/cancelled.
        *   Test prevention of booking/cancelling classes in the past.
    *   **Routines (Nested Data):**
        *   Verify correct creation, update, and retrieval of nested `RoutineDays` and `RoutineExercises`.
        *   Test that "replace nested collections" logic for PUT works as expected.
    *   **GymSettings (Key-Value):**
        *   Test parsing of different value types on GET.
        *   Test `INSERT ... ON DUPLICATE KEY UPDATE` logic for PUT.

**Testing Workflow:**
1.  **Isolate Test Environment:** Ensure tests run against a dedicated test database.
2.  **Seed Data:** Before test suites or individual tests, seed the database with necessary prerequisite data (e.g., users with different roles, existing classes, subscription plans).
3.  **Run Tests:** Execute test suites.
4.  **Clean Up:** After tests, clean up any created data or reset the database to a known state.

This testing strategy should provide good coverage for the API's functionality and robustness.
