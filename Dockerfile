FROM node:22-alpine AS frontend
WORKDIR /build
COPY secondChance-frontend/package*.json ./
RUN npm ci
COPY secondChance-frontend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/secondChance-backend
COPY secondChance-backend/package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node secondChance-backend/ ./
COPY --from=frontend --chown=node:node /build/build /app/secondChance-frontend/build
USER node
ENV NODE_ENV=production PORT=3060
EXPOSE 3060
CMD ["node", "app.js"]
