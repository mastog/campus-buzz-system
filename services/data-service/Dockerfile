FROM crpi-3nvv9hswpq97xz8s.cn-beijing.personal.cr.aliyuncs.com/cloud_computing_lab/cloud_computing_lab:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY services/data-service/package.json ./services/data-service/package.json
RUN pnpm install --filter data-service... --prod --frozen-lockfile=false
COPY services/data-service ./services/data-service
WORKDIR /app/services/data-service
EXPOSE 3002
CMD ["pnpm", "start"]
