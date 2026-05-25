#!/bin/bash

# 설정
NODE_PATH="/Users/baeseokin/.asdf/installs/nodejs/24.4.1/bin/node"
SCRIPT="server.js"
LOG_FILE="server.log"

# 해당 디렉토리로 이동 (스크립트 위치 기준)
cd "$(dirname "$0")"

echo "------------------------------------------"
echo "📅 실행 일시: $(date)"

# 1️⃣ 실행 중인 프로세스 찾기 (정확한 매칭을 위해 SCRIPT 파일명 검색)
PID=$(ps -ef | grep "$SCRIPT" | grep -v grep | awk '{print $2}')

if [ -n "$PID" ]; then
  echo "🔴 기존 프로세스 종료 중... (PID: $PID)"
  kill -9 $PID
  sleep 1
else
  echo "🟢 기존 프로세스 없음"
fi

# 2️⃣ 새로 실행
if [ -f "$NODE_PATH" ]; then
  echo "🚀 서버 시작 중... (Log: $LOG_FILE)"
  nohup "$NODE_PATH" "$SCRIPT" > "$LOG_FILE" 2>&1 &
  
  # 잠시 대기 후 PID 확인
  sleep 1
  NEW_PID=$(ps -ef | grep "$SCRIPT" | grep -v grep | awk '{print $2}')
  if [ -n "$NEW_PID" ]; then
    echo "✅ 서버가 정상적으로 시작되었습니다. (New PID: $NEW_PID)"
    echo "📜 로그를 보려면 다음 명령어를 입력하세요: tail -f $LOG_FILE"
  else
    echo "❌ 서버 시작 실패. $LOG_FILE 확인이 필요합니다."
  fi
else
  echo "❌ 에러: 지정된 노드 경로를 찾을 수 없습니다: $NODE_PATH"
  exit 1
fi
echo "------------------------------------------"
