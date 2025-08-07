#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Stopping Web3D Production Environment ===${NC}"

# Stop all containers
echo -e "${YELLOW}Stopping containers...${NC}"
docker compose -f docker-compose.prd.yml down

echo -e "${GREEN}Production environment has been stopped.${NC}"