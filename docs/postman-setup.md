# Postman Integration Setup Guide

This guide walks you through setting up and using the CodingIT API collection with Postman.

## 🚀 Quick Start

### Method 1: Upload to Postman Cloud (Recommended)

1. **Get your Postman API Key**:
   - Go to [Postman API Keys](https://web.postman.co/settings/me/api-keys)
   - Click "Generate API Key"
   - Name it "CodingIT Upload" and copy the key

2. **Upload the collection**:
   ```bash
   # Set your API key
   export POSTMAN_API_KEY="your_postman_api_key_here"
   
   # Optional: Set workspace ID (get from Postman URL or script output)
   export POSTMAN_WORKSPACE_ID="your_workspace_id"
   
   # Run the upload script
   ./upload-to-postman.sh
   ```

3. **Configure environment variables in Postman**:
   - Open Postman and select "CodingIT Environment"
   - Set these required variables:
     ```
     E2B_API_KEY = your_e2b_api_key
     SUPABASE_URL = your_supabase_project_url
     SUPABASE_ANON_KEY = your_supabase_anon_key
     anthropic_api_key = your_anthropic_api_key
     ```

### Method 2: Import Files Manually

1. **Import Collection**:
   - Open Postman
   - Click "Import" → "Upload Files"
   - Select `postman-collection.json`

2. **Import Environment**:
   - Click "Import" → "Upload Files" 
   - Select `postman-environment.json`

### Method 3: Test Locally with Newman

1. **Run local tests**:
   ```bash
   # Test all endpoints
   ./test-with-newman.sh
   
   # Test specific folder
   ./test-with-newman.sh "AI Generation"
   ./test-with-newman.sh "File Operations"
   ```

## 📋 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | API base URL | `http://localhost:3000` |
| `E2B_API_KEY` | E2B sandbox API key | `e2b_xxx` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `eyJxxx` |

### AI Provider Keys (Optional)
| Variable | Provider | Required For |
|----------|----------|--------------|
| `anthropic_api_key` | Anthropic | Claude models |
| `openai_api_key` | OpenAI | GPT models |
| `google_api_key` | Google | Gemini models |

### Authentication Tokens (Auto-generated)
| Variable | Description | Source |
|----------|-------------|--------|
| `supabase_access_token` | User session token | Login flow |
| `github_access_token` | GitHub integration | OAuth flow |
| `session_id` | Sandbox session | Auto-generated |
| `sandbox_id` | Active sandbox | API responses |

### GitHub Integration (Optional)
| Variable | Description | Required For |
|----------|-------------|--------------|
| `GITHUB_CLIENT_ID` | OAuth app ID | GitHub integration |
| `GITHUB_CLIENT_SECRET` | OAuth app secret | GitHub integration |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret | Webhook verification |

## 🧪 Testing Guide

### 1. Basic Connectivity Test
```bash
# Test if server is running
curl http://localhost:3000/api/debug

# Should return 401 (unauthorized) - server is working
```

### 2. Generate Your First Fragment
1. Go to **AI Generation** → **Generate Fragment**
2. Use this sample request:
   ```json
   {
     "messages": [
       {
         "role": "user", 
         "content": "Create a simple Python hello world script"
       }
     ],
     "template": "code-interpreter-v1",
     "model": "claude-3-sonnet-20240229",
     "config": {
       "model": "claude-3-sonnet-20240229",
       "apiKey": "{{anthropic_api_key}}",
       "temperature": 0.7
     }
   }
   ```

### 3. Execute Generated Code
1. Copy the generated code from step 2
2. Go to **Code Execution** → **Execute Code** 
3. Use the `session_id` and generated code

### 4. Test File Operations
1. **List Files**: **File Operations** → **List Files**
2. **Read File**: **File Operations** → **Read File Content**
3. **Create File**: **File Operations** → **Write File Content**

### 5. Test Workflows
1. **Create Workflow**: **Workflows** → **Create Workflow**
2. **Execute Workflow**: **Workflows** → **Execute Workflow**
3. **Check Status**: **Workflows** → **Get Execution Status**

## 🔧 Common Issues & Solutions

### Issue: "401 Unauthorized"
- **Cause**: Missing or invalid authentication token
- **Solution**: Set `supabase_access_token` or ensure Supabase auth is working

### Issue: "E2B_API_KEY environment variable not found"
- **Cause**: Missing E2B API key
- **Solution**: Set `E2B_API_KEY` in environment variables

### Issue: "Rate limit exceeded (429)"
- **Cause**: Too many requests without API key
- **Solution**: Add your own AI provider API key to bypass rate limits

### Issue: Newman "command not found"
- **Cause**: Newman not in PATH
- **Solution**: 
  ```bash
  # Add to ~/.zshrc or ~/.bash_profile
  export PATH="$PATH:$HOME/.npm-global/bin"
  
  # Or run with full path
  $HOME/.npm-global/bin/newman run postman-collection.json
  ```

### Issue: Collection upload fails
- **Cause**: Invalid Postman API key or permissions
- **Solution**: 
  1. Verify API key at https://web.postman.co/settings/me/api-keys
  2. Ensure key has workspace permissions
  3. Check workspace ID if specified

## 📊 Collection Structure

The collection is organized into these folders:

### 🔐 Authentication (2 endpoints)
- GitHub OAuth callback
- Revoke GitHub token

### 💬 AI Generation (2 endpoints)  
- Generate code fragments
- Generate multi-step workflows

### ⚡ Code Execution (1 endpoint)
- Execute code in sandboxes

### 🔧 Sandbox Management (2 endpoints)
- Create/run sandboxes
- Execute terminal commands

### 📁 File Operations (5 endpoints)
- List files, read/write content
- Existing sandbox operations

### 🐛 Debug & Analysis (2 endpoints)
- Analyze errors
- Debug session management

### 🚀 Deployments (5 endpoints)
- Create, manage, and rollback deployments

### 🔗 GitHub Integration (2 endpoints)
- List repositories
- Get repository contents

### ⚡ Workflows (6 endpoints)
- Full CRUD operations
- Execution management

### 📊 Data & Import (1 endpoint)
- HuggingFace dataset import

### 🎣 Webhooks (1 endpoint)
- GitHub webhook handler

## 🎯 Advanced Usage

### Custom Scripts
The collection includes pre-request and test scripts that:
- Auto-generate session IDs
- Extract sandbox/execution IDs from responses
- Validate response status codes
- Set dynamic environment variables

### Batch Testing
```bash
# Test all authentication endpoints
./test-with-newman.sh "Authentication"

# Test AI generation with custom timeout
newman run postman-collection.json \
  --environment postman-environment.json \
  --folder "AI Generation" \
  --timeout-request 60000
```

### API Monitoring
Set up Postman monitoring for:
- Health check endpoints
- Critical user flows
- Performance benchmarks

### Team Collaboration
1. Upload to team workspace
2. Share environment templates
3. Document API changes
4. Set up automated testing

## 📞 Support

- **GitHub Issues**: [CodingIT Issues](https://github.com/Gerome-Elassaad/CodingIT/issues)
- **Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OpenAPI Spec**: [openapi.yaml](./openapi.yaml)

---

**Last Updated**: December 2024  
**Collection Version**: 1.0.0