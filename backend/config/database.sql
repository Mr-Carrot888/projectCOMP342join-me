-- 1. สร้างฐานข้อมูล (กรณีใช้งานครั้งแรก)
CREATE DATABASE IF NOT EXISTS uni_activity_db
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE uni_activity_db;

-- ==========================================
-- 2. ตารางผู้ดูแลระบบ (Admin)
-- ==========================================
CREATE TABLE IF NOT EXISTS admin (
    admin_id VARCHAR(50) PRIMARY KEY,
    admin_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 3. ตารางผู้ใช้งาน / นักศึกษา (User)
-- ==========================================
CREATE TABLE IF NOT EXISTS user (
    user_id VARCHAR(50) PRIMARY KEY,               -- รหัสนักศึกษา / ID
    email VARCHAR(100) NOT NULL UNIQUE,             -- อีเมลมหาวิทยาลัย
    password_hash VARCHAR(255) NOT NULL,            -- รหัสผ่านที่เข้ารหัสแล้ว
    name VARCHAR(100) NOT NULL,                     -- ชื่อ-นามสกุล
    is_verified BOOLEAN DEFAULT FALSE,              -- สถานะยืนยันตัวตน
    status VARCHAR(20) DEFAULT 'Active',            -- สถานะบัญชี (Active, Suspended, Frozen)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 4. ตารางโปรไฟล์และไลฟ์สไตล์ (UserProfile)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profile (
    profile_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    bio TEXT,
    interests TEXT,                                 -- เก็บหมวดหมู่ที่สนใจ (เช่น JSON หรือ Comma-separated)
    free_time_slots TEXT,                           -- ช่วงเวลาว่าง
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 5. ตารางโพสต์กิจกรรม (ActivityPost)
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_post (
    post_id VARCHAR(50) PRIMARY KEY,
    host_id VARCHAR(50) NOT NULL,                    -- ผู้สร้างโพสต์ (Host)
    title VARCHAR(150) NOT NULL,                     -- หัวข้อกิจกรรม
    category VARCHAR(50) NOT NULL,                  -- หมวดหมู่ (เช่น บอร์ดเกม, กีฬา)
    location VARCHAR(255) NOT NULL,                 -- พิกัด/สถานที่ในมหาวิทยาลัย
    date_time DATETIME NOT NULL,                     -- วันและเวลาจัดกิจกรรม
    max_participants INT NOT NULL,                  -- จำนวนคนที่รับสมัครสูงสุด
    post_status VARCHAR(20) DEFAULT 'Open',         -- สถานะโพสต์ (Open, Full, Closed)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 6. ตารางคำขอเข้าร่วมกิจกรรม (ConnectionRequest)
-- ==========================================
CREATE TABLE IF NOT EXISTS connection_request (
    request_id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL,                   -- โพสต์ที่ขอเข้าร่วม
    sender_id VARCHAR(50) NOT NULL,                 -- ผู้ขอเข้าร่วม (Joiner)
    receiver_id VARCHAR(50) NOT NULL,               -- เจ้าของกิจกรรม (Host)
    status VARCHAR(20) DEFAULT 'Pending',           -- สถานะ (Pending, Accepted, Rejected)
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES activity_post(post_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 7. ตารางข้อความแชทประสานงาน (ChatMessage)
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_message (
    message_id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,                -- อ้างอิงห้องแชตชั่วคราวของคำขอนั้นๆ
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_location_sharing BOOLEAN DEFAULT FALSE,      -- สถานะการแชร์พิกัดสถานที่
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES connection_request(request_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 8. ตารางรายงานผู้ใช้งาน (UserReport)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_report (
    report_id VARCHAR(50) PRIMARY KEY,
    reporter_id VARCHAR(50) NOT NULL,               -- ผู้แจ้งรายงาน
    reported_user_id VARCHAR(50) NOT NULL,          -- ผู้ถูกรายงาน
    reason TEXT NOT NULL,                           -- เหตุผลในการรายงาน
    report_status VARCHAR(20) DEFAULT 'Pending',    -- สถานะ (Pending, Resolved)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;