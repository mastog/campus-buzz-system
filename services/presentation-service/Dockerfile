FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY services/presentation-service/package.json ./services/presentation-service/package.json
RUN pnpm install --filter presentation-service... --prod --frozen-lockfile=false
COPY services/presentation-service ./services/presentation-service
WORKDIR /app/services/presentation-service
EXPOSE 3000
CMD ["pnpm", "start"]
