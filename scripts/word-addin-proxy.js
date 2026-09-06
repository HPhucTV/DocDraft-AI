const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(process.env.USERPROFILE || 'C:\\Users\\PC', '.office-addin-dev-certs', 'localhost.key');
const certPath = path.join(process.env.USERPROFILE || 'C:\\Users\\PC', '.office-addin-dev-certs', 'localhost.crt');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('[LỖI] Không tìm thấy chứng chỉ localhost tại ~/.office-addin-dev-certs');
  process.exit(1);
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const PORT = 3443;
const TARGET_PORT = 3000;

const server = https.createServer(options, (req, res) => {
  const proxyReq = http.request({
    host: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không thể kết nối đến Next.js (port 3000). Vui lòng đảm bảo Next.js đang chạy.');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`[OK] HTTPS Proxy cho Word Add-in đang hoạt động tại: https://localhost:${PORT}`);
});
