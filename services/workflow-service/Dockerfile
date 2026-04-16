FROM crpi-3nvv9hswpq97xz8s.cn-beijing.personal.cr.aliyuncs.com/cloud_computing_lab/cloud_computing_lab:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY services/workflow-service/package.json ./services/workflow-service/package.json
RUN pnpm install --filter workflow-service... --prod --frozen-lockfile=false
COPY services/workflow-service ./services/workflow-service
WORKDIR /app/services/workflow-service
EXPOSE 3001
CMD ["pnpm", "start"]
