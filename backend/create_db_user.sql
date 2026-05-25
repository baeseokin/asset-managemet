-- 데이터베이스 생성 (존재하지 않을 경우)
CREATE DATABASE IF NOT EXISTS `assetdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. localhost 접속용 사용자 생성 및 권한 부여 (테이블 생성 및 조회/수정 권한)
CREATE USER IF NOT EXISTS 'assetuser'@'localhost' IDENTIFIED BY 'assetpass';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES ON `assetdb`.* TO 'assetuser'@'localhost';

-- 2. 외부(%) 접속용 사용자 생성 및 권한 부여 (필요 시)
CREATE USER IF NOT EXISTS 'assetuser'@'%' IDENTIFIED BY 'assetpass';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES ON `assetdb`.* TO 'assetuser'@'%';

-- 권한 적용
FLUSH PRIVILEGES;
