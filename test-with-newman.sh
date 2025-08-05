#!/bin/bash

# CodingIT Newman Test Script
# This script runs the Postman collection locally using Newman

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Add npm global bin to PATH
export PATH="$PATH:$HOME/.npm-global/bin"

# Check if Newman is available
if ! command -v newman &> /dev/null; then
    print_error "Newman is not installed or not in PATH"
    print_status "Install Newman with: npm install -g newman"
    exit 1
fi

COLLECTION_FILE="postman-collection.json"
ENVIRONMENT_FILE="postman-environment.json"

# Check if files exist
if [ ! -f "$COLLECTION_FILE" ]; then
    print_error "Collection file '$COLLECTION_FILE' not found!"
    exit 1
fi

if [ ! -f "$ENVIRONMENT_FILE" ]; then
    print_error "Environment file '$ENVIRONMENT_FILE' not found!"
    exit 1
fi

print_status "CodingIT API Collection Test with Newman"
print_status "======================================"
echo

print_status "Newman version: $(newman --version)"
echo

# Check if server is running
print_status "Checking if CodingIT server is running..."
if curl -s -f "http://localhost:3000/api/debug" > /dev/null 2>&1; then
    print_success "Server is running at http://localhost:3000"
else
    print_warning "Server might not be running at http://localhost:3000"
    print_status "Make sure to start your development server with: npm run dev"
    echo
fi

# Run specific folders or the entire collection
if [ -n "$1" ]; then
    FOLDER_OPTION="--folder '$1'"
    print_status "Running tests for folder: $1"
else
    FOLDER_OPTION=""
    print_status "Running all tests in the collection"
fi

# Newman run options
NEWMAN_OPTIONS="
    --collection '$COLLECTION_FILE'
    --environment '$ENVIRONMENT_FILE'
    --reporters cli,json
    --reporter-json-export newman-results.json
    --timeout-request 30000
    --delay-request 1000
    --disable-unicode
    $FOLDER_OPTION
"

print_status "Starting Newman test run..."
echo

# Run Newman
eval newman run $NEWMAN_OPTIONS

# Check results
if [ $? -eq 0 ]; then
    print_success "All tests completed successfully!"
else
    print_warning "Some tests may have failed - check the output above and newman-results.json"
fi

echo
print_status "Test results saved to: newman-results.json"

# Display summary if results file exists
if [ -f "newman-results.json" ]; then
    print_status "Test Summary:"
    echo "=============="
    python3 -c "
import json
try:
    with open('newman-results.json', 'r') as f:
        data = json.load(f)
    run = data.get('run', {})
    stats = run.get('stats', {})
    
    print(f\"📊 Requests: {stats.get('requests', {}).get('total', 0)}\")
    print(f\"✅ Passed: {stats.get('assertions', {}).get('total', 0) - stats.get('assertions', {}).get('failed', 0)}\")
    print(f\"❌ Failed: {stats.get('assertions', {}).get('failed', 0)}\")
    print(f\"⏱️  Total Time: {run.get('timings', {}).get('completed', 0)}ms\")
    
    # Show failed tests if any
    failures = run.get('failures', [])
    if failures:
        print(f\"\\n🚨 Failed Tests:\")
        for failure in failures:
            error = failure.get('error', {})
            print(f\"  • {failure.get('source', {}).get('name', 'Unknown')}: {error.get('message', 'Unknown error')}\")
except Exception as e:
    print(f\"Could not parse results: {e}\")
"
fi

echo
print_status "Next Steps:"
echo "1. Review any failed tests in the output above"
echo "2. Set required environment variables (API keys) for full testing"
echo "3. Check newman-results.json for detailed test results"
echo "4. Run specific test folders with: ./test-with-newman.sh 'Folder Name'"

# Example commands
echo
print_status "Example commands:"
echo "./test-with-newman.sh 'Authentication'        # Test only auth endpoints"
echo "./test-with-newman.sh 'AI Generation'        # Test only AI endpoints"
echo "./test-with-newman.sh 'File Operations'      # Test only file endpoints"