#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Web3D Production Deployment ===${NC}"

# No need to generate SSL certificates as Cloudflare handles SSL

# Check if .env files exist, create them if not
if [ ! -f "3DBackend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > 3DBackend/.env << EOF
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://mongo_user:mongo_password@mongodb:27017/web3d?authSource=admin
JWT_SECRET=your_jwt_secret_here
EOF
    echo -e "${GREEN}Backend .env file created.${NC}"
fi

if [ ! -f "3DFE/.env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > 3DFE/.env << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.model3dvn.org/api/v1
EOF
    echo -e "${GREEN}Frontend .env file created.${NC}"
fi

if [ ! -f "Dashboard/dashboard/.env" ]; then
    echo -e "${YELLOW}Creating dashboard .env file...${NC}"
    cat > Dashboard/dashboard/.env << EOF
NEXTAUTH_URL=https://dashboard.model3dvn.org
NEXTAUTH_SECRET=e3c7d09a9e6als4b51b8a5f34b0b497fc33a6bb13cde7ecf0a9058b37f28acbb2c
NEXT_PUBLIC_API_URL=https://api.model3dvn.org/api/v1
NODE_ENV=production
PORT=4000
NEXTAUTH_URL_INTERNAL=http://dashboard:4000
EOF
    echo -e "${GREEN}Dashboard .env file created.${NC}"
fi

# Start the production environment
echo -e "${YELLOW}Starting production environment...${NC}"
docker compose -f docker-compose.prd.yml up -d --build

# Check if containers are running
echo -e "${YELLOW}Checking container status...${NC}"
sleep 5
docker compose -f docker-compose.prd.yml ps

echo -e "${GREEN}Production environment is now running!${NC}"
echo -e "${GREEN}Access your application at https://model3dvn.org${NC}"
echo -e "${GREEN}API is available at https://api.model3dvn.org/api/v1${NC}"
echo -e "${YELLOW}Note: SSL is handled by Cloudflare${NC}"