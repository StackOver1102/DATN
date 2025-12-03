#!/bin/bash

# Quick Maintenance Mode Toggle Script
# Usage: ./quick-maintenance.sh [on|off]

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="/root/3D"
MAINTENANCE_SCRIPT="$SCRIPT_DIR/maintenance-mode.sh"

case "${1:-help}" in
    "on"|"enable")
        echo -e "${YELLOW}🔧 Enabling maintenance mode...${NC}"
        $MAINTENANCE_SCRIPT enable
        ;;
    "off"|"disable")
        echo -e "${GREEN}🚀 Disabling maintenance mode...${NC}"
        $MAINTENANCE_SCRIPT disable
        ;;
    "status"|"check")
        $MAINTENANCE_SCRIPT status
        ;;
    *)
        echo "Quick Maintenance Mode Toggle"
        echo "Usage: $0 [on|off|status]"
        echo ""
        echo "Commands:"
        echo "  on      Enable maintenance mode"
        echo "  off     Disable maintenance mode"  
        echo "  status  Check current status"
        echo ""
        echo "Examples:"
        echo "  $0 on     # Enable maintenance"
        echo "  $0 off    # Disable maintenance"
        ;;
esac
