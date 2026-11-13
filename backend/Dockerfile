# Build TypeScript → rulează API pe port 4000
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY database ./database
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core g++ gcc python3 fpc \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY database ./database
RUN mkdir -p storage/grile-invoices storage/course-invoices storage/bac-invoices storage/meditations-invoices
EXPOSE 4000
CMD ["node", "dist/index.js"]
