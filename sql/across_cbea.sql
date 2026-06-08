-- ============================================
-- RoomClaim Database
-- Run this in phpMyAdmin after creating
-- a database named: roomclaim
-- ============================================

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    floor VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prof_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    day ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status ENUM('approved','pending','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    prof_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    day ENUM('Mon','Tue','Wed','Thu','Fri','Sat') NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    request_type ENUM('new','change') DEFAULT 'new',
    reason TEXT,
    notes TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','faculty') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default users (passwords are hashed)
-- admin: admin123
-- faculty: cbea2024
INSERT INTO users (username, password, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('faculty', '$2y$10$TKh8H1.PEfUTrpjTEWFD8OvFjhJz7n6HYp3I6vFvWQkRLfKu7CQnm', 'faculty');

-- Sample rooms
INSERT INTO rooms (name, type, capacity, floor) VALUES
('CBEA 101', 'Lecture Room', 40, 'Ground Floor'),
('CBEA 102', 'Lecture Room', 40, 'Ground Floor'),
('CBEA 103', 'Lecture Room', 35, 'Ground Floor'),
('CBEA 104', 'Lecture Room', 35, 'Ground Floor'),
('CBEA 201', 'Lecture Room', 50, '2nd Floor'),
('CBEA 202', 'Lecture Room', 50, '2nd Floor'),
('Lab A', 'Computer Lab', 30, 'Ground Floor'),
('Lab B', 'Computer Lab', 30, 'Ground Floor');
