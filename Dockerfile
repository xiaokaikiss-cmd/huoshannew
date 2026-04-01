FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件并安装（这层会被缓存）
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 再复制源代码（这层改变时才重新构建）
COPY . .

# 构建项目
RUN pnpm build

# 复制public到standalone
RUN cp -r public .next/standalone/

# 清理旧缓存并复制所有static文件
RUN rm -rf .next/cache && \
    rm -rf .next/standalone/.next/static && \
    mkdir -p .next/standalone/.next/static && \
    cp -r .next/static/. .next/standalone/.next/static/

EXPOSE 3000

# 启动时监听所有接口
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node .next/standalone/server.js"]
