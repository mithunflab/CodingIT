interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  fork: boolean
  language: string | null
  stargazers_count: number
  updated_at: string
  clone_url: string
  default_branch: string
  size: number
}

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string // Added SHA for file updates/deletions
  size?: number
  download_url?: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  public_repos: number
}

export class GitHubIntegration {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getUser(): Promise<GitHubUser | null> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch GitHub user:', error)
      return null
    }
  }

  async getRepositories(page = 1, per_page = 30): Promise<GitHubRepository[]> {
    try {
      const response = await fetch(
        `https://api.github.com/user/repos?page=${page}&per_page=${per_page}&sort=updated&direction=desc`,
        {
          headers: {
            'Authorization': `bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      return []
    }
  }

  async getRepositoryContents(owner: string, repo: string, path = ''): Promise<GitHubFile[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const contents = await response.json()
      return Array.isArray(contents) ? contents : [contents]
    } catch (error) {
      console.error('Failed to fetch repository contents:', error)
      return []
    }
  }

  async downloadFile(downloadUrl: string): Promise<string | null> {
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      console.error('Failed to download file:', error)
      return null
    }
  }

  async downloadRepository(owner: string, repo: string, maxFiles = 50): Promise<{ name: string; path: string; content: string }[]> {
    const allowedExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.php', '.rb', '.go', '.rs',
      '.html', '.css', '.scss', '.sass', '.less',
      '.json', '.yaml', '.yml', '.toml', '.ini', '.env',
      '.md', '.txt', '.gitignore',
      '.sql', '.prisma', '.graphql'
    ]

    const files: { name: string; path: string; content: string }[] = []
    const processedPaths = new Set<string>()

    const processDirectory = async (path = '', depth = 0): Promise<void> => {
      if (depth > 5 || files.length >= maxFiles) return

      const contents = await this.getRepositoryContents(owner, repo, path)
      
      for (const item of contents) {
        if (files.length >= maxFiles) break
        if (processedPaths.has(item.path)) continue

        processedPaths.add(item.path)

        if (item.type === 'file' && item.download_url) {
          const fileExtension = '.' + item.name.split('.').pop()?.toLowerCase()
          const isPackageJson = item.name === 'package.json'
          const isTsConfig = item.name.includes('tsconfig')
          
          if (allowedExtensions.includes(fileExtension) || isPackageJson || isTsConfig) {
            const content = await this.downloadFile(item.download_url)
            if (content && content.length < 1024 * 1024) { // 1MB max per file
              files.push({
                name: item.name,
                path: item.path,
                content
              })
            }
          }
        } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await processDirectory(item.path, depth + 1)
        }
      }
    }

    await processDirectory()
    return files
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string, // SHA is needed for updating an existing file
    branch?: string
  ): Promise<{ path: string; sha: string } | null> {
    try {
      const body: {
        message: string
        content: string
        sha?: string
        branch?: string
      } = {
        message,
        content: Buffer.from(content).toString('base64'), // Content must be base64 encoded
      }

      if (sha) {
        body.sha = sha
      }
      if (branch) {
        body.branch = branch
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('GitHub API error (createOrUpdateFile):', response.status, errorData)
        throw new Error(
          `GitHub API error: ${response.status} - ${errorData.message || 'Failed to create/update file'}`
        )
      }

      const result = await response.json()
      return {
        path: result.content.path,
        sha: result.content.sha,
      }
    } catch (error) {
      console.error('Failed to create or update GitHub file:', error)
      return null
    }
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string, // SHA is required for deleting a file
    branch?: string
  ): Promise<boolean> {
    try {
      const body: {
        message: string
        sha: string
        branch?: string
      } = {
        message,
        sha,
      }
      if (branch) {
        body.branch = branch
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('GitHub API error (deleteFile):', response.status, errorData)
        throw new Error(
          `GitHub API error: ${response.status} - ${errorData.message || 'Failed to delete file'}`
        )
      }
      // Successful deletion returns 200 OK with commit details or 204 No Content if the file didn't exist.
      // For simplicity, we'll consider it a success if response.ok is true.
      return true
    } catch (error) {
      console.error('Failed to delete GitHub file:', error)
      return false
    }
  }
}
