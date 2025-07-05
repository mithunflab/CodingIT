'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Database, ExternalLink } from 'lucide-react'
import { checkSupabaseConnection, checkEnhancedTablesExist } from '@/lib/user-settings'

interface TableStatus {
  user_profiles: boolean
  user_preferences: boolean
  user_integrations: boolean
  user_security_settings: boolean
}

export default function DatabaseDiagnostic() {
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [supabaseConnected, setSupabaseConnected] = useState(false)

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    try {
      // Check Supabase connection
      const connected = await checkSupabaseConnection()
      setSupabaseConnected(connected)
      
      if (connected) {
        // Check table existence
        const status = await checkEnhancedTablesExist()
        setTableStatus(status as unknown as TableStatus)
      } else {
        setTableStatus(null)
      }
    } catch (error) {
      console.error('Error checking database status:', error)
      setSupabaseConnected(false)
      setTableStatus(null)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const allTablesExist = tableStatus && Object.values(tableStatus).every(exists => exists)
  const someTablesExist = tableStatus && Object.values(tableStatus).some(exists => exists)

  const renderTableRow = (tableName: string, exists: boolean) => (
    <div key={tableName} className="flex items-center justify-between py-2">
      <code className="text-sm bg-muted px-2 py-1 rounded">{tableName}</code>
      <div className="flex items-center gap-2">
        {exists ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">Exists</Badge>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <Badge variant="destructive">Missing</Badge>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup Diagnostic
        </CardTitle>
        <CardDescription>
          Check if your Supabase database has the required tables for user settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supabase Connection Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Supabase Connection</h3>
          <div className="flex items-center gap-2">
            {supabaseConnected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Not connected or configuration error</span>
              </>
            )}
          </div>
        </div>

        {/* Table Status */}
        {tableStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Required Tables</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkDatabaseStatus}
                disabled={isChecking}
              >
                {isChecking ? 'Checking...' : 'Refresh'}
              </Button>
            </div>
            
            <div className="space-y-1 border rounded-lg p-3">
              {Object.entries(tableStatus).map(([table, exists]) => 
                renderTableRow(table, exists)
              )}
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {!supabaseConnected && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Supabase is not properly configured. Check your environment variables:
              <ul className="mt-2 space-y-1">
                <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {supabaseConnected && tableStatus && !allTablesExist && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {!someTablesExist 
                ? "Required database tables are missing. You need to run the database migration."
                : "Some database tables are missing. You may need to update your database migration."
              }
            </AlertDescription>
          </Alert>
        )}

        {allTablesExist && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All required database tables exist! Your user settings should work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Instructions */}
        {supabaseConnected && !allTablesExist && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Setup Instructions</h3>
            <div className="prose prose-sm max-w-none">
              <ol className="space-y-2">
                <li>
                  Open your Supabase dashboard
                  <Button variant="link" className="p-0 h-auto ml-2" asChild>
                    <a href="https://app.supabase.com/projects" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </li>
                <li>Go to SQL Editor in your project</li>
                <li>Create a new query and paste the complete database migration SQL</li>
                <li>Run the migration to create all required tables</li>
                <li>Return here and click &quot;Refresh&quot; to verify the setup</li>
              </ol>
            </div>
          </div>
        )}

        {/* Migration SQL Link */}
        {!allTablesExist && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Need the migration SQL? The complete database schema was provided in the previous response.
              Copy and run it in your Supabase SQL Editor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
