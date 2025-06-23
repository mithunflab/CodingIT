import type { FragmentSchema } from "@/lib/schema"
import type { ExecutionResultInterpreter, ExecutionResultWeb } from "@/lib/types"
import { Sandbox } from "@e2b/code-interpreter"
import templatesData from "@/lib/templates.json"

const sandboxTimeout = 10 * 60 * 1000

export const maxDuration = 60

export async function POST(req: Request) {
  const requestId = `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[Sandbox API ${requestId}] Processing request`)

  let requestBody: any

  try {
    requestBody = await req.json()
  } catch (error) {
    console.error(`[Sandbox API ${requestId}] Failed to parse request body:`, error)
    return new Response(
      JSON.stringify({
        error: "Invalid JSON in request body",
        code: "INVALID_JSON",
        requestId,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  const {
    fragment,
    userID,
    teamID,
    accessToken,
  }: {
    fragment: FragmentSchema
    userID: string
    teamID: string
    accessToken: string
  } = requestBody

  
  const validationResult = validateSandboxRequest({ fragment, userID, teamID, accessToken })
  if (!validationResult.valid) {
    return new Response(
      JSON.stringify({
        error: validationResult.error,
        code: validationResult.code,
        requestId,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  console.log(`[Sandbox API ${requestId}] Processing request:`, {
    fragmentTemplate: fragment.template,
    userID: userID.substring(0, 8) + "...",
    teamID: teamID.substring(0, 8) + "...",
    hasAccessToken: !!accessToken,
    filesCount: fragment.files?.length || 0,
  })

  const apiKey = process.env.E2B_API_KEY
  if (!apiKey) {
    console.error(`[Sandbox API ${requestId}] E2B API key not configured`)
    return new Response(
      JSON.stringify({
        error: "Sandbox service not configured",
        code: "SERVICE_NOT_CONFIGURED",
        requestId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  let sbx: Sandbox | null = null

  try {
    
    console.log(`[Sandbox API ${requestId}] Creating sandbox with template:`, fragment.template)

    const sandboxConfig = {
      metadata: {
        template: fragment.template,
        userID: userID || "",
        teamID: teamID || "",
        requestId,
      },
      timeoutMs: sandboxTimeout,
      ...(teamID && accessToken
        ? {
            headers: {
              "X-Supabase-Team": teamID,
              "X-Supabase-Token": accessToken,
            },
          }
        : {}),
    }

    sbx = await Sandbox.create(fragment.template, sandboxConfig)
    console.log(`[Sandbox API ${requestId}] Sandbox created successfully:`, sbx.sandboxId)

    
    if (fragment.has_additional_dependencies && fragment.install_dependencies_command) {
      try {
        console.log(`[Sandbox API ${requestId}] Installing dependencies:`, fragment.additional_dependencies)
        const installResult = await sbx.commands.run(fragment.install_dependencies_command, {
          timeoutMs: 120000, 
        })

        if (installResult.exitCode !== 0) {
          console.warn(`[Sandbox API ${requestId}] Dependency installation failed:`, {
            exitCode: installResult.exitCode,
            stderr: installResult.stderr,
            stdout: installResult.stdout,
          })
          
        } else {
          console.log(`[Sandbox API ${requestId}] Dependencies installed successfully`)
        }
      } catch (installError) {
        console.warn(`[Sandbox API ${requestId}] Failed to install dependencies:`, installError)
        
      }
    }

    
    if (fragment.files && Array.isArray(fragment.files) && fragment.files.length > 0) {
      console.log(`[Sandbox API ${requestId}] Copying ${fragment.files.length} file(s)`)
      
      const copyResults = await Promise.allSettled(
        fragment.files.map(async (file, index) => {
          if (!file.file_path || typeof file.file_content !== 'string') {
            throw new Error(`File ${index}: Missing path or content is not a string`)
          }

          
          if (!isValidFilePath(file.file_path)) {
            throw new Error(`File ${index}: Invalid file path: ${file.file_path}`)
          }

          await sbx!.files.write(file.file_path, file.file_content)
          console.log(`[Sandbox API ${requestId}] Copied file: ${file.file_path}`)
          return file.file_path
        })
      )

      
      const failedCopies = copyResults.filter(result => result.status === 'rejected')
      if (failedCopies.length > 0) {
        const errors = failedCopies.map(result => (result as PromiseRejectedResult).reason.message)
        console.error(`[Sandbox API ${requestId}] Failed to copy files:`, errors)
        throw new Error(`Failed to copy ${failedCopies.length} file(s): ${errors.join(', ')}`)
      }
    }

    
    if (fragment.template === "code-interpreter-v1") {
      return await handleCodeInterpreter(sbx, fragment, requestId)
    } else {
      return await handleWebSandbox(sbx, fragment, requestId)
    }

  } catch (error: any) {
    console.error(`[Sandbox API ${requestId}] Sandbox operation failed:`, {
      error: error.message,
      stack: error.stack,
      template: fragment?.template,
    })

    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
        code: getErrorCode(error),
        details: error.message,
        template: fragment?.template,
        requestId,
      }),
      {
        status: getErrorStatus(error),
        headers: { "Content-Type": "application/json" },
      },
    )
  } finally {
    
    if (sbx) {
      console.log(`[Sandbox API ${requestId}] Sandbox ${sbx.sandboxId} operations completed`)
    }
  }
}


function validateSandboxRequest(request: any): { valid: boolean; error?: string; code?: string } {
  if (!request.fragment) {
    console.error("Validation failed: Fragment is required", { code: "MISSING_FRAGMENT" }); // Added logging
    return { valid: false, error: "Fragment is required", code: "MISSING_FRAGMENT" }
  }

  if (!request.userID || typeof request.userID !== 'string') {
    console.error("Validation failed: Valid user ID is required", { code: "MISSING_USER_ID", userID: request.userID }); // Added logging
    return { valid: false, error: "Valid user ID is required", code: "MISSING_USER_ID" }
  }

  if (!request.teamID || typeof request.teamID !== 'string') {
    console.error("Validation failed: Valid team ID is required", { code: "MISSING_TEAM_ID", teamID: request.teamID }); // Added logging
    return { valid: false, error: "Valid team ID is required", code: "MISSING_TEAM_ID" }
  }

  const { fragment } = request

  if (!fragment.template || typeof fragment.template !== 'string') {
    console.error("Validation failed: Valid template is required", { code: "INVALID_TEMPLATE", template: fragment.template }); // Added logging
    return { valid: false, error: "Valid template is required", code: "INVALID_TEMPLATE" }
  }

  
  if (!Object.keys(templatesData).includes(fragment.template)) {
    console.error("Validation failed: Unknown template", { code: "UNKNOWN_TEMPLATE", template: fragment.template, allowedTemplates: Object.keys(templatesData) }); // Added logging
    return { valid: false, error: `Template '${fragment.template}' is not a valid template.`, code: "UNKNOWN_TEMPLATE" }
  }

  
  if (fragment.files && Array.isArray(fragment.files)) {
    for (let i = 0; i < fragment.files.length; i++) {
      const file = fragment.files[i]
      if (!file.file_path || typeof file.file_path !== 'string') {
        console.error("Validation failed: File missing or invalid file path", { code: "INVALID_FILE_PATH", fileIndex: i, filePath: file.file_path }); // Added logging
        return { valid: false, error: `File ${i}: Missing or invalid file path`, code: "INVALID_FILE_PATH" }
      }
      if (typeof file.file_content !== 'string') {
        console.error("Validation failed: File content must be a string", { code: "INVALID_FILE_CONTENT", fileIndex: i }); // Added logging
        return { valid: false, error: `File ${i}: File content must be a string`, code: "INVALID_FILE_CONTENT" }
      }
    }
  }

  return { valid: true }
}


function isValidFilePath(filePath: string): boolean {
  
  if (filePath.includes('..') || filePath.includes('~') || filePath.startsWith('/')) {
    return false
  }

  
  const allowedExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.md', '.txt',
    '.py', '.java', '.php', '.rb', '.go', '.rs', '.sql', '.yml', '.yaml'
  ]
  
  const hasValidExtension = allowedExtensions.some(ext => filePath.endsWith(ext))
  if (!hasValidExtension) {
    return false
  }

  
  if (filePath.length > 200) {
    return false
  }

  return true
}


async function handleCodeInterpreter(
  sbx: Sandbox, 
  fragment: FragmentSchema, 
  requestId: string
): Promise<Response> {
  console.log(`[Sandbox API ${requestId}] Running code in interpreter`)

  try {
    let codeToRun = ""
    
    if (fragment.file_path && fragment.files && fragment.files.length > 0) {
      const mainFile = fragment.files.find(f => f.file_path === fragment.file_path)
      if (mainFile && typeof mainFile.file_content === 'string') {
        codeToRun = mainFile.file_content
      } else {
        console.warn(`[Sandbox API ${requestId}] Main script not found: ${fragment.file_path}`)
      }
    } else if (fragment.files && fragment.files.length === 1 && typeof fragment.files[0].file_content === 'string') {
      codeToRun = fragment.files[0].file_content
      console.log(`[Sandbox API ${requestId}] Using single file content`)
    }

    const { logs, error, results } = await sbx.runCode(codeToRun)

    const response = {
      sbxId: sbx.sandboxId,
      template: fragment.template,
      stdout: logs.stdout,
      stderr: logs.stderr,
      runtimeError: error,
      cellResults: results,
    } as ExecutionResultInterpreter

    console.log(`[Sandbox API ${requestId}] Code execution completed successfully`)
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (execError) {
    console.error(`[Sandbox API ${requestId}] Code execution failed:`, execError)
    throw new Error(`Code execution failed: ${execError instanceof Error ? execError.message : String(execError)}`)
  }
}


async function handleWebSandbox(
  sbx: Sandbox, 
  fragment: FragmentSchema, 
  requestId: string
): Promise<Response> {
  const port = fragment.port || 80
  const host = sbx.getHost(port)
  const url = `https://${host}`

  console.log(`[Sandbox API ${requestId}] Web sandbox created:`, url)

  const response = {
    sbxId: sbx.sandboxId,
    template: fragment.template,
    url: url,
  } as ExecutionResultWeb

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  })
}


function getErrorCode(error: any): string {
  const message = error.message || ""
  
  if (message.includes("timeout")) return "SANDBOX_TIMEOUT"
  if (message.includes("quota") || message.includes("limit")) return "SANDBOX_QUOTA_EXCEEDED"
  if (message.includes("authentication") || message.includes("unauthorized")) return "SANDBOX_AUTH_ERROR"
  if (message.includes("template")) return "INVALID_TEMPLATE"
  if (message.includes("file")) return "FILE_ERROR"
  
  return "SANDBOX_ERROR"
}

function getErrorMessage(error: any): string {
  const message = error.message || ""
  
  if (message.includes("timeout")) return "Sandbox creation timed out. Please try again."
  if (message.includes("quota") || message.includes("limit")) return "Sandbox quota exceeded. Please try again later."
  if (message.includes("authentication") || message.includes("unauthorized")) return "Sandbox authentication failed."
  if (message.includes("template")) return "Invalid sandbox template specified."
  if (message.includes("file")) return "Error processing uploaded files."
  
  return "Failed to create sandbox environment"
}

function getErrorStatus(error: any): number {
  const message = error.message || ""
  
  if (message.includes("authentication") || message.includes("unauthorized")) return 401
  if (message.includes("quota") || message.includes("limit")) return 429
  if (message.includes("template")) return 400
  if (message.includes("timeout")) return 408
  
  return 500
}
