-- seed.sql
-- Mock Data for Hermes Daily Productivity Dashboard

USE daily_productivity;

-- 1. Insert API Keys for Hermes Agent access
INSERT INTO api_keys (api_key, label, is_active) VALUES
('change_me_api_key', 'Hermes Agent Telegram Bot', 1),
('local_dev_secret_key_12345', 'Local Development Dashboard UI', 1)
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- 2. Insert Projects
INSERT INTO projects (id, name, description, status, priority, deadline) VALUES
(1, 'MRP Automation', 'Otomatisasi pengiriman dan integrasi data liveness/MRP di DGX', 'ACTIVE', 'HIGH', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY)),
(2, 'Vendor Performance', 'Dashboard visualisasi performa dan SLA liveness vendor', 'ACTIVE', 'MEDIUM', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY)),
(3, 'Home Expense Hub', 'Integrasi TanStack Start dengan MariaDB dan agent Telegram', 'COMPLETED', 'HIGH', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)),
(4, 'Personal Workout Routine', 'Sistem pelacakan latihan fisik mingguan', 'ACTIVE', 'LOW', NULL);

-- 3. Insert Tasks
INSERT INTO tasks (id, project_id, title, description, status, priority, deadline, estimated_minutes, actual_minutes, progress_percent, blocker_reason, last_activity_at, completed_at) VALUES
-- Task 1: MRP Automation - In Progress, due today
(1, 1, 'Automation Daily Report', 'Membuat skrip otomatisasi report harian aktivitas MRP di server', 'IN_PROGRESS', 'HIGH', DATE_ADD(CURRENT_DATE, INTERVAL 17 HOUR), 180, 120, 70, NULL, CURRENT_TIMESTAMP, NULL),
-- Task 2: MRP Automation - Blocked
(2, 1, 'OCR Pipeline Integration', 'Menghubungkan pipeline OCR dengan server monitoring', 'BLOCKED', 'HIGH', DATE_ADD(CURRENT_DATE, INTERVAL 22 HOUR), 240, 60, 20, 'Menunggu persetujuan API key dan kredensial server produksi', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), NULL),
-- Task 3: MRP Automation - Done
(3, 1, 'Design workflow logic', 'Merancang diagram alir eksekusi cron job dan deteksi anomaly', 'DONE', 'MEDIUM', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 120, 150, 100, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)),

-- Task 4: Vendor Performance - Todo
(4, 2, 'Create SLA Calculation API', 'Endpoint backend untuk menghitung delay dan persentase kelulusan SLA', 'TODO', 'MEDIUM', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 180, 0, 0, NULL, CURRENT_TIMESTAMP, NULL),
-- Task 5: Vendor Performance - Overdue In-Progress (Overdue indicator in UI!)
(5, 2, 'Design High-Fidelity Dashboard', 'Desain wireframe dan mockup visual dashboard untuk presentasi', 'IN_PROGRESS', 'URGENT', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 HOUR), 360, 420, 85, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 HOUR), NULL),

-- Task 6: Home Expense Hub - Done
(6, 3, 'Create DB Range Testing', 'Membuat test suite untuk validasi transaksi multi-wallet', 'DONE', 'HIGH', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 90, 80, 100, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)),
-- Task 7: Home Expense Hub - Done
(7, 3, 'Deploy Docker on arisserver', 'Packaging project dan setup docker-compose di arisserver', 'DONE', 'MEDIUM', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 120, 100, 100, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)),

-- Task 8: No Project (Standalone) - Overdue Todo
(8, NULL, 'Beli Kopi Arabika Lintong', 'Stok kopi habis, beli di Tokopedia', 'TODO', 'LOW', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 15, 0, 0, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), NULL),
-- Task 9: Standalone - Backlog
(9, NULL, 'Refactor code-review scripts', 'Merapikan workflow github action untuk standard checks', 'BACKLOG', 'LOW', NULL, 120, 0, 0, NULL, CURRENT_TIMESTAMP, NULL);

-- 4. Insert Subtasks
INSERT INTO subtasks (id, task_id, title, status, completed_at) VALUES
(1, 1, 'Design workflow', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 HOUR)),
(2, 1, 'Create API', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 HOUR)),
(3, 1, 'Connect database', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR)),
(4, 1, 'Testing', 'TODO', NULL),
(5, 1, 'Deployment', 'TODO', NULL),

(6, 2, 'Prepare mock API', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 12 HOUR)),
(7, 2, 'Integrate OCR binary', 'TODO', NULL),

(8, 5, 'Analyze layout requirements', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)),
(9, 5, 'Create Figma variables', 'DONE', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 12 HOUR)),
(10, 5, 'Design cards & charts view', 'TODO', NULL);

-- 5. Insert Task Activity History (for authentic audit trails)
INSERT INTO task_activity (task_id, action, old_value, new_value, source) VALUES
(1, 'TASK_CREATED', NULL, 'Created via Web Interface', 'WEB'),
(1, 'STATUS_CHANGED', 'TODO', 'IN_PROGRESS', 'WEB'),
(1, 'PROGRESS_UPDATED', '0', '40', 'WEB'),
(1, 'PROGRESS_UPDATED', '40', '70', 'WEB'),

(2, 'TASK_CREATED', NULL, 'Created via Hermes Agent', 'HERMES'),
(2, 'STATUS_CHANGED', 'TODO', 'BLOCKED', 'WEB'),

(3, 'TASK_CREATED', NULL, 'Created via Web Interface', 'WEB'),
(3, 'STATUS_CHANGED', 'TODO', 'IN_PROGRESS', 'WEB'),
(3, 'STATUS_CHANGED', 'IN_PROGRESS', 'DONE', 'WEB'),

(5, 'TASK_CREATED', NULL, 'Created via Hermes Agent', 'HERMES'),
(5, 'STATUS_CHANGED', 'TODO', 'IN_PROGRESS', 'HERMES'),
(5, 'PROGRESS_UPDATED', '0', '50', 'HERMES'),
(5, 'PROGRESS_UPDATED', '50', '85', 'WEB'),

(8, 'TASK_CREATED', NULL, 'Created via Telegram command "catat kopi lintong besok"', 'HERMES');
