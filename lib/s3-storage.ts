import { S3Client, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const S3_BUCKET = process.env.S3_CHAT_BUCKET || 'codinit-chat-storage'

export interface S3StorageConfig {
  bucket?: string
  region?: string
}

export interface S3ObjectMetadata {
  etag?: string
  lastModified?: Date
  contentLength?: number
}

export class S3Storage {
  private client: S3Client
  private bucket: string

  constructor(config?: S3StorageConfig) {
    this.client = s3Client
    this.bucket = config?.bucket || S3_BUCKET
  }

  /**
   * Upload data to S3
   */
  async uploadObject(key: string, data: string | Buffer | Uint8Array, contentType = 'application/json'): Promise<void> {
    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          ServerSideEncryption: 'AES256',
        },
      })

      await upload.done()
    } catch (error) {
      console.error('Error uploading to S3:', error)
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload data to S3 with conditional write using ETag
   * @param key S3 object key
   * @param data Data to upload
   * @param expectedEtag Expected ETag for conditional write (use '*' for if-none-match)
   * @param contentType Content type of the data
   * @returns The new ETag of the uploaded object
   */
  async uploadObjectConditional(
    key: string, 
    data: string | Buffer | Uint8Array, 
    expectedEtag?: string,
    contentType = 'application/json'
  ): Promise<string> {
    try {
      const uploadParams: any = {
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }

      // Add conditional write parameters
      if (expectedEtag === '*') {
        // Only create if object doesn't exist
        uploadParams.IfNoneMatch = '*'
      } else if (expectedEtag) {
        // Only update if ETag matches (object hasn't changed)
        uploadParams.IfMatch = expectedEtag
      }

      const upload = new Upload({
        client: this.client,
        params: uploadParams,
      })

      const result = await upload.done()
      return result.ETag?.replace(/"/g, '') || ''
    } catch (error: any) {
      if (error.name === 'PreconditionFailed' || error.statusCode === 412) {
        throw new Error('Conditional write failed: object has been modified by another process')
      }
      console.error('Error uploading to S3:', error)
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download data from S3
   */
  async downloadObject(key: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      
      if (!response.Body) {
        return null
      }

      const bodyContents = await response.Body.transformToString()
      return bodyContents
    } catch (error) {
      if ((error as any)?.name === 'NoSuchKey') {
        return null
      }
      console.error('Error downloading from S3:', error)
      throw new Error(`Failed to download from S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download data from S3 with metadata (including ETag)
   */
  async downloadObjectWithMetadata(key: string): Promise<{ content: string | null; metadata: S3ObjectMetadata }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      
      const metadata: S3ObjectMetadata = {
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
        contentLength: response.ContentLength,
      }

      if (!response.Body) {
        return { content: null, metadata }
      }

      const bodyContents = await response.Body.transformToString()
      return { content: bodyContents, metadata }
    } catch (error) {
      if ((error as any)?.name === 'NoSuchKey') {
        return { 
          content: null, 
          metadata: {} 
        }
      }
      console.error('Error downloading from S3:', error)
      throw new Error(`Failed to download from S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get object metadata without downloading content
   */
  async getObjectMetadata(key: string): Promise<S3ObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const response = await this.client.send(command)
      
      return {
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
        contentLength: response.ContentLength,
      }
    } catch (error) {
      if ((error as any)?.name === 'NotFound' || (error as any)?.name === 'NoSuchKey') {
        return null
      }
      console.error('Error getting S3 metadata:', error)
      throw new Error(`Failed to get S3 metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete object from S3
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.client.send(command)
    } catch (error) {
      console.error('Error deleting from S3:', error)
      throw new Error(`Failed to delete from S3: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List objects with a given prefix
   */
  async listObjects(prefix: string, maxKeys = 1000): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })

      const response = await this.client.send(command)
      return response.Contents?.map(obj => obj.Key || '') || []
    } catch (error) {
      console.error('Error listing S3 objects:', error)
      throw new Error(`Failed to list S3 objects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if object exists in S3
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      if ((error as any)?.name === 'NoSuchKey') {
        return false
      }
      throw error
    }
  }

  /**
   * Upload JSON data to S3
   */
  async uploadJSON(key: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2)
    await this.uploadObject(key, jsonString, 'application/json')
  }

  /**
   * Upload JSON data to S3 with conditional write
   * @param key S3 object key
   * @param data Data to upload as JSON
   * @param expectedEtag Expected ETag for conditional write
   * @returns The new ETag of the uploaded object
   */
  async uploadJSONConditional(key: string, data: any, expectedEtag?: string): Promise<string> {
    const jsonString = JSON.stringify(data, null, 2)
    return await this.uploadObjectConditional(key, jsonString, expectedEtag, 'application/json')
  }

  /**
   * Download and parse JSON data from S3
   */
  async downloadJSON<T = any>(key: string): Promise<T | null> {
    const jsonString = await this.downloadObject(key)
    if (!jsonString) {
      return null
    }

    try {
      return JSON.parse(jsonString) as T
    } catch (error) {
      console.error('Error parsing JSON from S3:', error)
      throw new Error(`Failed to parse JSON from S3: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
    }
  }

  /**
   * Download and parse JSON data from S3 with metadata
   */
  async downloadJSONWithMetadata<T = any>(key: string): Promise<{ data: T | null; metadata: S3ObjectMetadata }> {
    const { content, metadata } = await this.downloadObjectWithMetadata(key)
    
    if (!content) {
      return { data: null, metadata }
    }

    try {
      const data = JSON.parse(content) as T
      return { data, metadata }
    } catch (error) {
      console.error('Error parsing JSON from S3:', error)
      throw new Error(`Failed to parse JSON from S3: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
    }
  }

  /**
   * Get S3 object URL (for debugging/admin purposes)
   */
  getObjectUrl(key: string): string {
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
  }
}

// Export singleton instance
export const s3Storage = new S3Storage()

// Utility functions for common S3 operations
export const S3Utils = {
  /**
   * Generate S3 key for user chat session
   */
  getUserSessionKey(userId: string, sessionId: string): string {
    return `users/${userId}/sessions/${sessionId}/messages.json`
  },

  /**
   * Generate S3 key for user session metadata
   */
  getUserSessionMetadataKey(userId: string, sessionId: string): string {
    return `users/${userId}/sessions/${sessionId}/metadata.json`
  },

  /**
   * Generate S3 key for user sessions list
   */
  getUserSessionsKey(userId: string): string {
    return `users/${userId}/sessions/`
  },

  /**
   * Generate S3 key for daily aggregate data
   */
  getDailyAggregateKey(date: string): string {
    return `aggregate/daily/${date}/chat-stats.json`
  },

  /**
   * Generate S3 key for user analytics
   */
  getUserAnalyticsKey(userId: string): string {
    return `aggregate/user-analytics/${userId}/usage-summary.json`
  },

  /**
   * Extract session ID from S3 key
   */
  extractSessionIdFromKey(key: string): string | null {
    const match = key.match(/sessions\/([^\/]+)\//)
    return match ? match[1] : null
  },

  /**
   * Extract user ID from S3 key
   */
  extractUserIdFromKey(key: string): string | null {
    const match = key.match(/users\/([^\/]+)\//)
    return match ? match[1] : null
  },
}