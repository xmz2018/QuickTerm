# Dockerfile for the React application

# ---- Base Stage ----
# 使用一个轻量级的 Node.js 镜像作为基础
FROM node:18-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
# 复制 package.json 和 package-lock.json
# 我们将在这里安装所有依赖，包括构建时需要的开发依赖
FROM base AS dependencies
COPY package.json package-lock.json* ./
# 运行 npm install 来安装所有依赖项
# 这会确保为容器的 Linux 环境安装正确的包
RUN npm install

# ---- Build Stage ----
# 在这里构建我们的应用
# 我们从 "dependencies" 阶段继续，这样就能使用已经安装好的 node_modules
FROM dependencies AS build
# 复制项目中的所有其他文件（源代码等）
COPY . .
# 运行 build 命令来打包和优化应用
RUN npm run build

# ---- Production Stage ----
# 这是我们最终的生产镜像
# 使用一个非常轻量级的 Nginx 镜像
FROM nginx:stable-alpine AS production

# 从 build 阶段复制构建好的静态文件到 Nginx 的 web 目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制自定义的 Nginx 配置文件
# 这个文件将告诉 Nginx 如何处理我们的单页应用
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露容器的 80 端口
# 稍后我们会把这个端口映射到我们主机的 8333 端口
EXPOSE 80

# 启动 Nginx 服务器
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8333/health || exit 1

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1
  
