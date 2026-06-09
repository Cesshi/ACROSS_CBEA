-- ============================================================
-- ACROSS CBEA – Academic ClassRoom Occupancy Scheduling System
-- College of Business Economics and Accountancy, MMSU
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS across_cbea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE across_cbea;

-- ── ROOMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(120) NOT NULL UNIQUE,
  type      VARCHAR(80)  NOT NULL DEFAULT 'Lecture Room',
  cap       INT          NOT NULL DEFAULT 40,
  floor     VARCHAR(80)  NOT NULL DEFAULT 'Ground Floor',
  created_at DATETIME    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── RESERVATIONS (approved bookings) ──────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  prof       VARCHAR(120) NOT NULL,
  subj       VARCHAR(200) NOT NULL,
  `group`    VARCHAR(200) NOT NULL,
  email      VARCHAR(200) DEFAULT NULL,
  room       VARCHAR(120) NOT NULL,
  day        VARCHAR(10)  NOT NULL,  -- Mon/Tue/Wed/Thu/Fri/Sat
  time_slot  VARCHAR(40)  NOT NULL,  -- e.g. "7:00–8:00 AM"
  notes      TEXT         DEFAULT NULL,
  status     ENUM('approved','pending','rejected') NOT NULL DEFAULT 'pending',
  action_at  DATETIME     DEFAULT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room) REFERENCES rooms(name) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ── ADMIN USERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(80)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin: username=admin, password=admin123
INSERT IGNORE INTO admin_users (username, password_hash)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- NOTE: Replace password_hash with password_hash('your_secure_password') in production.

-- ── SAMPLE ROOMS ───────────────────────────────────────────
INSERT IGNORE INTO rooms (name, type, cap, floor) VALUES
  ('CBEA 101', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 102', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 103', 'Lecture Room', 40, '1st Floor'),
  ('CBEA 201', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 202', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 203', 'Lecture Room', 45, '2nd Floor'),
  ('CBEA 301', 'Lecture Room', 50, '3rd Floor'),
  ('CBEA 302', 'Lecture Room', 50, '3rd Floor'),
  ('CBEA 303', 'Lecture Room', 50, '3rd Floor'),
  ('CBEA 304', 'Lecture Room', 50, '3rd Floor'),
  ('CBEA 305', 'Lecture Room', 50, '3rd Floor'),
  ('CBEA 306', 'Lecture Room', 50, '3rd Floor'),
  ('Computer Lab A', 'Computer Lab', 35, 'Ground Floor'),
  ('Computer Lab B', 'Computer Lab', 35, 'Ground Floor'),
  ('Accounting Lab A', 'Accounting Lab', 30, 'Ground Floor'),
  ('Accounting Lab B', 'Accounting Lab', 30, 'Ground Floor'),
  ('Finance Lab', 'Finance Lab', 30, '1st Floor'),
  ('Conference Room A', 'Conference Room', 20, 'Ground Floor'),
  ('Conference Room B', 'Conference Room', 20, 'Ground Floor'),
  ('Conference Room C', 'Conference Room', 20, '1st Floor'),
  ('AVR A', 'AVR', 80, '1st Floor'),
  ('AVR B', 'AVR', 80, '2nd Floor'),
  ('Auditorium A', 'Auditorium', 300, 'Ground Floor'),
  ('Auditorium B', 'Auditorium', 300, 'Ground Floor'),
  ('Function Hall A', 'Function Hall', 150, 'Ground Floor'),
  ('Function Hall B', 'Function Hall', 150, 'Ground Floor');
