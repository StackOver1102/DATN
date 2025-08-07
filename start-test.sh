#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Web3D Test Environment ===${NC}"

# Update /etc/hosts file if needed
if ! grep -q "dashboard.model3dvn.org" /etc/hosts; then
    echo -e "${YELLOW}Updating /etc/hosts file...${NC}"
    echo "127.0.0.1 dashboard.model3dvn.org api.model3dvn.org model3dvn.org www.model3dvn.org" | sudo tee -a /etc/hosts > /dev/null
    echo -e "${GREEN}Hosts file updated.${NC}"
fi

# Create backend .env file if it doesn't exist
if [ ! -f "3DBackend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > 3DBackend/.env << EOF
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://mongo_user:mongo_password@mongodb:27017/web3d?authSource=admin
JWT_SECRET=test_jwt_secret_key
EOF
    echo -e "${GREEN}Backend .env file created.${NC}"
fi

# Start the test environment
echo -e "${YELLOW}Starting test environment...${NC}"
docker compose -f docker-compose.test.yml up -d --build

# Check if containers are running
echo -e "${YELLOW}Checking container status...${NC}"
sleep 5
docker compose -f docker-compose.test.yml ps

echo -e "${GREEN}Test environment is now running!${NC}"
echo -e "${GREEN}Dashboard is available at https://dashboard.model3dvn.org${NC}"
echo -e "${GREEN}API is available at https://api.model3dvn.org/api/v1${NC}"
echo -e "${GREEN}MongoDB is available at mongodb://mongo_user:mongo_password@localhost:27017/web3d?authSource=admin${NC}"
echo -e "${YELLOW}Note: Make sure your /etc/hosts file has entries for dashboard.model3dvn.org and api.model3dvn.org pointing to 127.0.0.1${NC}"