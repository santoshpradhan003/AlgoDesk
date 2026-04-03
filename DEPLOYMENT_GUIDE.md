# 🚀 AlgoDESK v5 - Deployment Guide

## Server Deployment Issues & Solutions

### ❌ "Page not found" Error - Common Causes & Fixes

#### 1. **Flask Server Not Running**
**Problem**: Trying to access static HTML files directly instead of through Flask server
**Solution**: Always run the Flask backend server

```bash
# On your server
cd /path/to/AlgoDesk
python dhan_server.py
```

#### 2. **Wrong Port Configuration**
**Problem**: Server configured for port 80/443 but Flask runs on 5000
**Solution**: Use reverse proxy (Nginx/Apache) or run Flask on port 80

**Nginx Configuration** (`/etc/nginx/sites-available/algodesk`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. **Static File Serving Issues**
**Problem**: Web server serving files from wrong directory
**Solution**: Ensure correct document root or use Flask static serving

#### 4. **Missing Dependencies**
**Problem**: Python packages not installed on server
**Solution**:
```bash
pip install -r requirements.txt
```

#### 5. **Environment Variables**
**Problem**: DHAN credentials not set
**Solution**:
```bash
export DHAN_CLIENT_ID="your_client_id"
export DHAN_CLIENT_SECRET="your_client_secret"
```

### ✅ Deployment Checklist

- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Environment variables set
- [ ] Flask server running (`python dhan_server.py`)
- [ ] Port 5000 accessible or reverse proxy configured
- [ ] Firewall allows connections
- [ ] Domain DNS points to server IP

### 🔧 Quick Deployment Commands

```bash
# 1. Install dependencies
pip install flask flask-cors flask-socketio requests python-dotenv

# 2. Set environment variables
export DHAN_CLIENT_ID="your_id"
export DHAN_CLIENT_SECRET="your_secret"

# 3. Run server
python dhan_server.py

# 4. Test locally
curl http://127.0.0.1:5000/api/health
```

### 🌐 Production Deployment Options

#### Option 1: Gunicorn + Nginx (Recommended)
```bash
pip install gunicorn
gunicorn -w 4 -b 127.0.0.1:5000 dhan_server:app
```

#### Option 2: Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "dhan_server.py"]
```

#### Option 3: Systemd Service
Create `/etc/systemd/system/algodesk.service`:
```ini
[Unit]
Description=AlgoDESK Trading Server
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/AlgoDesk
ExecStart=/usr/bin/python dhan_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 🔍 Troubleshooting

**Check if server is running**:
```bash
ps aux | grep python
netstat -tlnp | grep 5000
```

**Test API endpoints**:
```bash
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:5000/
```

**Check logs**:
```bash
python dhan_server.py  # Look for error messages
```

**Common Issues**:
- Port 5000 blocked by firewall
- Missing Python packages
- Incorrect file paths
- Environment variables not set
- Flask app not binding to correct interface