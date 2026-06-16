-- ============================================================
-- ACROSS CBEA – Database Schema
-- Run this on a fresh database OR run the migration section
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS across_cbea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE across_cbea;

-- ── USERS (replaces admin_users) ───────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(80)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','faculty') NOT NULL DEFAULT 'admin',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin: admin / admin123
-- Default faculty: faculty / cbea2026
INSERT IGNORE INTO users (username, password_hash, role) VALUES
  ('admin',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('faculty', '$2y$10$TKh8H1.PfunBp0E6SQZY1O2n2xTk6k2xGCdBY3B4Q.FCNR8gxH3Ei', 'faculty');

-- ── ROOMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL UNIQUE,
  type       VARCHAR(80)  NOT NULL DEFAULT 'Lecture Room',
  `cap`      INT          NOT NULL DEFAULT 40,
  floor      VARCHAR(80)  NOT NULL DEFAULT 'Ground Floor',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── RESERVATIONS ───────────────────────────────────────────
-- day stores patterns: MWF, TTH, SAT, MW, M, T, W, TH, F, etc.
CREATE TABLE IF NOT EXISTS reservations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  prof       VARCHAR(120) NOT NULL,
  subj       VARCHAR(200) NOT NULL,
  `group`    VARCHAR(200) NOT NULL DEFAULT '',
  email      VARCHAR(200) DEFAULT NULL,
  room       VARCHAR(120) NOT NULL,
  day        VARCHAR(10)  NOT NULL,
  time_slot  VARCHAR(40)  NOT NULL,
  notes      TEXT         DEFAULT NULL,
  status     ENUM('approved','pending','rejected') NOT NULL DEFAULT 'pending',
  action_at  DATETIME     DEFAULT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── SAMPLE ROOMS (excluding restricted rooms) ──────────────
INSERT IGNORE INTO rooms (name, type, `cap`, floor) VALUES
  ('CBEA 102', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 109', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 110', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 201', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 202', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 203', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 204', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 205', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 206', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 207', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 208', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 209', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 210', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 211', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 212', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 213', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 214', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 215', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 216', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 217', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 218', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 219', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 220', 'Lecture Room', 45, '2nd Floor'),
  ('iHub 1', 'Computer Lab', 35, 'Ground Floor'),
  ('iHub 2', 'Computer Lab', 35, 'Ground Floor'),
  ('Typing Room', 'Computer Lab', 30, 'Ground Floor'),
  ('Student Center', 'Function Hall', 100, 'Ground Floor');

-- ============================================================
-- MIGRATION (run if upgrading from v1)
-- ============================================================

-- Step 1: Migrate admin_users → users
INSERT IGNORE INTO users (username, password_hash, role)
  SELECT username, password_hash, 'admin' FROM admin_users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_users' AND table_schema=DATABASE());

-- Step 2: Migrate day values Mon→M, Tue→T, Wed→W, Thu→TH, Fri→F, Sat→SAT
UPDATE reservations SET day='M'   WHERE day='Mon';
UPDATE reservations SET day='T'   WHERE day='Tue';
UPDATE reservations SET day='W'   WHERE day='Wed';
UPDATE reservations SET day='TH'  WHERE day='Thu';
UPDATE reservations SET day='F'   WHERE day='Fri';
UPDATE reservations SET day='SAT' WHERE day='Sat';

-- Step 3: Drop old admin_users if it exists (optional — comment out if unsure)
-- DROP TABLE IF EXISTS admin_users;
