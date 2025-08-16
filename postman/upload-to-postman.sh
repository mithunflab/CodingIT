#!/bin/bash

# CodingIT Postman Upload Script
# This script uploads the collection and environment to Postman using the Postman API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if API key is provided
if [ -z "$POSTMAN_API_KEY" ]; then
    print_error "POSTMAN_API_KEY environment variable is required"
    echo
    echo "To get your Postman API key:"
    echo "1. Go to https://web.postman.co/settings/me/api-keys"
    echo "2. Click 'Generate API Key'"
    echo "3. Copy the key and export it:"
    echo "   export POSTMAN_API_KEY=\"your_api_key_here\""
    echo
    echo "Then run this script again."
    exit 1
fi

# Check if workspace ID is provided (optional)
if [ -z "$POSTMAN_WORKSPACE_ID" ]; then
    print_warning "POSTMAN_WORKSPACE_ID not set, using default workspace"
    WORKSPACE_PARAM=""
else
    WORKSPACE_PARAM="?workspace=${POSTMAN_WORKSPACE_ID}"
fi

POSTMAN_API_URL="https://api.getpostman.com"
COLLECTION_FILE="postman-collection.json"
ENVIRONMENT_FILE="postman-environment.json"

print_status "Starting upload to Postman..."

# Check if files exist
if [ ! -f "$COLLECTION_FILE" ]; then
    print_error "Collection file '$COLLECTION_FILE' not found!"
    exit 1
fi

if [ ! -f "$ENVIRONMENT_FILE" ]; then
    print_error "Environment file '$ENVIRONMENT_FILE' not found!"
    exit 1
fi

# Function to upload collection
upload_collection() {
    print_status "Uploading collection to Postman..."
    
    # Create the JSON payload
    COLLECTION_JSON=$(cat "$COLLECTION_FILE")
    PAYLOAD="{\"collection\": $COLLECTION_JSON}"
    
    # Upload collection
    RESPONSE=$(curl -s -X POST \
        "${POSTMAN_API_URL}/collections${WORKSPACE_PARAM}" \
        -H "X-API-Key: ${POSTMAN_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    # Check if upload was successful
    if echo "$RESPONSE" | grep -q '"id"'; then
        COLLECTION_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_success "Collection uploaded successfully!"
        print_status "Collection ID: $COLLECTION_ID"
        echo "$COLLECTION_ID" > .collection_id
    else
        print_error "Failed to upload collection"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Function to upload environment
upload_environment() {
    print_status "Uploading environment to Postman..."
    
    # Create the JSON payload
    ENVIRONMENT_JSON=$(cat "$ENVIRONMENT_FILE")
    PAYLOAD="{\"environment\": $ENVIRONMENT_JSON}"
    
    # Upload environment
    RESPONSE=$(curl -s -X POST \
        "${POSTMAN_API_URL}/environments${WORKSPACE_PARAM}" \
        -H "X-API-Key: ${POSTMAN_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    # Check if upload was successful
    if echo "$RESPONSE" | grep -q '"id"'; then
        ENVIRONMENT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_success "Environment uploaded successfully!"
        print_status "Environment ID: $ENVIRONMENT_ID"
        echo "$ENVIRONMENT_ID" > .environment_id
    else
        print_error "Failed to upload environment"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Function to list workspaces (helpful for getting workspace ID)
list_workspaces() {
    print_status "Available workspaces:"
    
    RESPONSE=$(curl -s -X GET \
        "${POSTMAN_API_URL}/workspaces" \
        -H "X-API-Key: ${POSTMAN_API_KEY}")
    
    if echo "$RESPONSE" | grep -q '"workspaces"'; then
        echo "$RESPONSE" | python3 -m json.tool | grep -A 3 -B 1 '"name"\|"id"' || echo "Could not parse workspace list"
    else
        print_error "Failed to fetch workspaces"
        echo "Response: $RESPONSE"
    fi
    echo
}

# Main execution
print_status "CodingIT API Collection Upload"
print_status "=============================="
echo

# List workspaces first
list_workspaces

# Upload collection and environment
upload_collection
echo
upload_environment

echo
print_success "Upload completed successfully!"
print_status "You can now access your collection and environment in Postman."

# Provide next steps
echo
print_status "Next Steps:"
echo "1. Open Postman and navigate to your workspace"
echo "2. Select the 'CodingIT Environment' from the environment dropdown"
echo "3. Set your API keys in the environment variables:"
echo "   - E2B_API_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - anthropic_api_key (or other AI provider keys)"
echo "4. Start testing the API endpoints!"

# Save upload info
cat > .postman_upload_info.json << EOF
{
  "upload_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "collection_id": "$(cat .collection_id 2>/dev/null || echo 'unknown')",
  "environment_id": "$(cat .environment_id 2>/dev/null || echo 'unknown')",
  "workspace_id": "${POSTMAN_WORKSPACE_ID:-default}"
}
EOF

print_success "Upload information saved to .postman_upload_info.json"