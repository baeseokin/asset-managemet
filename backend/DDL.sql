CREATE DATABASE IF NOT EXISTS `assetdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `assetdb`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in dependency order
DROP TABLE IF EXISTS `asset_maintenance`;
DROP TABLE IF EXISTS `asset_change_requests`;
DROP TABLE IF EXISTS `asset_requests`;
DROP TABLE IF EXISTS `asset_history`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `assets`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `locations`;
DROP TABLE IF EXISTS `categories`;

-- roles definition
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- departments definition
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(100) NOT NULL,
  `parent_dept_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dept_name` (`dept_name`),
  KEY `parent_dept_id` (`parent_dept_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`parent_dept_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- users definition
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `user_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dept_name` varchar(100) DEFAULT NULL,
  `kakao_id` varchar(50) DEFAULT NULL,
  `must_change_password` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `kakao_id` (`kakao_id`),
  KEY `dept_name` (`dept_name`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`dept_name`) REFERENCES `departments` (`dept_name`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_roles definition
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- locations definition
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `location_name` (`location_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- categories definition
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- assets definition
CREATE TABLE IF NOT EXISTS `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_name` varchar(100) NOT NULL,
  `category_name` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'available', -- 'available', 'in_use', 'under_maintenance', 'disposed', 'lost'
  `serial_number` varchar(100) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT NULL,
  `purchase_source` varchar(150) DEFAULT NULL,
  `receipt_image_url` varchar(255) DEFAULT NULL,
  `useful_life_years` int(11) DEFAULT 5,
  `is_consumable` tinyint(1) DEFAULT 0,
  `stock_quantity` int(11) DEFAULT 0,
  `location` varchar(150) DEFAULT NULL,
  `dept_name` varchar(100) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `manager_contact` varchar(50) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  UNIQUE KEY `item_code` (`item_code`),
  KEY `dept_name` (`dept_name`),
  KEY `category_name` (`category_name`),
  KEY `location` (`location`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`dept_name`) REFERENCES `departments` (`dept_name`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`category_name`) REFERENCES `categories` (`category_name`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_3` FOREIGN KEY (`location`) REFERENCES `locations` (`location_name`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- asset_change_requests definition
CREATE TABLE IF NOT EXISTS `asset_change_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_type` varchar(20) NOT NULL, -- 'register', 'modify', 'dispose', 'delete'
  `asset_id` int(11) DEFAULT NULL,
  `requester_id` int(11) NOT NULL,
  `requested_data` text NOT NULL, -- JSON string containing asset field updates
  `status` varchar(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  `reject_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `requester_id` (`requester_id`),
  CONSTRAINT `asset_change_requests_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_change_requests_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- asset_maintenance definition
CREATE TABLE IF NOT EXISTS `asset_maintenance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `maintenance_date` date NOT NULL,
  `maintenance_type` varchar(50) DEFAULT 'repair', -- 'repair', 'inspection', 'calibration'
  `cost` decimal(12,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `handler_name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `asset_maintenance_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- asset_history definition
CREATE TABLE IF NOT EXISTS `asset_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL, -- 'created', 'status_changed', 'rented', 'returned', 'repaired', 'disposed', 'change_requested'
  `description` text DEFAULT NULL,
  `action_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `asset_history_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
