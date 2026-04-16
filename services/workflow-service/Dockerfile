ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
FROM ${NODE_IMAGE}
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=https://registry.npmmirror.com
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY services/workflow-service/package.json ./services/workflow-service/package.json
RUN pnpm install --filter workflow-service... --prod --frozen-lockfile=false
COPY services/workflow-service ./services/workflow-service
WORKDIR /app/services/workflow-service
EXPOSE 3001
CMD ["pnpm", "start"]
