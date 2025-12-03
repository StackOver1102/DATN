#!/bin/bash

# Web3D Deployment Manager
# Manages deployment with maintenance mode and service control

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo -e "${CYAN}Web3D Deployment Manager${NC}"
    echo
    echo -e "${YELLOW}Usage: $0 [COMMAND]${NC}"
    echo
    echo -e "${BLUE}Commands:${NC}"
    echo -e "  ${GREEN}deploy${NC}          Full deployment (maintenance -> stop -> start -> restore)"
    echo -e "  ${GREEN}maintenance-stop${NC} Enable maintenance and stop services (keep nginx)"
    echo -e "  ${GREEN}maintenance-start${NC} Start services while keeping maintenance active"
    echo -e "  ${GREEN}restore${NC}         Disable maintenance mode and restore normal operation"
    echo -e "  ${GREEN}status${NC}          Show current status of all services and maintenance"
    echo -e "  ${GREEN}restart${NC}         Restart all services with maintenance mode"
    echo -e "  ${GREEN}help${NC}            Show this help message"
    echo
    echo -e "${BLUE}Examples:${NC}"
    echo -e "  $0 deploy           # Full deployment process"
    echo -e "  $0 maintenance-stop # Put in maintenance and stop services"
    echo -e "  $0 restore          # Restore normal operation"
    echo
    echo -e "${BLUE}Files:${NC}"
    echo -e "  • stop-services-keep-nginx.sh    - Stop services, keep nginx"
    echo -e "  • start-services-maintenance.sh  - Start services in maintenance"
    echo -e "  • maintenance-mode.sh            - Maintenance mode control"
    echo -e "  • quick-maintenance.sh           - Quick maintenance toggle"
}

# Function to show status
show_status() {
    echo -e "${CYAN}=== Web3D System Status ===${NC}"
    echo
    
    # Container status
    echo -e "${BLUE}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|web3d-)"
    echo
    
    # Maintenance status
    echo -e "${BLUE}Maintenance Mode:${NC}"
    cd /root/3D
    ./maintenance-mode.sh status | grep -E "(ENABLED|DISABLED|ERROR)"
    echo
    
    # Service health check
    echo -e "${BLUE}Service Health:${NC}"
    
    # Check nginx
    if docker ps --format "{{.Names}}" | grep -q "web3d-nginx"; then
        echo -e "  ${GREEN}✅ Nginx: Running${NC}"
    else
        echo -e "  ${RED}❌ Nginx: Stopped${NC}"
    fi
    
    # Check backend
    if docker ps --format "{{.Names}}" | grep -q "web3d-backend"; then
        echo -e "  ${GREEN}✅ Backend: Running${NC}"
    else
        echo -e "  ${RED}❌ Backend: Stopped${NC}"
    fi
    
    # Check frontend
    if docker ps --format "{{.Names}}" | grep -q "web3d-frontend"; then
        echo -e "  ${GREEN}✅ Frontend: Running${NC}"
    else
        echo -e "  ${RED}❌ Frontend: Stopped${NC}"
    fi
    
    # Check dashboard
    if docker ps --format "{{.Names}}" | grep -q "web3d-dashboard"; then
        echo -e "  ${GREEN}✅ Dashboard: Running${NC}"
    else
        echo -e "  ${RED}❌ Dashboard: Stopped${NC}"
    fi
    
    # Check mongodb
    if docker ps --format "{{.Names}}" | grep -q "web3d-mongodb"; then
        echo -e "  ${GREEN}✅ MongoDB: Running${NC}"
    else
        echo -e "  ${RED}❌ MongoDB: Stopped${NC}"
    fi
    
    echo
    
    # Website status
    echo -e "${BLUE}Website Status:${NC}"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
    case $http_code in
        200)
            echo -e "  ${GREEN}✅ Website: Online (HTTP $http_code)${NC}"
            ;;
        503)
            echo -e "  ${YELLOW}🔧 Website: Maintenance Mode (HTTP $http_code)${NC}"
            ;;
        000)
            echo -e "  ${RED}❌ Website: Unreachable${NC}"
            ;;
        *)
            echo -e "  ${YELLOW}⚠️  Website: HTTP $http_code${NC}"
            ;;
    esac
}

# Function for full deployment
full_deploy() {
    echo -e "${CYAN}=== Full Deployment Process ===${NC}"
    echo
    
    echo -e "${YELLOW}Step 1: Enable maintenance mode and stop services${NC}"
    ./stop-services-keep-nginx.sh
    echo
    
    echo -e "${YELLOW}Step 2: Start services in maintenance mode${NC}"
    ./start-services-maintenance.sh
    echo
    
    echo -e "${YELLOW}Step 3: Wait for services to be ready${NC}"
    echo -e "${BLUE}Waiting 30 seconds for all services to initialize...${NC}"
    sleep 30
    echo
    
    echo -e "${YELLOW}Step 4: Show final status${NC}"
    show_status
    echo
    
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "${BLUE}💡 Services are running in maintenance mode${NC}"
    echo -e "${BLUE}💡 Run './deployment-manager.sh restore' to go live${NC}"
}

# Function to restore normal operation
restore_operation() {
    echo -e "${CYAN}=== Restoring Normal Operation ===${NC}"
    echo
    
    echo -e "${BLUE}Disabling maintenance mode...${NC}"
    cd /root/3D
    ./quick-maintenance.sh off
    echo
    
    echo -e "${BLUE}Final status:${NC}"
    show_status
    echo
    
    echo -e "${GREEN}🚀 Website is now live!${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${CYAN}=== Restarting Services ===${NC}"
    echo
    
    echo -e "${YELLOW}Stopping services (keeping nginx)...${NC}"
    ./stop-services-keep-nginx.sh
    echo
    
    echo -e "${YELLOW}Starting services in maintenance mode...${NC}"
    ./start-services-maintenance.sh
    echo
    
    echo -e "${GREEN}Services restarted successfully${NC}"
}

# Main script logic
main() {
    # Change to script directory
    cd /root/3D
    
    case "${1:-help}" in
        "deploy")
            full_deploy
            ;;
        "maintenance-stop")
            ./stop-services-keep-nginx.sh
            ;;
        "maintenance-start")
            ./start-services-maintenance.sh
            ;;
        "restore")
            restore_operation
            ;;
        "status")
            show_status
            ;;
        "restart")
            restart_services
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
