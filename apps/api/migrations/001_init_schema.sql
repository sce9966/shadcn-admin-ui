-- NovaOps 初版 Schema（对齐当前 TypeORM Entity）
-- 适用：生产或关闭 synchronize 的环境；开发期默认 NODE_ENV=development 使用 synchronize。
-- 用法示例：
--   mysql -u <user> -p -e "CREATE DATABASE novaops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u <user> -p novaops < apps/api/migrations/001_init_schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `organizations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `slug` varchar(64) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_organizations_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `title` varchar(128) DEFAULT NULL,
  `bio` text,
  `role` enum('admin','ops','viewer') NOT NULL DEFAULT 'ops',
  `status` enum('active','invited','disabled') NOT NULL DEFAULT 'active',
  `invite_note` varchar(512) DEFAULT NULL,
  `invite_expires_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `mfa_enabled` tinyint(4) NOT NULL DEFAULT '0',
  `idle_logout` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_org` (`organization_id`),
  KEY `idx_users_org_status` (`organization_id`,`status`),
  KEY `idx_users_org_role` (`organization_id`,`role`),
  CONSTRAINT `FK_users_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `token_jti` varchar(64) NOT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_sessions_token_jti` (`token_jti`),
  KEY `idx_sessions_user` (`user_id`,`revoked_at`),
  CONSTRAINT `FK_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `user_id` bigint(20) NOT NULL,
  `notify_security` tinyint(4) NOT NULL DEFAULT '1',
  `notify_invite` tinyint(4) NOT NULL DEFAULT '1',
  `notify_weekly` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `FK_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
