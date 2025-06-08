"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Github, 
  Search, 
  Star,
  GitFork,
  Clock,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

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

interface ProjectAnalysis {
  structure: {
    files: Array<{
      name: string
      path: string
      language: string
      size: number
      type: string
    }>
    dependencies: Set<string>
    frameworks: Set<string>
    patterns: Set<string>
    components: Set<string>
    types: Set<string>
    utilities: Set<string>
    architecture: {
      type: string
      description: string
    }
  }
  analysis: string
  recommendations: string[]
}

interface GitHubImportModalProps {
  onImport: (files: File[], analysis: ProjectAnalysis, repositoryInfo: { owner: string; repo: string }) => void
  isLoading?: boolean
}

export function GitHubImportModal({ onImport, isLoading = false }: GitHubImportModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionChecked, setConnectionChecked] = useState(false)

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const checkConnection = useCallback(async () => {
    if (connectionChecked) return
    
    try {
      const response = await fetch('/api/github/repositories')
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories)
        setGithubUser(data.user)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      setIsConnected(false)
    } finally {
      setConnectionChecked(true)
    }
  }, [connectionChecked])

  const connectGitHub = useCallback(() => {
    // Check if GitHub Client ID is configured
    if (!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) {
      toast({
        title: "Configuration Error",
        description: "GitHub integration is not properly configured. Please contact support.",
        variant: "destructive"
      })
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/github/callback`
    const scope = 'repo user:email'
    
    // Generate and store state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('github_oauth_state', state)
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`
    
    console.log('Opening GitHub OAuth with URL:', authUrl)
    
    const authWindow = window.open(authUrl, 'github-auth', 'width=600,height=700,scrollbars=yes,resizable=yes')
    
    if (!authWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive"
      })
      return
    }
    
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const storedState = sessionStorage.getItem('github_oauth_state')
      sessionStorage.removeItem('github_oauth_state')

      if (event.data.type === 'GITHUB_AUTH_CALLBACK') {
        if (!event.data.state || event.data.state !== storedState) {
          toast({
            title: "Authentication Failed",
            description: "Invalid state parameter. Please try connecting again.",
            variant: "destructive"
          })
          window.removeEventListener('message', handleMessage)
          authWindow?.close()
          return
        }

        if (event.data.code) {
          try {
            const response = await fetch('/api/github/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code })
            })

            if (response.ok) {
              setIsConnected(true)
              setConnectionChecked(false) // Force recheck
              toast({
                title: "GitHub Connected",
                description: "Successfully connected to GitHub!",
              })
              checkConnection()
            } else {
              const errorResult = await response.json().catch(() => ({ error: "Failed to connect." }))
              toast({
                title: "Connection Failed",
                description: errorResult.error,
                variant: "destructive"
              })
            }
          } catch (error) {
            toast({
              title: "Connection Error",
              description: "Failed to connect to GitHub. Please try again.",
              variant: "destructive"
            })
          }
        }
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: event.data.errorDescription || "Failed to connect GitHub account.",
          variant: "destructive"
        })
      }
      
      window.removeEventListener('message', handleMessage)
      authWindow?.close()
    }
    
    window.addEventListener('message', handleMessage)
    
    // Handle window close
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
      }
    }, 1000)
  }, [toast, checkConnection])

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
      
      // Create File objects from the imported data
      const files = await Promise.all(
        data.analysis.structure.files.map(async (file: any) => {
          const blob = new Blob([file.content || ''], { type: 'text/plain' })
          return new File([blob], file.name, { type: 'text/plain' })
        })
      )
      
      onImport(files, data.analysis, { owner, repo })
      setOpen(false)
      setSelectedRepo(null)
      
      toast({
        title: "Repository Imported",
        description: `Successfully imported ${selectedRepo.name} with ${files.length} files.`,
      })
      
    } catch (error) {
      console.error('Failed to import repository:', error)
      setError(error instanceof Error ? error.message : 'Failed to import repository')
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Failed to import repository',
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }, [selectedRepo, onImport, toast])

  useEffect(() => {
    if (open && !connectionChecked) {
      checkConnection()
    }
  }, [open, connectionChecked, checkConnection])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
    }
    return colors[language || ''] || 'bg-gray-500'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isLoading}
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl h-10 w-10"
        >
          <Github className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
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

        {!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GitHub integration is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID environment variable.
            </AlertDescription>
          </Alert>
        )}

        {!isConnected && process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? (
          <div className="text-center py-8">
            <Github className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect GitHub Repository Access</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Connect GitHub to import and analyze your repositories.
              <br />
              <span className="text-xs text-muted-foreground">
                This is separate from your account login and grants repository access only.
              </span>
            </p>
            <Button onClick={connectGitHub} className="gap-2">
              <Github className="w-4 h-4" />
              Connect GitHub for Repository Access
            </Button>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            {/* User Info */}
            {githubUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
                  <AvatarFallback>{githubUser.login.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{githubUser.name || githubUser.login}</div>
                  <div className="text-xs text-muted-foreground">@{githubUser.login}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="repo-search" className="text-sm">Search repositories</Label>
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
            <ScrollArea className="h-60 border rounded-md">
              <div className="p-3 space-y-2">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">Loading repositories...</span>
                  </div>
                ) : filteredRepositories.length > 0 ? (
                  filteredRepositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent/50",
                        selectedRepo?.id === repo.id && "border-primary bg-accent"
                      )}
                      onClick={() => setSelectedRepo(selectedRepo?.id === repo.id ? null : repo)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm truncate">{repo.name}</div>
                            {repo.private && <Lock className="w-3 h-3 text-muted-foreground" />}
                            {repo.fork && <GitFork className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">
                      {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Selected Repository Info */}
            {selectedRepo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Github className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedRepo.full_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto"
                    asChild
                  >
                    <a 
                      href={`https://github.com/${selectedRepo.full_name}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
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
                    Import Repository
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}