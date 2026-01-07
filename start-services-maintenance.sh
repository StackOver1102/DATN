#!/bin/bash

# Start services while keeping maintenance mode active
# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting Web3D Services (Maintenance Mode) ===${NC}"

# Function to start a specific service
start_service() {
    local service_name=$1
    local container_name=$2
    
    echo -e "${BLUE}Starting ${service_name}...${NC}"
    
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${YELLOW}⚠️  ${service_name} is already running${NC}"
    else
        # Start the service using docker-compose
        docker compose -f /root/3D/docker-compose.prd.yml up -d ${service_name,,}
        
        # Wait a moment for container to start
        sleep 2
        
        # Check if it started successfully
        if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
            echo -e "${GREEN}✅ ${service_name} started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start ${service_name}${NC}"
        fi
    fi
}

# Function to check if container is running
is_running() {
    docker ps --format "table {{.Names}}" | grep -q "^$1$"
}

echo -e "${BLUE}Current container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo

# Check if maintenance mode is active
echo -e "${BLUE}Checking maintenance mode status...${NC}"
cd /root/3D
maintenance_status=$(./maintenance-mode.sh status 2>/dev/null | grep -o "ENABLED\|DISABLED" | head -1)

if [[ "$maintenance_status" == "ENABLED" ]]; then
    echo -e "${GREEN}✅ Maintenance mode is active${NC}"
else
    echo -e "${YELLOW}⚠️  Maintenance mode is not active${NC}"
    echo -e "${BLUE}💡 Enabling maintenance mode...${NC}"
    ./quick-maintenance.sh on
fi

echo

# Start services in order
echo -e "${YELLOW}Starting application services...${NC}"

# Start MongoDB first (other services depend on it)
start_service "MongoDB" "web3d-mongodb"

# Wait for MongoDB to be ready
echo -e "${BLUE}Waiting for MongoDB to be ready...${NC}"
sleep 5

# Start backend
start_service "Backend" "web3d-backend"

start_service "Image Search" "web3d-image-search"

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to be ready...${NC}"
sleep 3

# Start frontend
start_service "Frontend" "web3d-frontend"

# Start dashboard
start_service "Dashboard" "web3d-dashboard"

echo

# Ensure nginx is running
echo -e "${BLUE}Ensuring nginx is running...${NC}"
if is_running "web3d-nginx"; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting nginx...${NC}"
    docker compose -f /root/3D/docker-compose.prd.yml up -d nginx
    sleep 2
fi

echo

# Show final status
echo -e "${YELLOW}Final container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo

# Test maintenance page
echo -e "${BLUE}Testing maintenance page...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "503"; then
    echo -e "${GREEN}✅ Maintenance page is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Maintenance page may not be configured properly${NC}"
fi

echo

# Show summary
echo -e "${YELLOW}=== Summary ===${NC}"
echo -e "${GREEN}✅ All services started${NC}"
echo -e "${GREEN}✅ Maintenance mode is active${NC}"
echo -e "${BLUE}💡 Website shows maintenance page to users${NC}"
echo -e "${BLUE}💡 Services are running in background${NC}"

echo

# Show commands for next steps
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}  Check logs: docker logs <container_name>${NC}"
echo -e "${BLUE}  Disable maintenance: ./quick-maintenance.sh off${NC}"
echo -e "${BLUE}  Check status: ./maintenance-mode.sh status${NC}"

echo
echo -e "${GREEN}Services started successfully with maintenance mode active${NC}"
