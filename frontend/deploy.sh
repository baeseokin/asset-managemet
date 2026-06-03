#!/bin/bash

# 사용법: ./deploy.sh <VERSION>
# 예시: ./deploy.sh 0.1

# 1. 버전 파라미터 확인
if [ -z "$1" ]; then
  echo "❌ 사용법: $0 <VERSION>"
  exit 1
fi

VERSION=$1
IMAGE_NAME="baeseokin/asset-management-frontend"

echo "🚀 asset-management-frontend 배포 시작 (버전: $VERSION)..."

# 2. Docker Buildx 환경 확인/생성
if ! docker buildx inspect multiarch-builder >/dev/null 2>&1; then
  echo "🔧 buildx 빌더 생성 중..."
  docker buildx create --name multiarch-builder --use
  docker buildx inspect --bootstrap
fi

# 3. 멀티 아키텍처 이미지 빌드 & 푸시
echo "📦 멀티 아키텍처 이미지 빌드 중 (linux/amd64, linux/arm64)..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $IMAGE_NAME:$VERSION \
  --push .

if [ $? -ne 0 ]; then
  echo "❌ 이미지 빌드 실패!"
  exit 1
fi

# 4. Kubernetes Deployment 업데이트
echo "📡 Kubernetes 배포 업데이트..."

# 네임스페이스가 없으면 생성
kubectl create namespace asset-management --dry-run=client -o yaml | kubectl apply -f -

# 매니페스트 파일의 이미지를 현재 버전으로 변경하여 배포 (항상 apply 수행하여 YAML 변경사항 반영)
sed "s|image: $IMAGE_NAME:.*|image: $IMAGE_NAME:$VERSION|g" ../k8s/asset-management-frontend.yaml | kubectl apply -f -

# 같은 태그일 경우 이미지가 갱신되지 않을 수 있으므로 재시작 강제 수행
kubectl rollout restart deployment/asset-management-frontend -n asset-management

echo "✅ asset-management-frontend 배포 완료!"
