# order-service/Dockerfile — Branch 03 Pasar Scale (3 container + hostname)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false 2>/dev/null || npm install
COPY shared/ ./shared/
COPY order-service/src/ ./order-service/src/
COPY tsconfig.json ./
EXPOSE 3001
ENV PORT=3001
ENV LOG_LEVEL=info
ENV NODE_ENV=production
CMD ["npx", "tsx", "order-service/src/index.ts"]
