# -----------------------
# 1단계: Vue 앱 빌드
# -----------------------
FROM node:20-alpine AS builder

# 작업 디렉토리
WORKDIR /app

# package.json, lock 파일 먼저 복사 (캐시 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm install

# 나머지 소스 복사
COPY . .

# Vue 빌드
RUN npm run build

# -----------------------
# 2단계: Nginx로 정적 서빙
# -----------------------
FROM nginx:alpine

# 빌드된 결과 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 커스텀 Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80 포트 열기
EXPOSE 80

# 컨테이너 시작 시 Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
