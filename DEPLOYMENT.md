# 服务器部署指南

## 服务器：senlinlb.online

### 前提条件
- 服务器已安装 Docker 和 Docker Compose
- 已安装 git
- 已配置好防火墙（开放 3000 端口）

---

## 部署步骤

### 1. SSH 连接到服务器

```bash
ssh root@senlinlb.online
```

### 2. 克隆代码仓库

```bash
# 安装 git（如果还没有）
apt update && apt install -y git

# 克隆仓库
cd /root
git clone https://github.com/xiaokaikiss-cmd/huoshanZuizhong.git
cd huoshanZuizhong
```

### 3. 配置环境变量

创建 `.env` 文件：
```bash
cat > .env << 'EOF'
WETOKEN_API_KEY=sk-r3SSYzEONOmDlNQ05phP5KYKfNcc8XyhMhBGWArWXJb833kD
SUPABASE_URL=https://zkbkvavddgwbpiigpiau.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VocQaRZ4XzU3HHpnkm4uTQ_yxGo9ADU
EOF
```

### 4. 启动容器

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f app
```

### 5. 配置 Nginx 反向代理（推荐）

创建 Nginx 配置文件 `/etc/nginx/sites-available/senlinlb.online`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name senlinlb.online www.senlinlb.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/senlinlb.online /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 6. 配置 HTTPS（SSL 证书）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取并自动配置 SSL 证书
certbot --nginx -d senlinlb.online -d www.senlinlb.online
```

---

## 常用管理命令

### 查看运行状态
```bash
docker-compose ps
```

### 查看日志
```bash
docker-compose logs -f app
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新代码
```bash
cd /root/huoshanZuizhong
git pull
docker-compose up -d --build
```

---

## 故障排查

### 端口被占用
```bash
# 查看 3000 端口占用
netstat -tlnp | grep 3000

# 杀死占用进程
kill -9 <PID>
```

### 容器启动失败
```bash
# 查看详细日志
docker-compose logs app --tail 100

# 查看容器状态
docker ps -a
```

### Nginx 配置错误
```bash
# 查看错误日志
tail -f /var/log/nginx/error.log
```

---

## 性能优化建议

1. **启用 Nginx Gzip 压缩**
   在 Nginx 配置中添加：
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **配置 CDN**
   使用 Cloudflare 或阿里云 CDN 加速静态资源

3. **配置 PM2（如果不使用 Docker）**
   ```bash
   pnpm install -g pm2
   pm2 start npm --name "app" -- start
   pm2 save
   pm2 startup
   ```

---

## 备份建议

### 数据库备份
```bash
# 定期备份 Supabase 数据
```

### 容器备份
```bash
# 导出镜像
docker save -o huoshan-app.tar huoshan-app:latest
```

### 配置备份
```bash
# 备份 .env 文件
cp /root/huoshanZuizhong/.env /root/.env.backup
```

---

## 安全建议

1. **定期更新系统**
   ```bash
   apt update && apt upgrade -y
   ```

2. **配置防火墙**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **设置 SSH 密钥登录**
   ```bash
   # 在本地生成密钥
   ssh-keygen -t rsa -b 4096

   # 复制公钥到服务器
   ssh-copy-id root@senlinlb.online
   ```

---

## 联系方式

如有问题，请联系技术支持或查看项目文档。
