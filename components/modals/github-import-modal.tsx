"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Github, 
  Search, 
  Star,
  GitFork,
  Clock,
  Code,
  Lock,
  Globe,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

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

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  public_repos: number
}

interface GitHubImportModalProps {
  onImport: (files: any[], analysis: any, repositoryInfo: { owner: string; repo: string }) => void
  isLoading?: boolean
}

export function GitHubImportModal({ onImport, isLoading = false }: GitHubImportModalProps) {
  const [open, setOpen] = useState(false)
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const loadRepositories = useCallback(async () => {
    setIsLoadingRepos(true)
    setError(null)
    
    try {
      const response = await fetch('/api/github/repositories')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repositories')
      }
      
      setRepositories(data.repositories)
      setGithubUser(data.user)
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to load repositories:', error)
      setError(error instanceof Error ? error.message : 'Failed to load repositories')
      setIsConnected(false)
    } finally {
      setIsLoadingRepos(false)
    }
  }, [])

  const connectGitHub = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/github/callback`
    const scope = 'repo user'
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    window.open(authUrl, 'github-auth', 'width=600,height=700')
    
    // Listen for auth completion
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        setIsConnected(true)
        loadRepositories()
        window.removeEventListener('message', handleMessage)
      }
    }
    
    window.addEventListener('message', handleMessage)
  }, [loadRepositories])

  const handleImport = useCallback(async () => {
    if (!selectedRepo) return
    
    setIsImporting(true)
    setError(null)
    
    try {
      const [owner, repo] = selectedRepo.full_name.split('/')
      
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          maxFiles: 50
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import repository')
      }
      
      // Convert the files back to File objects for the onImport callback
      const files = data.files.map((file: any) => {
        const content = data.analysis.structure.files.find((f: any) => f.path === file.path)?.content || ''
        const blob = new Blob([content], { type: 'text/plain' })
        return new File([blob], file.name, { type: 'text/plain' })
      })
      
      onImport(files, data.analysis, { owner, repo })
      setOpen(false)
      setSelectedRepo(null)
      
    } catch (error) {
      console.error('Failed to import repository:', error)
      setError(error instanceof Error ? error.message : 'Failed to import repository')
    } finally {
      setIsImporting(false)
    }
  }, [selectedRepo, onImport])

  useEffect(() => {
    if (open && !isConnected && !isLoadingRepos) {
      loadRepositories()
    }
  }, [open, isConnected, isLoadingRepos, loadRepositories])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-red-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-500',
      'PHP': 'bg-purple-500',
      'Ruby': 'bg-red-600',
      'C++': 'bg-blue-600',
      'C#': 'bg-green-600',
      'Swift': 'bg-orange-600',
      'Kotlin': 'bg-purple-600',
    }
    return colors[language || ''] || 'bg-gray-500'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
          disabled={isLoading}
        >
          <Github className="w-4 h-4" />
          <span className="text-xs">Import from GitHub</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Import from GitHub
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="text-center py-8">
            <Github className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your GitHub Account</h3>
            <p className="text-muted-foreground mb-6">
              Connect your GitHub account to import repositories directly into CodinIT
            </p>
            <Button onClick={connectGitHub} className="gap-2">
              <Github className="w-4 h-4" />
              Connect GitHub
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            {githubUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
                  <AvatarFallback>{githubUser.login.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{githubUser.name || githubUser.login}</div>
                  <div className="text-sm text-muted-foreground">
                    @{githubUser.login} • {githubUser.public_repos} repositories
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="repo-search">Search Repositories</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repo-search"
                  placeholder="Search your repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Repository List */}
            <div className="space-y-2">
              <Label>Select Repository</Label>
              {isLoadingRepos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading repositories...</span>
                </div>
              ) : (
                <ScrollArea className="h-80 border rounded-md">
                  <div className="p-2 space-y-2">
                    {filteredRepositories.map((repo) => (
                      <div
                        key={repo.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent",
                          selectedRepo?.id === repo.id && "border-primary bg-accent"
                        )}
                        onClick={() => setSelectedRepo(repo)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium truncate">{repo.name}</div>
                              {repo.private && <Lock className="w-3 h-3 text-muted-foreground" />}
                              {repo.fork && <GitFork className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {repo.language && (
                                <div className="flex items-center gap-1">
                                  <div className={cn("w-2 h-2 rounded-full", getLanguageColor(repo.language))} />
                                  {repo.language}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stargazers_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(repo.updated_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Code className="w-3 h-3" />
                                {Math.round(repo.size / 1024)}MB
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredRepositories.length === 0 && !isLoadingRepos && (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected Repository Info */}
            {selectedRepo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Github className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Selected: {selectedRepo.full_name}
                  </span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  CodinIT will import up to 50 files from this repository for AI-powered development assistance.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!selectedRepo || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import Repository
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}