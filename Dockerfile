# 使用官方的 Node.js 镜像作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /neuroxiv_html

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制整个项目到工作目录
COPY . .

# 构建生产环境的Vue 3项目
RUN npm run build

# 暴露容器的端口号（根据你的Vue项目配置确定）
EXPOSE 8081

# 启动应用
CMD ["npm", "run", "serve"]
