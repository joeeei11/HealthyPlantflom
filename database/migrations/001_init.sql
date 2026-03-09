-- ============================================================
-- Migration: 001_init.sql
-- 描述: 初始化所有业务表
-- 执行方式: mysql -u root -p mental_health < 001_init.sql
-- 幂等: 所有语句使用 IF NOT EXISTS，可重复执行
-- ============================================================

-- 确保使用 utf8mb4 字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- 1. users — 统一用户表（三端共用）
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)   NOT NULL COMMENT '登录用户名',
  `email`         VARCHAR(100)  NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255)  NOT NULL COMMENT 'bcrypt 哈希密码',
  `role`          ENUM('student', 'counselor', 'school') NOT NULL COMMENT '角色',
  `is_active`     TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '账户是否启用',
  `avatar_url`    VARCHAR(255)  DEFAULT NULL COMMENT '头像 URL',
  `last_login_at` DATETIME      DEFAULT NULL COMMENT '最后登录时间',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一用户表';

-- ============================================================
-- 2. student_profiles — 学生扩展信息
-- ============================================================
CREATE TABLE IF NOT EXISTS `student_profiles` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `user_id`           INT          NOT NULL COMMENT '关联 users.id',
  `real_name`         VARCHAR(50)  NOT NULL COMMENT '真实姓名',
  `student_no`        VARCHAR(20)  DEFAULT NULL COMMENT '学号',
  `gender`            ENUM('male', 'female', 'other') DEFAULT NULL,
  `grade`             VARCHAR(20)  DEFAULT NULL COMMENT '年级，如 2024级',
  `major`             VARCHAR(100) DEFAULT NULL COMMENT '专业',
  `college`           VARCHAR(100) DEFAULT NULL COMMENT '学院',
  `phone`             VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
  `emergency_contact` VARCHAR(50)  DEFAULT NULL COMMENT '紧急联系人姓名',
  `emergency_phone`   VARCHAR(20)  DEFAULT NULL COMMENT '紧急联系人电话',
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_student_no` (`student_no`),
  KEY `idx_college_grade` (`college`, `grade`),
  CONSTRAINT `fk_sp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生扩展信息';

-- ============================================================
-- 3. counselor_profiles — 咨询师扩展信息
-- ============================================================
CREATE TABLE IF NOT EXISTS `counselor_profiles` (
  `id`                       INT          NOT NULL AUTO_INCREMENT,
  `user_id`                  INT          NOT NULL COMMENT '关联 users.id',
  `real_name`                VARCHAR(50)  NOT NULL COMMENT '真实姓名',
  `gender`                   ENUM('male', 'female', 'other') DEFAULT NULL,
  `title`                    VARCHAR(50)  DEFAULT NULL COMMENT '职称，如 副教授、心理咨询师',
  `qualification`            VARCHAR(255) DEFAULT NULL COMMENT '资质证书描述',
  `specialties`              JSON         DEFAULT NULL COMMENT '擅长方向，JSON 数组，如 ["焦虑","抑郁"]',
  `bio`                      TEXT         DEFAULT NULL COMMENT '个人简介',
  `available_slots`          JSON         DEFAULT NULL COMMENT '可预约时段，JSON 结构，如 {"Mon":["09:00-10:00"]}',
  `max_appointments_per_day` INT          NOT NULL DEFAULT 8 COMMENT '每日最大接诊数',
  `phone`                    VARCHAR(20)  DEFAULT NULL COMMENT '工作电话',
  `is_accepting`             TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '当前是否接受预约',
  `created_at`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_is_accepting` (`is_accepting`),
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询师扩展信息';

-- ============================================================
-- 4. appointments — 预约记录
-- ============================================================
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `student_id`       INT          NOT NULL COMMENT '学生 user_id',
  `counselor_id`     INT          NOT NULL COMMENT '咨询师 user_id',
  `appointment_date` DATE         NOT NULL COMMENT '预约日期',
  `start_time`       TIME         NOT NULL COMMENT '开始时间',
  `end_time`         TIME         NOT NULL COMMENT '结束时间',
  `type`             ENUM('online', 'offline') NOT NULL DEFAULT 'offline' COMMENT '咨询方式',
  `status`           ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show')
                     NOT NULL DEFAULT 'pending' COMMENT '预约状态',
  `reason`           TEXT         DEFAULT NULL COMMENT '预约原因（学生填写）',
  `cancel_reason`    TEXT         DEFAULT NULL COMMENT '取消原因',
  `cancelled_by`     INT          DEFAULT NULL COMMENT '取消操作者 user_id',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_date_status` (`appointment_date`, `status`),
  KEY `idx_counselor_date` (`counselor_id`, `appointment_date`),
  CONSTRAINT `fk_apt_student`   FOREIGN KEY (`student_id`)   REFERENCES `users` (`id`),
  CONSTRAINT `fk_apt_counselor` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约记录';

-- ============================================================
-- 5. sessions — 实际咨询会话
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`             INT      NOT NULL AUTO_INCREMENT,
  `appointment_id` INT      DEFAULT NULL COMMENT '来源预约 ID，可为空（临时安排）',
  `student_id`     INT      NOT NULL COMMENT '学生 user_id',
  `counselor_id`   INT      NOT NULL COMMENT '咨询师 user_id',
  `type`           ENUM('individual', 'online') NOT NULL DEFAULT 'individual' COMMENT '会话类型',
  `status`         ENUM('in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'in_progress',
  `started_at`     DATETIME DEFAULT NULL COMMENT '会话开始时间',
  `ended_at`       DATETIME DEFAULT NULL COMMENT '会话结束时间',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment_id` (`appointment_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_sess_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sess_student`     FOREIGN KEY (`student_id`)     REFERENCES `users` (`id`),
  CONSTRAINT `fk_sess_counselor`   FOREIGN KEY (`counselor_id`)   REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实际咨询会话';

-- ============================================================
-- 6. session_notes — 咨询师案例笔记
-- ============================================================
CREATE TABLE IF NOT EXISTS `session_notes` (
  `id`                INT         NOT NULL AUTO_INCREMENT,
  `session_id`        INT         NOT NULL COMMENT '关联 sessions.id',
  `counselor_id`      INT         NOT NULL COMMENT '记录人 user_id',
  `content`           TEXT        NOT NULL COMMENT '笔记内容',
  `risk_level`        ENUM('low', 'medium', 'high', 'crisis') NOT NULL DEFAULT 'low' COMMENT '风险等级评估',
  `follow_up_required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要跟进',
  `is_private`        TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '是否仅咨询师可见',
  `created_at`        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_risk_level` (`risk_level`),
  CONSTRAINT `fk_sn_session`   FOREIGN KEY (`session_id`)  REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sn_counselor` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询师案例笔记';

-- ============================================================
-- 7. ai_conversations — AI 对话会话
-- ============================================================
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `student_id` INT          NOT NULL COMMENT '学生 user_id',
  `title`      VARCHAR(255) DEFAULT NULL COMMENT '对话标题（首条消息截取）',
  `status`     ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_ac_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 对话会话';

-- ============================================================
-- 8. ai_messages — AI 对话消息
-- ============================================================
CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id`              INT      NOT NULL AUTO_INCREMENT,
  `conversation_id` INT      NOT NULL COMMENT '关联 ai_conversations.id',
  `role`            ENUM('user', 'assistant') NOT NULL COMMENT '消息来源',
  `content`         TEXT     NOT NULL COMMENT '消息内容',
  `tokens_used`     INT      DEFAULT NULL COMMENT '本条消息消耗的 token 数（assistant 消息有值）',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_role` (`role`),
  CONSTRAINT `fk_am_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 对话消息';

-- ============================================================
-- 9. announcements — 学校公告
-- ============================================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `author_id`   INT          NOT NULL COMMENT '发布人 user_id（school 角色）',
  `title`       VARCHAR(255) NOT NULL COMMENT '公告标题',
  `content`     TEXT         NOT NULL COMMENT '公告内容',
  `target_role` ENUM('all', 'student', 'counselor') NOT NULL DEFAULT 'all' COMMENT '目标受众',
  `is_pinned`   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `published_at` DATETIME    DEFAULT NULL COMMENT '发布时间（NULL 表示草稿）',
  `expires_at`  DATETIME     DEFAULT NULL COMMENT '过期时间（NULL 表示永不过期）',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_target_published` (`target_role`, `published_at`),
  KEY `idx_is_pinned` (`is_pinned`),
  CONSTRAINT `fk_ann_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校公告';

-- ============================================================
-- 10. feedback — 学生对咨询师的评价
-- ============================================================
CREATE TABLE IF NOT EXISTS `feedback` (
  `id`           INT        NOT NULL AUTO_INCREMENT,
  `session_id`   INT        NOT NULL COMMENT '关联 sessions.id',
  `student_id`   INT        NOT NULL COMMENT '评价人 user_id',
  `counselor_id` INT        NOT NULL COMMENT '被评价咨询师 user_id',
  `rating`       TINYINT    NOT NULL COMMENT '评分 1-5',
  `content`      TEXT       DEFAULT NULL COMMENT '文字评价',
  `is_anonymous` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否匿名',
  `created_at`   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_id` (`session_id`) COMMENT '每次会话只能评价一次',
  KEY `idx_student_id` (`student_id`),
  KEY `idx_counselor_id` (`counselor_id`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_fb_session`   FOREIGN KEY (`session_id`)   REFERENCES `sessions` (`id`),
  CONSTRAINT `fk_fb_student`   FOREIGN KEY (`student_id`)   REFERENCES `users` (`id`),
  CONSTRAINT `fk_fb_counselor` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生评价';

-- ============================================================
-- 执行完成提示
-- ============================================================
SELECT 'Migration 001_init.sql executed successfully.' AS result;
