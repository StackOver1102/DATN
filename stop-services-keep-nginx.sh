#!/bin/bash

# Stop services but keep nginx running for maintenance mode
# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Stopping Web3D Services (Keeping Nginx) ===${NC}"

# Function to stop a specific service
stop_service() {
    local service_name=$1
    local container_name=$2
    
    echo -e "${BLUE}Stopping ${service_name}...${NC}"
    
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        docker stop ${container_name}
        echo -e "${GREEN}✅ ${service_name} stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  ${service_name} is not running${NC}"
    fi
}

# Function to check if container is running
is_running() {
    docker ps --format "table {{.Names}}" | grep -q "^$1$"
}

echo -e "${BLUE}Current container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo

# Stop services in order (backend first, then frontend, dashboard, mongodb)
echo -e "${YELLOW}Stopping application services...${NC}"

# Stop backend first (other services depend on it)
stop_service "Backend API" "web3d-backend"

# Stop frontend
stop_service "Frontend" "web3d-frontend"

# Stop dashboard
stop_service "Dashboard" "web3d-dashboard"

# Stop MongoDB
stop_service "MongoDB" "web3d-mongodb"

echo

# Check nginx status
echo -e "${BLUE}Checking nginx status...${NC}"
if is_running "web3d-nginx"; then
    echo -e "${GREEN}✅ Nginx is still running (maintenance mode active)${NC}"
    
    # Show nginx status
    nginx_status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep web3d-nginx)
    echo -e "${BLUE}Nginx status: ${nginx_status}${NC}"
    
    # Test if maintenance page is accessible
    echo -e "${BLUE}Testing maintenance page...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "503"; then
        echo -e "${GREEN}✅ Maintenance page is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Maintenance page may not be configured${NC}"
    fi
else
    echo -e "${RED}❌ Nginx is not running${NC}"
    echo -e "${YELLOW}💡 You may want to start nginx for maintenance mode:${NC}"
    echo -e "${BLUE}   docker compose -f docker-compose.prd.yml up -d nginx${NC}"
fi

echo

# Show final status
echo -e "${YELLOW}Final container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo

# Show summary
echo -e "${YELLOW}=== Summary ===${NC}"
echo -e "${GREEN}✅ Application services stopped${NC}"
echo -e "${GREEN}✅ Nginx kept running for maintenance${NC}"
echo -e "${BLUE}💡 Website should show maintenance page${NC}"
echo

# Show commands to restart services
echo -e "${YELLOW}To restart services:${NC}"
echo -e "${BLUE}  All services: docker compose -f docker-compose.prd.yml up -d${NC}"
echo -e "${BLUE}  Just backend: docker compose -f docker-compose.prd.yml up -d backend${NC}"
echo -e "${BLUE}  Disable maintenance: ./quick-maintenance.sh off${NC}"

echo
echo -e "${GREEN}Services stopped successfully (nginx preserved)${NC}"
