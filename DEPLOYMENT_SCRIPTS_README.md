# 🚀 Web3D Deployment Scripts

Hệ thống script quản lý deployment cho Web3D với maintenance mode và service control.

## 📁 Scripts Overview

```
/root/3D/
├── deployment-manager.sh           # Script chính quản lý deployment
├── stop-services-keep-nginx.sh     # Stop services nhưng giữ nginx
├── start-services-maintenance.sh   # Start services trong maintenance mode
├── maintenance-mode.sh             # Quản lý maintenance mode
├── quick-maintenance.sh            # Toggle maintenance nhanh
└── stop-production.sh              # Stop toàn bộ services
```

## 🎯 Quick Start

### Deployment hoàn chỉnh
```bash
./deployment-manager.sh deploy
```

### Stop services nhưng giữ nginx (maintenance)
```bash
./stop-services-keep-nginx.sh
```

### Start services trong maintenance mode
```bash
./start-services-maintenance.sh
```

### Tắt maintenance và go live
```bash
./deployment-manager.sh restore
```

## 📖 Detailed Usage

### 1. Deployment Manager (deployment-manager.sh)

**Script chính để quản lý toàn bộ deployment process**

#### Commands:
```bash
./deployment-manager.sh deploy          # Full deployment process
./deployment-manager.sh maintenance-stop # Enable maintenance + stop services
./deployment-manager.sh maintenance-start # Start services in maintenance
./deployment-manager.sh restore         # Disable maintenance + go live
./deployment-manager.sh status          # Show system status
./deployment-manager.sh restart         # Restart all services
./deployment-manager.sh help            # Show help
```

#### Full Deployment Process:
1. ✅ Enable maintenance mode
2. ✅ Stop all services (keep nginx)
3. ✅ Start services in maintenance mode
4. ✅ Wait for services to initialize
5. ✅ Show status
6. 🔧 Manual step: Run `restore` when ready

### 2. Stop Services Keep Nginx (stop-services-keep-nginx.sh)

**Stop tất cả services nhưng giữ nginx để maintenance mode hoạt động**

#### Features:
- ✅ Stop backend, frontend, dashboard, mongodb
- ✅ Keep nginx running
- ✅ Maintenance page vẫn accessible
- ✅ Colored output với status check
- ✅ Test maintenance page accessibility

#### Usage:
```bash
./stop-services-keep-nginx.sh
```

#### Output Example:
```
=== Stopping Web3D Services (Keeping Nginx) ===
✅ Backend API stopped
✅ Frontend stopped  
✅ Dashboard stopped
✅ MongoDB stopped
✅ Nginx is still running (maintenance mode active)
✅ Maintenance page is accessible
```

### 3. Start Services Maintenance (start-services-maintenance.sh)

**Start tất cả services trong maintenance mode**

#### Features:
- ✅ Auto-enable maintenance mode nếu chưa có
- ✅ Start services theo thứ tự đúng (MongoDB → Backend → Frontend → Dashboard)
- ✅ Wait time giữa các services
- ✅ Health check cho từng service
- ✅ Ensure nginx running

#### Usage:
```bash
./start-services-maintenance.sh
```

#### Service Start Order:
1. 🔧 Check/enable maintenance mode
2. 🗄️ MongoDB (wait 5s)
3. 🔧 Backend (wait 3s)
4. 🌐 Frontend
5. 📊 Dashboard
6. 🔧 Ensure nginx running

## 🔄 Common Workflows

### Workflow 1: Planned Maintenance
```bash
# 1. Put website in maintenance
./deployment-manager.sh maintenance-stop

# 2. Do your maintenance work (update code, database, etc.)
# ...

# 3. Start services in maintenance mode
./deployment-manager.sh maintenance-start

# 4. Test everything works
./deployment-manager.sh status

# 5. Go live
./deployment-manager.sh restore
```

### Workflow 2: Quick Deployment
```bash
# All-in-one deployment
./deployment-manager.sh deploy

# Wait for services to be ready, then go live
./deployment-manager.sh restore
```

### Workflow 3: Emergency Stop
```bash
# Stop all services but keep maintenance page
./stop-services-keep-nginx.sh

# Later, restart when ready
./start-services-maintenance.sh
```

### Workflow 4: Service Restart
```bash
# Restart all services with maintenance
./deployment-manager.sh restart

# Go live when ready
./deployment-manager.sh restore
```

## 🔍 Status Monitoring

### Check System Status
```bash
./deployment-manager.sh status
```

### Output Example:
```
=== Web3D System Status ===

Container Status:
NAMES             STATUS       PORTS
web3d-nginx       Up 2 hours   0.0.0.0:80->80/tcp
web3d-backend     Up 5 mins    5000/tcp
web3d-frontend    Up 5 mins    3000/tcp
web3d-dashboard   Up 5 mins    4000/tcp
web3d-mongodb     Up 6 mins    0.0.0.0:27017->27017/tcp

Maintenance Mode:
🔧 MAINTENANCE MODE: ENABLED

Service Health:
✅ Nginx: Running
✅ Backend: Running
✅ Frontend: Running
✅ Dashboard: Running
✅ MongoDB: Running

Website Status:
🔧 Website: Maintenance Mode (HTTP 503)
```

## 🛠️ Technical Details

### Service Dependencies
```
nginx (always running for maintenance)
├── frontend (depends on backend)
├── dashboard (depends on backend)
└── backend (depends on mongodb)
    └── mongodb (base dependency)
```

### Start Order
1. **MongoDB** - Database layer
2. **Backend** - API layer (depends on MongoDB)
3. **Frontend** - User interface (depends on Backend)
4. **Dashboard** - Admin interface (depends on Backend)
5. **Nginx** - Reverse proxy (always running)

### Stop Order
1. **Backend** - Stop API first
2. **Frontend** - Stop user interface
3. **Dashboard** - Stop admin interface
4. **MongoDB** - Stop database last
5. **Nginx** - Keep running for maintenance

### Maintenance Mode Integration
- Scripts automatically work with maintenance-mode.sh
- Nginx serves maintenance page when services are down
- Users see professional maintenance page instead of errors
- Services can be updated/restarted without user-facing downtime

## 🚨 Safety Features

### Automatic Checks
- ✅ Container existence check before stop/start
- ✅ Service health verification
- ✅ Maintenance page accessibility test
- ✅ HTTP status code validation
- ✅ Dependency order enforcement

### Error Handling
- ⚠️ Graceful handling of already running/stopped services
- ⚠️ Clear error messages with colored output
- ⚠️ Status verification after each operation
- ⚠️ Rollback suggestions on failure

### User Guidance
- 💡 Clear next-step instructions
- 💡 Command suggestions for common tasks
- 💡 Status summaries after operations
- 💡 Help text with examples

## 📊 Monitoring & Logs

### Check Individual Service Logs
```bash
docker logs web3d-backend --tail 50
docker logs web3d-frontend --tail 50
docker logs web3d-dashboard --tail 50
docker logs web3d-mongodb --tail 50
docker logs web3d-nginx --tail 50
```

### Monitor All Services
```bash
docker logs -f web3d-backend &
docker logs -f web3d-frontend &
docker logs -f web3d-dashboard &
# Ctrl+C to stop monitoring
```

### Real-time Status
```bash
watch -n 5 './deployment-manager.sh status'
```

## 🔧 Customization

### Modify Wait Times
Edit `start-services-maintenance.sh`:
```bash
# MongoDB wait time (default: 5s)
sleep 5

# Backend wait time (default: 3s)  
sleep 3
```

### Add Custom Health Checks
Add to any script:
```bash
# Custom health check example
check_api_health() {
    if curl -s http://localhost:5000/health > /dev/null; then
        echo "✅ API is healthy"
    else
        echo "❌ API health check failed"
    fi
}
```

### Modify Service Order
Edit the service arrays in scripts:
```bash
# Custom service start order
services=("mongodb" "backend" "custom-service" "frontend" "dashboard")
```

## 🚀 Best Practices

### Before Deployment
1. ✅ Test scripts in staging environment
2. ✅ Backup database if needed
3. ✅ Notify users about maintenance window
4. ✅ Prepare rollback plan

### During Deployment
1. ✅ Monitor logs for errors
2. ✅ Verify each step completes successfully
3. ✅ Test functionality before going live
4. ✅ Keep maintenance window as short as possible

### After Deployment
1. ✅ Monitor application performance
2. ✅ Check error logs
3. ✅ Verify all features working
4. ✅ Update documentation if needed

## 🆘 Troubleshooting

### Services Won't Start
```bash
# Check container logs
docker logs web3d-backend

# Check if ports are in use
netstat -tulpn | grep :5000

# Restart Docker if needed
systemctl restart docker
```

### Maintenance Page Not Showing
```bash
# Check nginx status
docker logs web3d-nginx

# Verify maintenance mode
./maintenance-mode.sh status

# Test nginx config
docker exec web3d-nginx nginx -t
```

### Database Connection Issues
```bash
# Check MongoDB status
docker logs web3d-mongodb

# Test connection
docker exec web3d-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Permission Issues
```bash
# Fix script permissions
chmod +x *.sh

# Check file ownership
ls -la *.sh
```

## 📞 Support Commands

### Emergency Recovery
```bash
# Stop everything and start fresh
docker compose -f docker-compose.prd.yml down
docker compose -f docker-compose.prd.yml up -d

# Reset maintenance mode
./quick-maintenance.sh off
```

### Clean Restart
```bash
# Full system restart
./deployment-manager.sh restart
./deployment-manager.sh restore
```

### Status Check
```bash
# Comprehensive status
./deployment-manager.sh status
docker ps
docker compose -f docker-compose.prd.yml ps
```

---

## 🎉 Summary

Hệ thống deployment scripts cung cấp:

- ✅ **Zero-downtime deployment** với maintenance mode
- ✅ **Service management** với dependency handling
- ✅ **Safety checks** và error handling
- ✅ **User-friendly interface** với colored output
- ✅ **Flexible workflows** cho different scenarios
- ✅ **Comprehensive monitoring** và status reporting

Sử dụng `./deployment-manager.sh help` để xem tất cả commands available! 🚀
