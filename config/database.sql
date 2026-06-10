-- ============================================================
-- ACROSS-CBEA Database Schema
-- Academic Classroom Reservation & Scheduling System
-- College of Business, Economics and Accountancy — MMSU
-- ============================================================

CREATE DATABASE IF NOT EXISTS across_cbea
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE across_cbea;

-- ── ADMIN USERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(60)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,        -- bcrypt hashed
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL,
  role        ENUM('superadmin','admin') DEFAULT 'admin',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin  (password: admin123)
INSERT IGNORE INTO admin_users (username, password, full_name, email, role) VALUES
(
  'admin',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uXi.KwXlm',
  'CBEA Administrator',
  'cbea.scheduling@mmsu.edu.ph',
  'superadmin'
);

-- ── ROOMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  type        ENUM('Lecture Room','Computer Lab','Conference Room','Seminar Room','Audio-Visual Room') DEFAULT 'Lecture Room',
  capacity    INT          NOT NULL DEFAULT 40,
  floor       VARCHAR(60)  NOT NULL DEFAULT 'Ground Floor',
  building    VARCHAR(80)  DEFAULT 'CBEA Building',
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO rooms (name, type, capacity, floor) VALUES
('CBEA 101', 'Lecture Room',    40, 'Ground Floor'),
('CBEA 102', 'Lecture Room',    40, 'Ground Floor'),
('CBEA 103', 'Lecture Room',    35, 'Ground Floor'),
('CBEA 104', 'Lecture Room',    35, 'Ground Floor'),
('CBEA 201', 'Lecture Room',    50, '2nd Floor'),
('CBEA 202', 'Lecture Room',    50, '2nd Floor'),
('CBEA 203', 'Seminar Room',    30, '2nd Floor'),
('Lab A',    'Computer Lab',    30, 'Ground Floor'),
('Lab B',    'Computer Lab',    30, 'Ground Floor'),
('AVR',      'Audio-Visual Room', 80, 'Ground Floor');

-- ── REGULAR BOOKINGS (faculty schedule) ──────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  faculty     VARCHAR(120) NOT NULL,
  subject     VARCHAR(120) NOT NULL,
  section     VARCHAR(60)  NOT NULL,
  room_id     INT          NOT NULL,
  day_of_week ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
  time_slot   VARCHAR(30)  NOT NULL,     -- e.g. "7:00–8:00 AM"
  semester    VARCHAR(30)  DEFAULT 'AY 2025-2026 2nd Sem',
  status      ENUM('approved','pending','cancelled') DEFAULT 'approved',
  created_by  INT          DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO bookings (faculty, subject, section, room_id, day_of_week, time_slot) VALUES
('Prof. Maria Reyes',     'Business Finance',       'BSA 2-A',   1, 'Mon', '7:00–8:00 AM'),
('Prof. Jose Cruz',       'Accounting 101',         'BSA 1-B',   1, 'Mon', '9:00–10:00 AM'),
('Prof. Ana Lim',         'Macroeconomics',         'BS Econ 3', 2, 'Tue', '8:00–9:00 AM'),
('Prof. Carlos Santos',   'Marketing Management',   'BSM 3-A',   3, 'Wed', '1:00–2:00 PM'),
('Prof. Rosa Dela Cruz',  'Human Resources Mgmt',   'BSBA 4-A',  5, 'Thu', '3:00–4:00 PM'),
('Prof. Miguel Tan',      'Quantitative Methods',   'BSA 3-B',   8, 'Fri', '10:00–11:00 AM'),
('Prof. Lucy Garcia',     'Microeconomics',         'BS Econ 2', 2, 'Mon', '2:00–3:00 PM'),
('Prof. Ramon Flores',    'Business Law',           'BSBA 2-B',  4, 'Sat', '8:00–9:00 AM'),
('Prof. Elena Bautista',  'Financial Accounting',   'BSA 4-A',   6, 'Tue', '1:00–2:00 PM'),
('Prof. Pedro Ramos',     'Operations Management',  'BSBA 3-A',  5, 'Wed', '9:00–10:00 AM');

-- ── PUBLIC RESERVATION REQUESTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  requester_name  VARCHAR(120) NOT NULL,
  requester_email VARCHAR(180) NOT NULL,
  room_id         INT          NOT NULL,
  request_date    DATE         NOT NULL,
  start_time      TIME         NOT NULL,
  end_time        TIME         NOT NULL,
  purpose         VARCHAR(255) NOT NULL,
  notes           TEXT         DEFAULT NULL,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  reject_reason   TEXT         DEFAULT NULL,
  notified        TINYINT(1)   DEFAULT 0,   -- 1 = email sent
  reviewed_by     INT          DEFAULT NULL,
  reviewed_at     TIMESTAMP    NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sample requests
INSERT IGNORE INTO reservation_requests
  (requester_name, requester_email, room_id, request_date, start_time, end_time, purpose, notes, status)
VALUES
('Maria Santos',  'mariasantos@gmail.com',   1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '09:00:00', '11:00:00', 'Faculty Meeting — Q2 Planning',         'Need projector and whiteboard', 'pending'),
('Juan dela Cruz','jdelacruz@gmail.com',      6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '13:00:00', '15:00:00', 'Student Organization Presentation',     '',                              'pending'),
('Liza Reyes',    'lizareyes.mmsu@gmail.com', 3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '08:00:00', '10:00:00', 'Special Examination — Business Finance', 'Need extra chairs',             'pending');

-- ── ACTIVITY LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT          DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(50)  DEFAULT NULL,
  target_id   INT          DEFAULT NULL,
  description TEXT         DEFAULT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── SETTINGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  setting_key   VARCHAR(80)  PRIMARY KEY,
  setting_value TEXT         DEFAULT NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('smtp_host',      'smtp.gmail.com'),
('smtp_port',      '587'),
('smtp_user',      ''),
('smtp_pass',      ''),
('smtp_from_name', 'CBEA Scheduling Office — MMSU'),
('smtp_from_email',''),
('system_name',    'ACROSS-CBEA'),
('academic_year',  'AY 2025-2026'),
('semester',       '2nd Semester');
