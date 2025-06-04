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
}