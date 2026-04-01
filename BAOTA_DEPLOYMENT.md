# 宝塔面板部署指南

## 服务器：senlinlb.online

---

## 前提条件
- 已安装宝塔面板
- 已安装 Node.js 20 或更高版本
- 已安装 pnpm

---

## 部署步骤

### 方法一：使用宝塔的 Node.js 项目部署（推荐）

#### 1. 安装 Node.js 管理器

1. 登录宝塔面板
2. 进入【软件商店】
3. 搜索并安装【Node.js 版本管理器】
4. 安装 Node.js 20.x 版本

#### 2. 安装 pnpm

在宝塔的【终端】中执行：
```bash
npm install -g pnpm
```

#### 3. 创建网站

1. 进入【网站】→【添加站点】
2. 填写信息：
   - **域名**：`senlinlb.online`（或 www.senlinlb.online）
   - **根目录**：`/www/wwwroot/senlinlb.online`
   - **PHP版本**：纯静态（或其他，不影响）
3. 点击【提交】

#### 4. 克隆代码

在宝塔【终端】中执行：
```bash
cd /www/wwwroot/senlinlb.online
rm -rf * .*  # 清空目录
git clone https://github.com/xiaokaikiss-cmd/huoshanZuizhong.git .
```

#### 5. 安装依赖

```bash
cd /www/wwwroot/senlinlb.online
pnpm install
```

#### 6. 构建项目

```bash
pnpm build
```

#### 7. 配置环境变量

在宝塔中创建 `.env` 文件：

方法 A：使用宝塔文件管理器
1. 进入【文件】
2. 找到 `/www/wwwroot/senlinlb.online` 目录
3. 新建文件 `.env`
4. 添加以下内容：
```
WETOKEN_API_KEY=sk-r3SSYzEONOmDlNQ05phP5KYKfNcc8XyhMhBGWArWXJb833kD
SUPABASE_URL=https://zkbkvavddgwbpiigpiau.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VocQaRZ4XzU3HHpnkm4uTQ_yxGo9ADU
```

方法 B：使用终端
```bash
cat > /www/wwwroot/senlinlb.online/.env << 'EOF'
WETOKEN_API_KEY=sk-r3SSYzEONOmDlNQ05phP5KYKfNcc8XyhMhBGWArWXJb833kD
SUPABASE_URL=https://zkbkvavddgwbpiigpiau.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VocQaRZ4XzU3HHpnkm4uTQ_yxGo9ADU
EOF
```

#### 8. 启动项目（使用 PM2）

宝塔推荐使用 PM2 管理进程：

```bash
# 安装 PM2
npm install -g pm2

# 启动项目
cd /www/wwwroot/senlinlb.online
pm2 start npm --name "huoshan-app" -- start

# 设置开机自启
pm2 save
pm2 startup
```

#### 9. 配置伪静态

1. 在【网站】中找到 `senlinlb.online`
2. 点击【设置】→【伪静态】
3. 选择或输入以下配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 10. 配置 SSL 证书

1. 在【网站】→【设置】→【SSL】
2. 选择【Let's Encrypt】
3. 填写邮箱，勾选域名
4. 点击【申请】

---

### 方法二：使用 Docker 部署

#### 1. 安装 Docker

在宝塔【软件商店】安装【Docker】

#### 2. 克隆代码

```bash
cd /www/wwwroot
git clone https://github.com/xiaokaikiss-cmd/huoshanZuizhong.git
cd huoshanZuizhong
```

#### 3. 配置环境变量

创建 `.env` 文件（参考方法一的第 7 步）

#### 4. 构建并启动

```bash
cd /www/wwwroot/huoshanZuizhong
docker-compose up -d --build
```

#### 5. 配置反向代理

在宝塔中配置反向代理：
1. 进入【网站】→【添加站点】（如果还没有）
2. 点击【设置】→【反向代理】
3. 添加代理：
   - **代理名称**：huoshan-app
   - **目标URL**：`http://127.0.0.1:3000`
   - **发送域名**：`$host`
4. 点击【提交】

---

## 常用操作

### 查看项目状态
```bash
# 使用 PM2
pm2 status

# 使用 Docker
docker-compose ps
```

### 查看日志
```bash
# PM2 日志
pm2 logs huoshan-app

# Docker 日志
docker-compose logs -f app
```

### 重启项目
```bash
# PM2 重启
pm2 restart huoshan-app

# Docker 重启
docker-compose restart
```

### 更新代码
```bash
cd /www/wwwroot/senlinlb.online
git pull
pnpm install
pnpm build
pm2 restart huoshan-app
```

---

## 宝塔面板中的常见操作

### 清理缓存
1. 进入【网站】→【设置】
2. 选择【性能调整】
3. 清除 Redis 或 Memcached 缓存

### 修改环境变量
1. 进入【文件】
2. 找到 `.env` 文件
3. 点击【编辑】
4. 修改后保存
5. 重启项目

### 查看错误日志
1. 进入【网站】→【设置】
2. 选择【日志】
3. 查看错误日志

---

## 故障排查

### 端口 3000 被占用
```bash
# 查看端口占用
netstat -tlnp | grep 3000

# 杀死进程
kill -9 <PID>
```

### PM2 进程异常
```bash
# 查看详细信息
pm2 show huoshan-app

# 删除并重新启动
pm2 delete huoshan-app
pm2 start npm --name "huoshan-app" -- start
pm2 save
```

### 网站无法访问
1. 检查防火墙：在宝塔【安全】中开放 3000 端口（如需直接访问）
2. 检查 Nginx 配置：查看伪静态规则是否正确
3. 检查项目状态：`pm2 status`

---

## 性能优化建议

### 启用 Gzip 压缩

在宝塔【网站】→【设置】→【配置文件】中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 开启缓存

1. 在宝塔【软件商店】安装 Redis
2. 在【网站】→【设置】→【性能调整】中启用缓存

### 使用 CDN

在宝塔或域名 DNS 中配置 CDN，加速静态资源访问。

---

## 备份建议

### 宝塔自动备份

1. 进入【计划任务】
2. 添加任务：
   - **任务类型**：备份网站
   - **执行周期**：每天
   - **保留备份**：7 份

### 数据库备份

由于使用 Supabase 云数据库，无需手动备份，但建议定期导出。

---

## 安全建议

1. **配置防火墙**
   - 在宝塔【安全】中只开放必要端口（22, 80, 443）

2. **定期更新**
   - 定期在宝塔【软件商店】更新系统和软件

3. **强密码策略**
   - 宝塔面板、SSH、数据库密码都要设置强密码

4. **开启安全防护**
   - 在宝塔【安全】中启用【防跨站攻击】、【防 SQL 注入】等

---

## 联系支持

如有问题，请查看：
- 宝塔官方文档：https://www.bt.cn/bbs/
- 项目 GitHub：https://github.com/xiaokaikiss-cmd/huoshanZuizhong
