#!/bin/bash

# Maintenance Mode Management Script for 3DVN.org
# Usage: ./maintenance-mode.sh [enable|disable|status]

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NGINX_CONTAINER="web3d-nginx"
NGINX_CONF_DIR="/root/3D/nginx/conf"
NORMAL_CONF="default.conf"
MAINTENANCE_CONF="maintenance.conf.template"
MAINTENANCE_HTML="/root/3D/nginx/maintenance.html"
BACKUP_SUFFIX=".backup"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker container exists and is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${NGINX_CONTAINER}$"; then
        print_error "Nginx container '${NGINX_CONTAINER}' is not running!"
        print_status "Available containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
        exit 1
    fi
}

# Function to backup current configuration
backup_config() {
    local config_file="$1"
    if [ -f "${config_file}" ]; then
        cp "${config_file}" "${config_file}${BACKUP_SUFFIX}"
        print_status "Backed up ${config_file} to ${config_file}${BACKUP_SUFFIX}"
    fi
}

# Function to restore configuration from backup
restore_config() {
    local config_file="$1"
    if [ -f "${config_file}${BACKUP_SUFFIX}" ]; then
        cp "${config_file}${BACKUP_SUFFIX}" "${config_file}"
        print_status "Restored ${config_file} from backup"
    fi
}

# Function to reload nginx configuration
reload_nginx() {
    print_status "Reloading nginx configuration..."
    if docker exec "${NGINX_CONTAINER}" nginx -t; then
        docker exec "${NGINX_CONTAINER}" nginx -s reload
        print_success "Nginx configuration reloaded successfully"
        return 0
    else
        print_error "Nginx configuration test failed!"
        return 1
    fi
}

# Function to copy maintenance HTML to nginx container
copy_maintenance_html() {
    print_status "Copying maintenance page to nginx container..."
    if [ -f "${MAINTENANCE_HTML}" ]; then
        docker cp "${MAINTENANCE_HTML}" "${NGINX_CONTAINER}:/usr/share/nginx/html/maintenance.html"
        print_success "Maintenance page copied to container"
    else
        print_error "Maintenance HTML file not found: ${MAINTENANCE_HTML}"
        exit 1
    fi
}

# Function to enable maintenance mode
enable_maintenance() {
    print_status "🔧 Enabling maintenance mode..."
    
    # Check if already in maintenance mode
    if [ -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}" ]; then
        print_warning "Maintenance mode appears to already be enabled!"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Operation cancelled."
            exit 0
        fi
    fi
    
    # Backup current configuration
    backup_config "${NGINX_CONF_DIR}/${NORMAL_CONF}"
    
    # Copy maintenance configuration
    if [ -f "${NGINX_CONF_DIR}/${MAINTENANCE_CONF}" ]; then
        cp "${NGINX_CONF_DIR}/${MAINTENANCE_CONF}" "${NGINX_CONF_DIR}/${NORMAL_CONF}"
        print_success "Maintenance configuration activated"
    else
        print_error "Maintenance configuration file not found: ${NGINX_CONF_DIR}/${MAINTENANCE_CONF}"
        # Restore backup if copy failed
        restore_config "${NGINX_CONF_DIR}/${NORMAL_CONF}"
        exit 1
    fi
    
    # Copy maintenance HTML to container
    copy_maintenance_html
    
    # Reload nginx
    if reload_nginx; then
        print_success "🔧 Maintenance mode ENABLED successfully!"
        print_status "Website is now showing maintenance page"
        print_status "All traffic will be redirected to maintenance page"
        
        # Show status
        echo
        print_status "Current status:"
        echo "  • Main site (3dvn.org): Maintenance page"
        echo "  • Dashboard (dashboard.3dvn.org): Maintenance page"  
        echo "  • API (api.3dvn.org): JSON maintenance response"
        echo "  • Health check: Available at /health endpoint"
        echo
        print_warning "Remember to disable maintenance mode when done!"
    else
        # Restore backup if reload failed
        restore_config "${NGINX_CONF_DIR}/${NORMAL_CONF}"
        print_error "Failed to enable maintenance mode"
        exit 1
    fi
}

# Function to disable maintenance mode
disable_maintenance() {
    print_status "🚀 Disabling maintenance mode..."
    
    # Check if maintenance mode is enabled
    if [ ! -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}" ]; then
        print_warning "No backup configuration found. Maintenance mode may not be enabled."
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Operation cancelled."
            exit 0
        fi
    fi
    
    # Restore original configuration
    if [ -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}" ]; then
        restore_config "${NGINX_CONF_DIR}/${NORMAL_CONF}"
        print_success "Original configuration restored"
        
        # Remove backup file
        rm -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}"
        print_status "Backup file cleaned up"
    else
        print_error "Backup configuration not found!"
        exit 1
    fi
    
    # Reload nginx
    if reload_nginx; then
        print_success "🚀 Maintenance mode DISABLED successfully!"
        print_status "Website is now back online"
        print_status "All services are restored to normal operation"
        
        # Show status
        echo
        print_status "Current status:"
        echo "  • Main site (3dvn.org): Online"
        echo "  • Dashboard (dashboard.3dvn.org): Online"
        echo "  • API (api.3dvn.org): Online"
        echo "  • All services: Operational"
    else
        print_error "Failed to disable maintenance mode"
        exit 1
    fi
}

# Function to show current status
show_status() {
    print_status "🔍 Checking maintenance mode status..."
    echo
    
    # Check if backup exists (indicates maintenance mode is enabled)
    if [ -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}" ]; then
        print_warning "🔧 MAINTENANCE MODE: ENABLED"
        echo "  • Backup configuration exists"
        echo "  • Website is showing maintenance page"
        echo "  • Services are temporarily unavailable"
    else
        print_success "🚀 MAINTENANCE MODE: DISABLED"
        echo "  • Normal configuration is active"
        echo "  • Website is operational"
        echo "  • All services are available"
    fi
    
    echo
    print_status "Container status:"
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "${NGINX_CONTAINER}"; then
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep "${NGINX_CONTAINER}"
    else
        print_error "Nginx container is not running!"
    fi
    
    echo
    print_status "Configuration files:"
    echo "  • Normal config: ${NGINX_CONF_DIR}/${NORMAL_CONF}"
    echo "  • Maintenance config: ${NGINX_CONF_DIR}/${MAINTENANCE_CONF}"
    echo "  • Maintenance HTML: ${MAINTENANCE_HTML}"
    
    if [ -f "${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}" ]; then
        echo "  • Backup config: ${NGINX_CONF_DIR}/${NORMAL_CONF}${BACKUP_SUFFIX}"
    fi
}

# Function to test maintenance page
test_maintenance() {
    print_status "🧪 Testing maintenance page..."
    
    # Test if maintenance HTML exists
    if [ -f "${MAINTENANCE_HTML}" ]; then
        print_success "Maintenance HTML file exists"
    else
        print_error "Maintenance HTML file not found: ${MAINTENANCE_HTML}"
        return 1
    fi
    
    # Test if maintenance config exists
    if [ -f "${NGINX_CONF_DIR}/${MAINTENANCE_CONF}" ]; then
        print_success "Maintenance configuration file exists"
    else
        print_error "Maintenance configuration file not found: ${NGINX_CONF_DIR}/${MAINTENANCE_CONF}"
        return 1
    fi
    
    # Test nginx configuration syntax
    print_status "Testing nginx configuration syntax..."
    if docker exec "${NGINX_CONTAINER}" nginx -t; then
        print_success "Nginx configuration syntax is valid"
    else
        print_error "Nginx configuration syntax error!"
        return 1
    fi
    
    print_success "All tests passed! Maintenance mode is ready to use."
}

# Function to show help
show_help() {
    echo "Maintenance Mode Management Script for 3DVN.org"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  enable    Enable maintenance mode (show maintenance page)"
    echo "  disable   Disable maintenance mode (restore normal operation)"
    echo "  status    Show current maintenance mode status"
    echo "  test      Test maintenance configuration"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 enable     # Put website in maintenance mode"
    echo "  $0 disable    # Restore website to normal operation"
    echo "  $0 status     # Check if maintenance mode is active"
    echo
    echo "Files:"
    echo "  • Normal config: ${NGINX_CONF_DIR}/${NORMAL_CONF}"
    echo "  • Maintenance config: ${NGINX_CONF_DIR}/${MAINTENANCE_CONF}"
    echo "  • Maintenance page: ${MAINTENANCE_HTML}"
    echo
    echo "Note: This script requires Docker and the nginx container '${NGINX_CONTAINER}' to be running."
}

# Main script logic
main() {
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH!"
        exit 1
    fi
    
    # Check if nginx container is running
    check_container
    
    # Parse command line arguments
    case "${1:-help}" in
        "enable")
            enable_maintenance
            ;;
        "disable")
            disable_maintenance
            ;;
        "status")
            show_status
            ;;
        "test")
            test_maintenance
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
