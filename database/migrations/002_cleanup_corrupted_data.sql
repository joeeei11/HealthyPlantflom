-- ============================================================
-- Migration: 002_cleanup_corrupted_data.sql
-- 描述: 清理字符集污染产生的乱码数据 + 无效日期的预约记录
-- 执行方式: mysql -u root -p mental_health < 002_cleanup_corrupted_data.sql
-- 注意: 此文件只清除测试数据，不修改任何表结构
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Step 1: 查看当前所有咨询师档案（执行前先确认哪些需要清除）
-- ------------------------------------------------------------
SELECT
  cp.id          AS profile_id,
  u.id           AS user_id,
  u.username,
  u.email,
  cp.real_name,
  cp.title,
  cp.bio
FROM counselor_profiles cp
JOIN users u ON u.id = cp.user_id;

-- ------------------------------------------------------------
-- Step 2: 查看所有预约记录（检查异常日期）
-- ------------------------------------------------------------
SELECT
  id,
  student_id,
  counselor_id,
  appointment_date,
  start_time,
  end_time,
  status
FROM appointments
ORDER BY appointment_date;

-- ------------------------------------------------------------
-- Step 3: 删除日期异常的预约（0001-01-01 是无效测试数据）
-- ------------------------------------------------------------
DELETE FROM appointments
WHERE appointment_date < '2000-01-01';

-- ------------------------------------------------------------
-- Step 4: 删除乱码的咨询师档案
-- 条件：real_name 中含非法 UTF-8 字节（被替换为 0xEFBFBD）
--       或者 real_name 与 CONVERT 后结果不一致（说明存储编码有误）
-- 如果以上语法不被支持，可手动指定需要删除的 user_id：
--   DELETE FROM counselor_profiles WHERE user_id IN (2, 3, 4);
-- ------------------------------------------------------------
DELETE FROM counselor_profiles
WHERE CONVERT(real_name USING utf8mb4) IS NULL
   OR HEX(real_name) LIKE '%EFBFBD%';

-- ------------------------------------------------------------
-- Step 5: 删除已无 profile 的 counselor 用户账号（可选）
-- 只删除没有 counselor_profiles 记录的 counselor 用户
-- 请先确认 SELECT 结果，再决定是否执行 DELETE
-- ------------------------------------------------------------
SELECT u.id, u.username, u.email
FROM users u
LEFT JOIN counselor_profiles cp ON cp.user_id = u.id
WHERE u.role = 'counselor'
  AND cp.id IS NULL;

-- 确认无误后取消下方注释执行：
-- DELETE u FROM users u
-- LEFT JOIN counselor_profiles cp ON cp.user_id = u.id
-- WHERE u.role = 'counselor'
--   AND cp.id IS NULL;

-- ------------------------------------------------------------
-- 完成
-- ------------------------------------------------------------
SELECT '002_cleanup_corrupted_data.sql executed successfully.' AS result;
