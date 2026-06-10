# ACROSS-CBEA — Setup Guide
## Academic Classroom Reservation & Scheduling System
### Mariano Marcos State University — College of Business, Economics & Accountancy

---

## 📁 Project Structure

```
across_cbea/
├── index.php              ← Public homepage (schedule + request form)
├── login.php              ← Admin login page
├── admin.php              ← Admin dashboard (protected)
├── logout.php             ← Session logout handler
├── .htaccess              ← Apache security & URL rules
│
├── config/
│   ├── config.php         ← DB credentials & constants
│   └── database.sql       ← Full database schema + seed data
│
├── includes/
│   ├── db.php             ← PDO database class (singleton)
│   ├── auth.php           ← Session & login helpers
│   └── mailer.php         ← PHPMailer Gmail SMTP integration
│
├── api/
│   └── index.php          ← JSON API — all AJAX endpoints
│
├── css/
│   ├── main.css           ← Design tokens, animations, components
│   └── admin.css          ← Admin dashboard layout styles
│
├── js/
│   ├── app.js             ← Core: API client, Toast, Modal, Clock, Calendar
│   ├── admin.js           ← Admin dashboard page logic
│   └── home.js            ← Public homepage logic
│
├── vendor/
│   └── phpmailer/src/     ← PHPMailer 6.9 (bundled, no Composer needed)
│
└── assets/
    └── img/
        ├── mmsu_logo.png  ← MMSU seal
        └── cbea_logo.png  ← CBEA logo
```

---

## ⚡ Quick Setup (XAMPP / Local)

### Step 1 — Copy Files
```
Copy the entire `across_cbea/` folder to:
  Windows: C:\xampp\htdocs\across_cbea\
  macOS:   /Applications/XAMPP/htdocs/across_cbea/
  Linux:   /opt/lampp/htdocs/across_cbea/
```

### Step 2 — Create the Database
1. Open **phpMyAdmin** → http://localhost/phpmyadmin
2. Click **Import** tab
3. Choose file: `across_cbea/config/database.sql`
4. Click **Go**

The database `across_cbea` will be created with all tables and sample data.

### Step 3 — Configure Database Connection
Edit `config/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // Your MySQL username
define('DB_PASS', '');           // Your MySQL password (blank for XAMPP default)
define('DB_NAME', 'across_cbea');
```

### Step 4 — Visit the Site
- **Homepage:** http://localhost/across_cbea/
- **Admin Login:** http://localhost/across_cbea/login.php
  - Username: `admin`
  - Password: `admin123`

---

## 📧 Gmail SMTP Setup (Email Notifications)

This is what makes automatic email notifications work when admins approve/reject requests.

### Step 1 — Enable 2-Factor Authentication on Gmail
1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google", enable **2-Step Verification**

### Step 2 — Create an App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → type `ACROSS-CBEA`
4. Click **Generate**
5. **Copy the 16-character password shown** (e.g. `abcd efgh ijkl mnop`)

### Step 3 — Enter Credentials in Admin Dashboard
1. Log in to Admin → http://localhost/across_cbea/login.php
2. Go to **Settings** page in the sidebar
3. Fill in:
   - **Gmail Address:** `yourname@gmail.com`
   - **App Password:** The 16-character code from Step 2 (spaces are OK)
   - **From Name:** `CBEA Scheduling Office — MMSU`
   - **From Email:** same as Gmail Address (or a different reply-to)
4. Click **Save All Settings**

### Step 4 — Test It
1. In Settings → **Test Email** section
2. Enter your email address
3. Click **Send Test Email**
4. Check your inbox — you should receive a test message

> ⚠️ **Never use your regular Gmail password.** Always use a dedicated App Password.
> If you're using Google Workspace (e.g., `@mmsu.edu.ph`), the same steps apply.

---

## 🌐 Deploying Online (cPanel / Shared Hosting)

### Step 1 — Upload Files
Upload the entire `across_cbea/` folder contents to your `public_html/` directory (or a subdirectory like `public_html/across_cbea/`).

### Step 2 — Create MySQL Database (cPanel)
1. Go to cPanel → **MySQL Databases**
2. Create a new database: `across_cbea`
3. Create a MySQL user and assign it **All Privileges** on this database
4. Import `config/database.sql` via **phpMyAdmin**

### Step 3 — Update config.php
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'cpanelusername_dbuser');  // Your cPanel DB username
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'cpanelusername_across_cbea');
define('APP_URL', 'https://yourdomain.com/across_cbea');
```

### Step 4 — Set Correct APP_URL
In `config/config.php`, update:
```php
define('APP_URL', 'https://yourdomain.com');
```

### Step 5 — Enable HTTPS .htaccess Redirect (Optional but Recommended)
Add to the top of `.htaccess`:
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Step 6 — Set Session Cookie to Secure
In `includes/auth.php`, change:
```php
'secure' => true,   // Set to true when using HTTPS
```

---

## 🔐 Default Admin Credentials
| Username | Password  |
|----------|-----------|
| `admin`  | `admin123` |

> **Change the default password immediately after first login.**
> In phpMyAdmin, run:
> ```sql
> UPDATE admin_users SET password = '$2y$12$NEWHASHEDPASSWORD' WHERE username = 'admin';
> ```
> Or use PHP: `echo password_hash('yournewpassword', PASSWORD_BCRYPT, ['cost'=>12]);`

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `admin_users` | Admin accounts with bcrypt-hashed passwords |
| `rooms` | CBEA classrooms and facilities |
| `bookings` | Regular weekly class schedule entries |
| `reservation_requests` | Public reservation requests from homepage form |
| `activity_log` | Admin action audit trail |
| `settings` | System and SMTP configuration (key-value store) |

---

## 🔌 API Endpoints

All endpoints: `api/index.php?action=ACTION_NAME`

### Public (no auth)
| Action | Method | Description |
|--------|--------|-------------|
| `get_schedule` | GET | Weekly schedule for public calendar |
| `get_rooms_public` | GET | Active rooms for request form dropdown |
| `submit_request` | POST | Submit a reservation request |

### Admin (requires session)
| Action | Method | Description |
|--------|--------|-------------|
| `get_dashboard` | GET | Stats + recent requests + occupancy |
| `get_rooms` | GET | All rooms with booking counts |
| `add_room` | POST | Create a new room |
| `update_room` | POST | Update room details |
| `delete_room` | POST | Delete a room |
| `get_bookings` | GET | All bookings |
| `add_booking` | POST | Add a class booking (conflict check) |
| `update_booking` | POST | Update booking |
| `delete_booking` | POST | Delete booking |
| `get_requests` | GET | Public reservation requests |
| `approve_request` | POST | Approve + send Gmail notification |
| `reject_request` | POST | Reject + send Gmail notification |
| `get_settings` | GET | System settings |
| `save_settings` | POST | Save settings (SMTP, system info) |
| `test_email` | POST | Send a test email |
| `get_log` | GET | Activity log (last 50 entries) |

---

## ✉️ Email Notification Flow

```
Public User fills form → Submitted to DB (status: pending)
       ↓
Admin sees request in Dashboard / Requests page
       ↓
Admin clicks Approve / Reject
       ↓
PHP calls sendApprovalEmail() / sendRejectionEmail()
       ↓
PHPMailer connects to Gmail SMTP (port 587, STARTTLS)
       ↓
Branded HTML email sent to requester's Gmail
       ↓
DB updated: notified = 1, reviewed_at = NOW()
       ↓
Toast shows: "✓ Approved & email notification sent!"
```

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3 (custom, no framework), Vanilla JS (ES2020+)
- **Backend:** PHP 8.1+, PDO MySQL
- **Email:** PHPMailer 6.9 with Gmail SMTP (TLS/STARTTLS)
- **Database:** MySQL 5.7+ / MariaDB 10.4+
- **Fonts:** DM Serif Display + Plus Jakarta Sans (Google Fonts)
- **Server:** Apache (XAMPP / cPanel)

---

## 🐞 Troubleshooting

**White page / PHP errors**
- Enable errors temporarily in `config/config.php`: `ini_set('display_errors', 1);`

**"SMTP connect() failed"**
- Verify Gmail App Password is correct (no spaces)
- Ensure 2FA is enabled on the Gmail account
- Check port 587 is not blocked by your host (some shared hosts block it — try port 465 with SSL)

**"Access denied for user 'root'"**
- Update `DB_USER` and `DB_PASS` in `config/config.php`

**Calendar not loading**
- Check browser console for JS errors
- Verify `api/index.php` is accessible
- Ensure `.htaccess` is not blocking the `api/` directory

**Session expires immediately**
- Increase `SESSION_LIFETIME` in `config/config.php`
- On shared hosting, ensure PHP session path is writable

---

*ACROSS-CBEA v2.0 — Built for MMSU-CBEA*
