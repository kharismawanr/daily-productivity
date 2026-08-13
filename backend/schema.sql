-- schema.sql
-- DDL for Hermes Daily Productivity Dashboard

CREATE DATABASE IF NOT EXISTS daily_productivity;
USE daily_productivity;

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    deadline DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at DATETIME NULL
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE') NOT NULL DEFAULT 'TODO',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    deadline DATETIME NULL,
    estimated_minutes INT NULL,
    actual_minutes INT NULL,
    progress_percent TINYINT NOT NULL DEFAULT 0,
    blocker_reason TEXT NULL,
    last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Table: subtasks
CREATE TABLE IF NOT EXISTS subtasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('TODO', 'DONE') NOT NULL DEFAULT 'TODO',
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Table: task_activity
CREATE TABLE IF NOT EXISTS task_activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    source ENUM('WEB', 'HERMES', 'SYSTEM') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Table: hermes_conversations
CREATE TABLE IF NOT EXISTS hermes_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hermes_conv_session (session_id),
    INDEX idx_hermes_conv_created (created_at)
);

-- Table: api_keys (untuk autentikasi Hermes Agent / pihak ketiga)
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Grant privileges on daily_productivity to casaos user
GRANT ALL PRIVILEGES ON daily_productivity.* TO 'casaos'@'%';
FLUSH PRIVILEGES;
