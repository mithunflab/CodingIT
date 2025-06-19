"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  ExternalLink,
  ChevronDown,
  Settings2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
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
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (files: File[], analysis: ProjectAnalysis, repositoryInfo: { owner: string; repo: string }) => void
  isLoading?: boolean
}

export function GitHubImportModal({ open, onOpenChange, onImport, isLoading = false }: GitHubImportModalProps) {
  const { toast } = useToast()
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionChecked, setConnectionChecked] = useState(false)

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advMaxFiles, setAdvMaxFiles] = useState<string>("50")
  const [advAllowedExtensions, setAdvAllowedExtensions] = useState<string>(".js,.ts,.jsx,.tsx,.py,.md,.json,.html,.css") 
  const [advMaxDepth, setAdvMaxDepth] = useState<string>("5")
  const [advIncludeDotFolders, setAdvIncludeDotFolders] = useState<boolean>(false)
  const [advMaxFileSizeMB, setAdvMaxFileSizeMB] = useState<string>("1")

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
    
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
    sessionStorage.setItem('github_oauth_state', state)
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`
    
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
              setConnectionChecked(false) 
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
      
      const parsedMaxFiles = parseInt(advMaxFiles, 10)
      const parsedMaxDepth = parseInt(advMaxDepth, 10)
      const parsedMaxFileSizeMB = parseInt(advMaxFileSizeMB, 10)

      const importPayload: any = {
        owner,
        repo,
      }

      if (!isNaN(parsedMaxFiles) && parsedMaxFiles > 0) importPayload.maxFiles = parsedMaxFiles
      if (!isNaN(parsedMaxDepth) && parsedMaxDepth > 0) importPayload.maxDepth = parsedMaxDepth
      if (!isNaN(parsedMaxFileSizeMB) && parsedMaxFileSizeMB > 0) importPayload.maxFileSizeMB = parsedMaxFileSizeMB
      
      const extensions = advAllowedExtensions.split(',').map(ext => ext.trim()).filter(ext => ext.length > 0 && ext.startsWith('.'))
      if (extensions.length > 0) importPayload.allowedExtensions = extensions
      
      importPayload.includeDotFolders = advIncludeDotFolders

      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import repository')
      }
      
      const files = await Promise.all(
        data.analysis.structure.files.map(async (file: any) => {
          const blob = new Blob([file.content || ''], { type: 'text/plain' })
          return new File([blob], file.name, { type: 'text/plain' })
        })
      )
      
      onImport(files, data.analysis, { owner, repo })
      onOpenChange(false)
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
        description: error instanceof Error ? error.message : "Failed to import repository",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }, [selectedRepo, advMaxFiles, advMaxDepth, advMaxFileSizeMB, advAllowedExtensions, advIncludeDotFolders, onImport, onOpenChange, toast])

  useEffect(() => {
    if (open && !connectionChecked) {
      checkConnection()
    }
  }, [open, connectionChecked, checkConnection])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Import GitHub Repository
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="text-center py-8">
              <Github className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Connect GitHub Account</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your GitHub account to import repositories as projects.
              </p>
              <Button onClick={connectGitHub} className="gap-2">
                <Github className="w-4 h-4" />
                Connect GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
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
                          "p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedRepo?.id === repo.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedRepo(repo)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{repo.name}</h4>
                              {repo.private && <Lock className="w-3 h-3 text-muted-foreground" />}
                              {repo.fork && <GitFork className="w-3 h-3 text-muted-foreground" />}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {repo.language && (
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(repo.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No repositories found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Advanced Settings
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-files" className="text-xs">Max Files</Label>
                      <Input
                        id="max-files"
                        value={advMaxFiles}
                        onChange={(e) => setAdvMaxFiles(e.target.value)}
                        placeholder="50"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-depth" className="text-xs">Max Depth</Label>
                      <Input
                        id="max-depth"
                        value={advMaxDepth}
                        onChange={(e) => setAdvMaxDepth(e.target.value)}
                        placeholder="5"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowed-extensions" className="text-xs">Allowed Extensions</Label>
                    <Input
                      id="allowed-extensions"
                      value={advAllowedExtensions}
                      onChange={(e) => setAdvAllowedExtensions(e.target.value)}
                      placeholder=".js,.ts,.jsx,.tsx,.py,.md"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-dot-folders"
                      checked={advIncludeDotFolders}
                      onCheckedChange={(checked) => setAdvIncludeDotFolders(checked as boolean)}
                    />
                    <Label htmlFor="include-dot-folders" className="text-xs">Include dot folders (.git, .vscode, etc.)</Label>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={!selectedRepo || isImporting || isLoading}
                  className="gap-2"
                >
                  {(isImporting || isLoading) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      Import as Project
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}