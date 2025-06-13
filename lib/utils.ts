import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isFileInArray(file: File, existingFiles: File[]) {
  return existingFiles.some(
    (existing) =>
      existing.name === file.name &&
      existing.size === file.size &&
      existing.type === file.type
  )
}

export type ParsedApiError = { code: string; message: string; rawData: any }

export const parseApiError = (error: Error | any): ParsedApiError => {
  let errorData: any = {}
  let errorCode = "UNKNOWN_ERROR"
  let errorMessage = error.message || "An unexpected error occurred"

  try {
    const errorText = error.message || ""
    const jsonMatch = errorText.match(/\{[\s\S]*\}/)
    if (jsonMatch && jsonMatch[0]) {
      errorData = JSON.parse(jsonMatch[0])
      errorCode = errorData.code || errorCode
      errorMessage = errorData.error || errorData.message || errorMessage
    } else if (errorText.includes("Internal Server Error")) {
      errorCode = "INTERNAL_SERVER_ERROR"
      errorMessage = "Internal server error occurred. Please try again."
    } else if (errorText.toLowerCase().includes("fetch") || errorText.toLowerCase().includes("networkerror")) {
      errorCode = "NETWORK_ERROR"
      errorMessage = "Network error. Please check your connection and try again."
    } else if (errorText.toLowerCase().includes("rate limit")) {
      errorCode = "RATE_LIMIT_ERROR"
      errorMessage = "Rate limit exceeded. Please wait before trying again."
    }
  } catch (parseError) {
    // If JSON parsing fails or another error occurs, log it and use the original message
    console.warn("Could not parse error details from error message string:", parseError)
  }

  // If error object itself has properties like 'code' or 'data', try to use them
  if (typeof error === 'object' && error !== null) {
    if ('code' in error && typeof error.code === 'string') {
      errorCode = error.code;
    }
    if ('data' in error) { // Vercel AI SDK sometimes puts structured errors in 'data'
        const dataError = (error as any).data;
        if (typeof dataError === 'object' && dataError !== null) {
            errorData = { ...errorData, ...dataError };
            if (dataError.code) errorCode = dataError.code;
            if (dataError.error) errorMessage = dataError.error;
            else if (dataError.message) errorMessage = dataError.message;
        } else if (typeof dataError === 'string') {
            errorMessage = dataError;
        }
    }
  }


  return {
    code: errorCode,
    message: errorMessage,
    rawData: errorData,
  }
}
