# Step 1: Node.js 환경
FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN chown -R node:node /app

USER node

EXPOSE 3003

CMD ["node", "server.js"]
