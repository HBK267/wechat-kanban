# 微信项目管理看板

工业终端风格（Industrial Monospace）的协作看板，可在微信内直接打开。每个看板通过 URL 参数隔离，任何拿到链接的微信用户都能查看、编辑，数据每 3 秒自动同步并持久化到服务端。

## 功能

- 四列默认流程：TODO / IN PROGRESS / REVIEW / DONE
- 创建、编辑、删除任务（标题、描述、负责人、优先级、截止日期、状态）
- 任务左右移动，快速推进状态
- 多人实时同步：长轮询 + 操作日志
- 一键复制看板链接，直接粘贴到微信聊天或群聊
- 新建看板：生成新的随机 board ID，互不干扰

## 技术栈

- 前端：React 19 + Vite 8 + 原生 CSS
- 后端：Express 5 + lowdb（JSON 文件持久化）
- 字体：JetBrains Mono + Noto Sans SC（国内 loli 字体 CDN）

## 本地开发

```bash
npm install

# 终端 1：启动后端 API（端口 3000）
npm run server

# 终端 2：启动前端开发服务器（端口 5173，已配置 /api 代理）
npm run dev
```

打开 http://localhost:5173 即可使用。

## 生产部署

```bash
npm install
npm run build
PORT=3000 npm run server
```

生产环境建议：

1. 将项目部署到带公网 IP 的服务器。
2. 使用 Nginx / Caddy 反向代理到 `http://127.0.0.1:3000`。
3. 配置 HTTPS（Let's Encrypt 免费证书）。微信内置浏览器对 HTTPS 链接体验最好。
4. 使用 `pm2` 或 `systemd` 保持后端常驻。

### pm2 示例

```bash
npm install -g pm2
pm2 start server/index.js --name wechat-kanban --env PORT=3000
pm2 save
pm2 startup
```

### Nginx 反向代理示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 在微信中使用

1. 打开部署后的 HTTPS 链接。
2. 点击右上角 **COPY LINK** 复制当前看板链接。
3. 将链接发送到微信好友或微信群。
4. 其他用户点击链接即可进入同一看板，所有修改会自动同步。

> 注意：本版本没有用户认证，任何人拿到链接都能编辑。请仅将链接分享给需要协作的成员。

## 数据存储

看板数据保存在项目根目录 `data/boards.json`，由 lowdb 自动读写。建议定期备份该文件。

## 环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
PORT=3000
NODE_ENV=production
```
