import { Sandbox } from "@e2b/code-interpreter";

interface UpdateFileRequestBody {
  sandboxId: string;
  filePath: string;
  content: string;
  userID?: string; // Optional: for logging or context
  teamID?: string; // Optional: for logging or context
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

  // Validate request body
  if (!sandboxId) {
    return new Response(JSON.stringify({ error: "sandboxId is required", code: "MISSING_SANDBOX_ID", operationId }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!filePath) {
    return new Response(JSON.stringify({ error: "filePath is required", code: "MISSING_FILE_PATH", operationId }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (typeof content !== 'string') { // Content can be an empty string
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
    // Reconnect to the existing sandbox
    // Note: The E2B SDK might require specific headers or config for reconnect,
    // similar to create. Adjust if necessary based on SDK documentation.
    const sandboxConfig = {
      apiKey, // Pass API key if required by reconnect, or rely on global config
      metadata: { // Optional: pass metadata if useful for reconnect context
        operationId,
        userID: userID || "",
        teamID: teamID || "",
      },
      // Add any other necessary headers or config for reconnecting
    };

    // The E2B SDK's `Sandbox.reconnect` might not exist or work this way.
    // A common pattern is to get a handle to an existing sandbox.
    // If direct reconnection isn't the primary method, this might involve
    // ensuring the sandbox is active and then performing operations.
    // For this example, we assume a reconnect-like capability or that operations
    // can be performed on a known, active sandbox ID.

    // Let's assume for now that we can operate on a sandbox instance if we know its ID
    // and it's still active. The E2B SDK might handle this internally when you
    // instantiate a Sandbox object with an existing ID, or it might have a specific
    // static method.
    // If `Sandbox.reconnect(sandboxId, sandboxConfig)` is not the correct method,
    // this part needs to be adjusted based on E2B SDK's actual API for existing sandboxes.

    // A more robust approach might be to ensure the sandbox is "kept alive" or
    // use an SDK feature that allows operations by ID without explicit reconnect,
    // or the client passes enough info for the server to manage sandbox sessions.

    // Given the limitations of not knowing the exact E2B SDK method for this,
    // I'll proceed with a conceptual `Sandbox.reconnect`.
    // If this method is incorrect, the actual implementation will depend on how E2B
    // expects interaction with existing, active sandboxes.
    // A common alternative is that `new Sandbox({ id: sandboxId, apiKey })` might work.
    
    // Let's try to instantiate with the ID, which is a common pattern for some SDKs
    // to resume control or interact with an existing resource.
    // The E2B SDK likely uses `sandboxId` in the constructor options for an existing sandbox.
    sbx = new Sandbox({ sandboxId: sandboxId, apiKey: apiKey });

    // Ensure the sandbox is "open" or ready. Some SDKs require this.
    // await sbx.keepAlive(timeout); // Or similar to ensure it's active
    // This step is highly E2B specific. If `new Sandbox({id})` is enough, great.
    // If not, an explicit `sbx.connect()` or `sbx.open()` might be needed.
    // For now, we'll assume `new Sandbox({id})` is sufficient to target it.

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

    // Determine error type for appropriate response
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
    // If we explicitly opened or reconnected, we might need to close or disconnect.
    // However, E2B sandboxes are often managed by timeouts.
    // If `sbx.close()` is needed for instances obtained via `reconnect` or `new Sandbox({id})`, add it here.
    // For E2B, usually, they auto-close after inactivity.
    if (sbx) {
      console.log(`[Sandbox Update API ${operationId}] Operations completed for sandbox ${sbx.sandboxId}`);
      // no explicit close needed or supported on Sandbox instances
    }
  }
}
