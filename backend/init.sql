USE `assetdb`;

-- Roles seeding
INSERT INTO `roles` (`id`, `role_name`) VALUES 
(1, '관리자'),
(2, '사용자'),
(3, '자산담당')
ON DUPLICATE KEY UPDATE `role_name`=VALUES(`role_name`);

-- Departments seeding
INSERT INTO `departments` (`id`, `dept_name`, `parent_dept_id`) VALUES
(1, '교회', NULL),
(2, '재정부', 1),
(3, '관리부', 1),
(4, '미디어팀', 1),
(5, '청년부', 1)
ON DUPLICATE KEY UPDATE `dept_name`=VALUES(`dept_name`), `parent_dept_id`=VALUES(`parent_dept_id`);

-- Default users seeding
-- admin: password is 'admin1234' (hash: $2b$10$qHL1YqktyS6pSW2lcPuktOvxpqjoBXoK97ZC.PozBsBLpo43X3Jd2) - Dept: 재정부
-- manager: password is 'admin1234' (hash: $2b$10$qHL1YqktyS6pSW2lcPuktOvxpqjoBXoK97ZC.PozBsBLpo43X3Jd2) - Dept: 관리부
-- user01: password is 'user1234' (hash: $2b$10$8SCRNTAdX.pcbLrLrpupquubryMcas5vvFRWXsl9c7ib6gqFpA636) - Dept: 청년부
-- user02: password is 'user1234' (hash: $2b$10$ex4X5f8RJ.y5B0fpXYngv.Cd/DhecMIhgdCLTmU6if01Jb9Fux/PG) - Dept: 미디어팀
INSERT INTO `users` (`id`, `user_id`, `password_hash`, `is_approved`, `user_name`, `email`, `phone`, `dept_name`, `must_change_password`) VALUES
(1, 'admin', '$2b$10$qHL1YqktyS6pSW2lcPuktOvxpqjoBXoK97ZC.PozBsBLpo43X3Jd2', 1, '재정부장(관리자)', 'admin@church.org', '010-1234-5678', '재정부', 0),
(2, 'manager', '$2b$10$qHL1YqktyS6pSW2lcPuktOvxpqjoBXoK97ZC.PozBsBLpo43X3Jd2', 1, '자산담당자(관리부)', 'manager@church.org', '010-2222-3333', '관리부', 0),
(3, 'user01', '$2b$10$8SCRNTAdX.pcbLrLrpupquubryMcas5vvFRWXsl9c7ib6gqFpA636', 1, '김철수', 'chulsoo@example.com', '010-9876-5432', '청년부', 0),
(4, 'user02', '$2b$10$ex4X5f8RJ.y5B0fpXYngv.Cd/DhecMIhgdCLTmU6if01Jb9Fux/PG', 0, '홍길동', 'gildong@example.com', '010-5555-5555', '미디어팀', 0)
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`), `password_hash`=VALUES(`password_hash`), `dept_name`=VALUES(`dept_name`);

-- Assign User Roles
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1), -- admin -> 관리자
(1, 2), -- admin -> 사용자
(2, 3), -- manager -> 자산담당
(2, 2), -- manager -> 사용자
(3, 2), -- user01 -> 사용자
(4, 2)  -- user02 -> 사용자
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);

-- Locations seeding
INSERT INTO `locations` (`id`, `location_name`, `description`) VALUES
(1, '본당 1층', '본당 예배실'),
(2, '자막실', '2층 자막실'),
(3, '방송실', '3층 방송 조정실'),
(4, '새가족실', '1층 새가족실'),
(5, '사무실', '사무행정 구역')
ON DUPLICATE KEY UPDATE `location_name`=VALUES(`location_name`);

-- Categories seeding
INSERT INTO `categories` (`id`, `category_name`, `description`) VALUES
(1, '방송 장비', '카메라, 마이크, 믹서 등'),
(2, '악기', '피아노, 신디사이저, 드럼 등'),
(3, '가구', '책상, 의자, 강대상 등'),
(4, '전자기기', 'PC, 노트북, 태블릿 등'),
(5, '차량', '교회 승합차, 버스 등'),
(6, '서적', '도서 및 성경책 등')
ON DUPLICATE KEY UPDATE `category_name`=VALUES(`category_name`);

-- Mock assets seeding
INSERT INTO `assets` (`id`, `asset_name`, `category_name`, `status`, `serial_number`, `item_code`, `purchase_date`, `purchase_price`, `purchase_source`, `receipt_image_url`, `useful_life_years`, `is_consumable`, `stock_quantity`, `location`, `dept_name`, `manager_name`, `manager_contact`, `description`) VALUES
(1, 'SHURE SM58 Dynamic Mic', '방송 장비', 'available', 'SN-SHURE-SM58-01', 'ITM-2026-0001', '2026-01-10', 150000.00, '낙원상가 음향사', NULL, 5, 0, 0, '방송실', '관리부', '자산담당자(관리부)', '010-2222-3333', '예배용 다이나믹 마이크 SHURE SM58 1호기'),
(2, 'Yamaha P-125 Digital Piano', '악기', 'available', 'SN-YAMAHA-P125-02', 'ITM-2026-0002', '2026-02-15', 850000.00, '야마하 직영점', NULL, 7, 0, 0, '본당 1층', '관리부', '자산담당자(관리부)', '010-2222-3333', '본당 반주용 디지털 피아노'),
(3, 'Premium Walnut Desk', '가구', 'available', 'SN-DESK-WALNUT-03', 'ITM-2026-0003', '2026-03-01', 500000.00, '한샘가구', NULL, 10, 0, 0, '사무실', '재정부', '재정부장(관리자)', '010-1234-5678', '사무실 재정부 데스크'),
(4, 'iMac 24" M3 (Pink)', '전자기기', 'available', 'SN-IMAC24-M3-04', 'ITM-2026-0004', '2026-01-20', 1850000.00, '애플 스토어', NULL, 4, 0, 0, '자막실', '관리부', '자산담당자(관리부)', '010-2222-3333', '자막 작업용 아이맥 M3 8GB 256GB'),
(5, 'AA Alkaline Battery Pack', '방송 장비', 'available', 'SN-BATT-AA-05', 'ITM-2026-0005', '2026-05-10', 12000.00, '다이소', NULL, 1, 1, 3, '방송실', '관리부', '자산담당자(관리부)', '010-2222-3333', '무선 마이크용 AA 배터리 묶음 (소모품 수량 경고용)')
ON DUPLICATE KEY UPDATE `asset_name`=VALUES(`asset_name`), `category_name`=VALUES(`category_name`), `status`=VALUES(`status`), `item_code`=VALUES(`item_code`);
