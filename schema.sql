-- Database schema for the fitness application

-- Users table
CREATE TABLE Users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'instructor', 'member') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_picture_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SubscriptionPlans table
CREATE TABLE SubscriptionPlans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT, -- e.g., 30 for monthly, 365 for yearly
    features TEXT, -- Comma-separated list or JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Instructors table
-- Links to Users table for common user attributes
CREATE TABLE Instructors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    specialization VARCHAR(255),
    years_of_experience INT,
    certification TEXT, -- Store certification details or URL
    availability_schedule TEXT, -- Could be JSON or a structured format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Members table
-- Links to Users table for common user attributes
CREATE TABLE Members (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subscription_plan_id VARCHAR(36),
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    health_conditions TEXT,
    fitness_goals TEXT,
    membership_start_date DATE,
    membership_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_plan_id) REFERENCES SubscriptionPlans(id) ON DELETE SET NULL
);

-- ClassSchedules table
CREATE TABLE ClassSchedules (
    id VARCHAR(36) PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_user_id VARCHAR(36) NOT NULL, -- Refers to a User with 'instructor' role
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    max_capacity INT,
    current_capacity INT DEFAULT 0,
    difficulty_level VARCHAR(50), -- e.g., Beginner, Intermediate, Advanced
    equipment_needed TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_user_id) REFERENCES Users(id) ON DELETE CASCADE -- Ensures instructor is a valid user
    -- Consider adding a check constraint to ensure instructor_user_id corresponds to a user with role 'instructor' if DB supports it,
    -- otherwise this needs to be handled at the application level.
);

-- Bookings table
CREATE TABLE Bookings (
    id VARCHAR(36) PRIMARY KEY,
    member_user_id VARCHAR(36) NOT NULL, -- Refers to a User with 'member' role
    class_schedule_id VARCHAR(36) NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmed', 'cancelled', 'waitlisted') DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_schedule_id) REFERENCES ClassSchedules(id) ON DELETE CASCADE
    -- Similar to ClassSchedules, consider application-level check for member_user_id role.
);

-- Payments table
CREATE TABLE Payments (
    id VARCHAR(36) PRIMARY KEY,
    member_user_id VARCHAR(36) NOT NULL, -- Refers to a User with 'member' role
    subscription_plan_id VARCHAR(36), -- Can be null if payment is for something else (e.g., a one-time class)
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50), -- e.g., 'credit_card', 'paypal', 'cash'
    transaction_id VARCHAR(255) UNIQUE, -- From payment gateway
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_plan_id) REFERENCES SubscriptionPlans(id) ON DELETE SET NULL
    -- Similar to ClassSchedules, consider application-level check for member_user_id role.
);

-- Routines table
CREATE TABLE Routines (
    id VARCHAR(36) PRIMARY KEY,
    routine_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_member_user_id VARCHAR(36) NOT NULL, -- Refers to a User with 'member' role
    assigned_by_instructor_user_id VARCHAR(36) NOT NULL, -- Refers to a User with 'instructor' role
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_member_user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_instructor_user_id) REFERENCES Users(id) ON DELETE CASCADE
    -- Application level checks for roles of assigned_to_member_user_id and assigned_by_instructor_user_id
);

-- RoutineDays table
-- Represents a specific day within a routine (e.g., Day 1, Day 2)
CREATE TABLE RoutineDays (
    id VARCHAR(36) PRIMARY KEY,
    routine_id VARCHAR(36) NOT NULL,
    day_name VARCHAR(100), -- e.g., "Chest Day", "Leg Day", "Day 1"
    order_num INT NOT NULL, -- Order of the day within the routine (e.g., 1, 2, 3)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES Routines(id) ON DELETE CASCADE,
    UNIQUE (routine_id, order_num) -- Ensures order_num is unique per routine
);

-- RoutineExercises table
-- Represents a specific exercise within a routine day
CREATE TABLE RoutineExercises (
    id VARCHAR(36) PRIMARY KEY,
    routine_day_id VARCHAR(36) NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    description TEXT, -- How to perform, what to focus on
    sets INT,
    reps VARCHAR(50), -- Can be a range like "8-12" or a number
    duration_minutes INT, -- For time-based exercises
    rest_period_seconds INT,
    order_num INT NOT NULL, -- Order of the exercise within the day
    notes TEXT, -- e.g., specific equipment settings, alternative exercise
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_day_id) REFERENCES RoutineDays(id) ON DELETE CASCADE,
    UNIQUE (routine_day_id, order_num) -- Ensures order_num is unique per routine day
);

-- GymSettings table
-- For storing global gym settings, configurations
CREATE TABLE GymSettings (
    id VARCHAR(36) PRIMARY KEY, -- Could be a single row table, e.g., id = 'default_settings'
    setting_name VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Example of a single-row settings table approach:
-- For GymSettings, if it's intended to be a single row holding various settings,
-- a primary key like `config_id` with a fixed value (e.g., 1 or a specific UUID)
-- might be used, and then columns for each setting.
-- However, the current structure (setting_name, setting_value) is more flexible
-- for adding multiple arbitrary settings.
-- If only one row is ever expected, the application logic should enforce this,
-- or a simpler structure could be:
-- CREATE TABLE GymSettings (
--    id INT PRIMARY KEY DEFAULT 1, -- Enforce single row
--    gym_name VARCHAR(255),
--    operating_hours TEXT,
--    contact_email VARCHAR(255),
--    CHECK (id = 1), -- Ensures only one row can be inserted if DB supports CHECK like this for PK
--    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );
-- For now, sticking to the flexible key-value pair GymSettings as defined above.
