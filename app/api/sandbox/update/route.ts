import { Sandbox } from "@e2b/code-interpreter";

interface UpdateFileRequestBody {
  sandboxId: string;
  filePath: string;
  content: string;
  userID?: string; 
  teamID?: string; 
}

export const maxDuration = 60;

export async function POST(req: Request) {
  const operationId = `sandbox_update_${crypto.randomUUID()}`;
  console.log(`[Sandbox Update API ${operationId}] Processing request`);

  let requestBody: UpdateFileRequestBody;

  try {
    requestBody = await req.json();
  } catch (error) {
    console.error(`[Sandbox Update API ${operationId}] Failed to parse request body:`, error);
    return new Response(
      JSON.stringify({
        error: "Invalid JSON in request body",
        code: "INVALID_JSON",
        operationId,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { sandboxId, filePath, content, userID, teamID } = requestBody;

  
  if (!sandboxId) {
    return new Response(JSON.stringify({ error: "sandboxId is required", code: "MISSING_SANDBOX_ID", operationId }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!filePath) {
    return new Response(JSON.stringify({ error: "filePath is required", code: "MISSING_FILE_PATH", operationId }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (typeof content !== 'string') { 
    return new Response(JSON.stringify({ error: "content is required and must be a string", code: "MISSING_CONTENT", operationId }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  console.log(`[Sandbox Update API ${operationId}] Request details:`, {
    sandboxId,
    filePath,
    contentLength: content.length,
    userID: userID ? userID.substring(0, 8) + "..." : undefined,
    teamID: teamID ? teamID.substring(0, 8) + "..." : undefined,
  });

  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    console.error(`[Sandbox Update API ${operationId}] E2B API key not configured`);
    return new Response(
      JSON.stringify({
        error: "Sandbox service not configured",
        code: "SERVICE_NOT_CONFIGURED",
        operationId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let sbx: Sandbox | null = null;

  try {
    console.log(`[Sandbox Update API ${operationId}] Attempting to reconnect to sandbox: ${sandboxId}`);
    
    
    
    
    const sandboxConfig = {
      apiKey, 
      metadata: { 
        operationId,
        userID: userID || "",
        teamID: teamID || "",
      },
      
    };

    
    
    
    
    
    
    
    
    
    
    
    
    
    sbx = new Sandbox({ sandboxId: sandboxId, apiKey: apiKey });

    
    
    
    
    

    console.log(`[Sandbox Update API ${operationId}] Writing file: ${filePath}`);
    await sbx.files.write(filePath, content);

    console.log(`[Sandbox Update API ${operationId}] File updated successfully in sandbox: ${sandboxId}`);
    return new Response(
      JSON.stringify({
        message: "File updated successfully",
        sandboxId,
        filePath,
        operationId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (error: any) {
    console.error(`[Sandbox Update API ${operationId}] Operation failed for sandbox ${sandboxId}:`, {
      error: error.message,
      stack: error.stack,
    });

    
    let statusCode = 500;
    let errorCode = "UPDATE_FAILED";
    let errorMessage = "Failed to update file in sandbox.";

    if (error.message.includes("not found") || error.message.includes("Cannot find sandbox")) {
      statusCode = 404;
      errorCode = "SANDBOX_NOT_FOUND";
      errorMessage = `Sandbox with ID '${sandboxId}' not found or not active.`;
    } else if (error.message.includes("permission") || error.message.includes("denied")) {
      statusCode = 403;
      errorCode = "PERMISSION_DENIED";
      errorMessage = "Permission denied to update file in sandbox.";
    } else if (error.message.includes("timeout")) {
      statusCode = 408;
      errorCode = "OPERATION_TIMEOUT";
      errorMessage = "Operation timed out.";
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: errorCode,
        details: error.message,
        sandboxId,
        operationId,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  } finally {
    
    
    
    
    if (sbx) {
      console.log(`[Sandbox Update API ${operationId}] Operations completed for sandbox ${sbx.sandboxId}`);
      
    }
  }
}
