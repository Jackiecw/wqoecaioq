# ./backend/Dockerfile

# 1. 使用一个轻量级的 Node 镜像
FROM node:20-alpine

# 2. 在容器内创建一个工作目录
WORKDIR /app

# 3. 复制 package.json 和 lock 文件
COPY package*.json ./

# 4. (关键修复) 运行安装，但跳过 postinstall 脚本
RUN npm install --omit=dev --ignore-scripts

# 5. 复制所有后端代码 (现在 prisma/schema.prisma 进来了)
COPY . .

# 6. (关键) 现在我们可以安全地手动运行 prisma generate
RUN npx prisma generate

# 7. 暴露容器内部端口
EXPOSE 3000

# 8. 启动服务
# 说明：线上环境已存在旧的失败迁移记录，会导致 migrate deploy 持续失败并重启。
# 这里改为直接启动应用，若需迁移请手动在本地清理后执行。
CMD ["sh", "-c", "npm start"]
