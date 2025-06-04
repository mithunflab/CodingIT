"use client"

import { useState, useEffect, useCallback } from "react"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { 
  Github,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Unlink,
  RefreshCw,
  Info
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  public_repos: number
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)
  const [isGithubConnected, setIsGithubConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const checkGitHubConnection = useCallback(async () => {
    setIsCheckingConnection(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.user_metadata?.github_connected) {
        setIsGithubConnected(true)
        
        // Try to fetch GitHub user info
        const response = await fetch('/api/github/repositories')
        if (response.ok) {
          const data = await response.json()
          setGithubUser(data.user)
        }
      }
    } catch (error) {
      console.error('Failed to check GitHub connection:', error)
    } finally {
      setIsCheckingConnection(false)
    }
  }, [supabase])

  useEffect(() => {
    checkGitHubConnection()
  }, [checkGitHubConnection])

  const connectGitHub = () => {
    setIsLoading(true)
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/github/callback`
    const scope = 'repo user'

    // Generate and store state parameter
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('github_oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
    const authWindow = window.open(authUrl, 'github-auth', 'width=600,height=700')
    
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const storedState = sessionStorage.getItem('github_oauth_state');
      sessionStorage.removeItem('github_oauth_state'); // Clean up state immediately

      if (event.data.type === 'GITHUB_AUTH_CALLBACK') {
        if (!event.data.state || event.data.state !== storedState) {
          toast({
            title: "Authentication Failed",
            description: "Invalid state parameter. Please try connecting again.",
            variant: "destructive"
          });
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
          authWindow?.close();
          return;
        }

        if (event.data.code) {
          try {
            const response = await fetch('/api/github/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code })
            });

            if (response.ok) {
              setIsGithubConnected(true);
              toast({
                title: "GitHub Connected",
                description: "Your GitHub account has been successfully connected.",
              });
              checkGitHubConnection();
            } else {
              const errorResult = await response.json().catch(() => ({ error: "Failed to exchange code for token."}));
              toast({
                title: "Connection Failed",
                description: errorResult.error || "Failed to obtain GitHub token. Please try again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            toast({
              title: "Connection Error",
              description: "An error occurred while trying to connect to GitHub. Please try again.",
              variant: "destructive"
            });
          }
        } else { // Should have been caught by GITHUB_AUTH_ERROR from popup, but as a fallback
           toast({
            title: "Connection Failed",
            description: "No authorization code received. Please try again.",
            variant: "destructive"
          });
        }
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: `${event.data.errorDescription || event.data.error || "Failed to connect GitHub account."} Please try again.`,
          variant: "destructive"
        })
      }
      
      setIsLoading(false);
      window.removeEventListener('message', handleMessage);
      authWindow?.close();
    }
    
    window.addEventListener('message', handleMessage)
    
    // Handle window close
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed)
        setIsLoading(false)
        window.removeEventListener('message', handleMessage)
      }
    }, 1000)
  }

  const disconnectGitHub = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          github_access_token: null,
          github_connected: false,
          github_connected_at: null
        }
      })

      if (error) throw error

      setIsGithubConnected(false)
      setGithubUser(null)
      
      toast({
        title: "GitHub Disconnected",
        description: "Your GitHub account has been disconnected.",
      })
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect GitHub account. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Capabilities */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-medium mb-2">Capabilities</h2>
          <p className="text-sm text-muted-foreground mb-6">Control which capabilities CodinIT uses in your conversations.</p>

          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <h3 className="font-medium">Artifacts</h3>
              <p className="text-sm text-muted-foreground">
                Ask CodinIT to generate content like code snippets, text documents, or website designs, and CodinIT will
                create an Artifact that appears in a dedicated window alongside your conversation.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-medium mb-2">Integrations</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Allow CodinIT to reference other apps and services for more context.
          </p>

          <div className="space-y-4">
            {/* GitHub Integration */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-8 w-8" />
                    <div>
                      <CardTitle className="text-lg">GitHub</CardTitle>
                      <CardDescription>
                        Import repositories and collaborate on your code
                      </CardDescription>
                    </div>
                  </div>
                  
                  {isCheckingConnection ? (
                    <Badge variant="secondary">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Checking...
                    </Badge>
                  ) : isGithubConnected ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isGithubConnected && githubUser ? (
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
                  </div>
                ) : isGithubConnected ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      GitHub is connected but user information is not available.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>What you can do with GitHub integration:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Import repositories directly into CodinIT</li>
                      <li>AI-powered code analysis and enhancement</li>
                      <li>Automated code reviews and suggestions</li>
                      <li>Generate new features based on existing codebase</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  {isGithubConnected ? (
                    <>
                      <Button variant="outline" onClick={checkGitHubConnection} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh Connection
                      </Button>
                      <Button variant="destructive" onClick={disconnectGitHub} className="gap-2">
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button onClick={connectGitHub} disabled={isLoading} className="gap-2">
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                      Connect GitHub
                    </Button>
                  )}
                  
                  <Button variant="outline" className="gap-2" asChild>
                    <a href="https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Learn More
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for other integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Google Drive", status: "Coming Soon", icon: "📁" },
                { name: "Gmail", status: "Coming Soon", icon: "📧" },
                { name: "Google Calendar", status: "Coming Soon", icon: "📅" },
                { name: "Slack", status: "Coming Soon", icon: "💬" },
              ].map((service) => (
                <Card key={service.name} className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{service.icon}</span>
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.status}</p>
                        </div>
                      </div>
                      <Button variant="outline" disabled size="sm">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
