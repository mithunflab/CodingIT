import { NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_FILES = 20
const MAX_TOTAL_SIZE = 50 * 1024 * 1024

function analyzeFileContent(content: string, fileName: string): { language: string; [key: string]: any } {
  const ext = fileName.split('.').pop()?.toLowerCase();
  let language = "unknown";
  if (ext === "js" || ext === "ts") language = "javascript";
  else if (ext === "py") language = "python";
  else if (ext === "java") language = "java";
  else if (ext === "json") language = "json";
  return { language };
}

function sanitizeFilePath(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function validateFileUpload(files: File[]): { valid: boolean; error?: string; code?: string } {
  if (!files || files.length === 0) {
    return { valid: false, error: "No files uploaded", code: "NO_FILES" }
  }
  if (files.length > MAX_TOTAL_FILES) {
    return { valid: false, error: `Too many files (max ${MAX_TOTAL_FILES})`, code: "TOO_MANY_FILES" }
  }
  let totalSize = 0
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File ${file.name} exceeds max size (${MAX_FILE_SIZE} bytes)`, code: "FILE_TOO_LARGE" }
    }
    totalSize += file.size
  }
  if (totalSize > MAX_TOTAL_SIZE) {
    return { valid: false, error: `Total upload size exceeds ${MAX_TOTAL_SIZE} bytes`, code: "TOTAL_SIZE_EXCEEDED" }
  }
  return { valid: true }
}

function buildProjectStructure(files: Array<{ name: string; size: number; type: string; path: string; analysis: { language: string } }>) {
  const dependencies: string[] = [];
  const entryPoints: string[] = [];
  files.forEach(file => {
    if (file.name === "package.json") dependencies.push("npm");
    if (file.name === "requirements.txt") dependencies.push("pip");
    if (file.name.endsWith("index.js") || file.name.endsWith("main.py")) entryPoints.push(file.path);
  });
  return {
    dependencies,
    entryPoints,
    files: files.map(f => f.path),
  };
}

export async function POST(request: NextRequest) {
  const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[Upload API ${requestId}] Processing file upload`)

  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    const validationResult = validateFileUpload(files)
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: validationResult.error,
          code: validationResult.code,
          requestId,
        },
        { status: 400 }
      )
    }

    const processedFiles = await Promise.all(
      files.map(async (file, index) => {
        try {
          const content = await file.text()
          const analysis = analyzeFileContent(content, file.name)
          
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            content,
            analysis,
            path: sanitizeFilePath(file.name),
          }
        } catch (error) {
          console.error(`[Upload API ${requestId}] Failed to process file ${index}:`, error)
          throw new Error(`Failed to process file: ${file.name}`)
        }
      })
    )

    // Build project structure
    const projectStructure = buildProjectStructure(processedFiles)
    
    console.log(`[Upload API ${requestId}] Successfully processed ${files.length} files`)

    return NextResponse.json({
      success: true,
      requestId,
      files: processedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        path: f.path,
        analysis: f.analysis,
      })),
      projectStructure,
      summary: {
        totalFiles: processedFiles.length,
        totalSize: processedFiles.reduce((sum, f) => sum + f.size, 0),
        languages: [...new Set(processedFiles.map(f => f.analysis.language))],
        dependencies: projectStructure.dependencies,
        entryPoints: projectStructure.entryPoints,
      },
    })

  } catch (error) {
    console.error(`[Upload API ${requestId}] Upload processing failed:`, error)
    return NextResponse.json(
      {
        error: "Failed to process uploaded files",
        code: "UPLOAD_PROCESSING_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
      },
      { status: 500 }
    )
  }
}