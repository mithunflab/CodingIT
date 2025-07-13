'use client'

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecutionResultInterpreter } from '@/lib/types'
import { Result as CellResultData } from '@e2b/code-interpreter'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { 
  Terminal, 
  PlayIcon, 
  LoaderIcon, 
  PlusIcon, 
  TrashIcon,
  DownloadIcon,
  FolderOpenIcon,
  PackageIcon
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useState, useRef, useCallback, useEffect } from 'react'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-muted animate-pulse rounded" />
})

interface CodeCell {
  id: string
  code: string
  results?: CellResultData[]
  stdout?: string[]
  stderr?: string[]
  isExecuting?: boolean
  error?: string
}

function CellResult({ result }: { result: CellResultData }) {
  // Order of checks is important
  if (result.png) {
    return (
      <div className="relative">
        <Image
          src={`data:image/png;base64,${result.png}`}
          alt="result"
          width={600}
          height={400}
          className="max-w-full h-auto rounded border"
        />
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2"
          onClick={() => {
            const link = document.createElement('a')
            link.href = `data:image/png;base64,${result.png}`
            link.download = 'result.png'
            link.click()
          }}
        >
          <DownloadIcon className="h-3 w-3" />
        </Button>
      </div>
    )
  }
  if (result.jpeg) {
    return (
      <div className="relative">
        <Image
          src={`data:image/jpeg;base64,${result.jpeg}`}
          alt="result"
          width={600}
          height={400}
          className="max-w-full h-auto rounded border"
        />
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2"
          onClick={() => {
            const link = document.createElement('a')
            link.href = `data:image/jpeg;base64,${result.jpeg}`
            link.download = 'result.jpg'
            link.click()
          }}
        >
          <DownloadIcon className="h-3 w-3" />
        </Button>
      </div>
    )
  }
  if (result.pdf) {
    return (
      <iframe
        src={`data:application/pdf;base64,${result.pdf}`}
        className="w-full h-96 border rounded"
        title="PDF result"
      />
    )
  }
  if (result.html) {
    return (
      <iframe
        srcDoc={result.html}
        className="w-full h-96 border rounded"
        sandbox="allow-scripts"
        title="HTML result"
      />
    )
  }
  if (result.latex) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">LaTeX Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono whitespace-pre-wrap">{result.latex}</pre>
        </CardContent>
      </Card>
    )
  }
  if (result.json) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">JSON Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(result.json, null, 2)}
          </pre>
        </CardContent>
      </Card>
    )
  }
  if (result.text) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Text Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono whitespace-pre-wrap">{result.text}</pre>
        </CardContent>
      </Card>
    )
  }
  return null
}

function LogsOutput({
  stdout,
  stderr,
}: {
  stdout: string[]
  stderr: string[]
}) {
  if (stdout.length === 0 && stderr.length === 0) return null

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Console Output
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {stdout &&
            stdout.length > 0 &&
            stdout.map((out: string, index: number) => (
              <pre key={`stdout-${index}`} className="text-xs text-green-600 dark:text-green-400">
                {out}
              </pre>
            ))}
          {stderr &&
            stderr.length > 0 &&
            stderr.map((err: string, index: number) => (
              <pre key={`stderr-${index}`} className="text-xs text-red-600 dark:text-red-400">
                {err}
              </pre>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CodeCellComponent({
  cell,
  onCodeChange,
  onExecute,
  onDelete,
  showDelete = true
}: {
  cell: CodeCell
  onCodeChange: (id: string, code: string) => void
  onExecute: (id: string) => void
  onDelete: (id: string) => void
  showDelete?: boolean
}) {
  const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    monacoRef.current = editor
    
    // Configure Python language support (if needed)
    // Add Python-specific settings here if supported by Monaco editor
  }, [])

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Code Cell</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onExecute(cell.id)}
              disabled={cell.isExecuting}
            >
              {cell.isExecuting ? (
                <LoaderIcon className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <PlayIcon className="h-3 w-3 mr-1" />
              )}
              Execute
            </Button>
            {showDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(cell.id)}
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded">
          <MonacoEditor
            height="120px"
            defaultLanguage="python"
            value={cell.code}
            onChange={(value) => onCodeChange(cell.id, value || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
            }}
            theme="vs-dark"
          />
        </div>
        
        {cell.error && (
          <Alert variant="destructive" className="mt-2">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Execution Error</AlertTitle>
            <AlertDescription className="font-mono whitespace-pre-wrap">
              {cell.error}
            </AlertDescription>
          </Alert>
        )}

        {cell.results && cell.results.length > 0 && (
          <div className="mt-4 space-y-2">
            {cell.results.map((result, index) => (
              <CellResult key={index} result={result} />
            ))}
          </div>
        )}

        <LogsOutput stdout={cell.stdout || []} stderr={cell.stderr || []} />
      </CardContent>
    </Card>
  )
}

export function EnhancedCodeInterpreter({
  result,
  code: initialCode,
  executeCode,
}: {
  result?: ExecutionResultInterpreter
  code: string
  executeCode: (code: string) => Promise<any>
}) {
  const [cells, setCells] = useState<CodeCell[]>([
    {
      id: '1',
      code: initialCode || '# Welcome to the Enhanced Code Interpreter\nprint("Hello, World!")',
    }
  ])

  useEffect(() => {
    if (result) {
      setCells(cells.map(cell => ({
        ...cell,
        results: result.cellResults,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error,
      })))
    }
  }, [result])

  const [activeTab, setActiveTab] = useState('notebook')

  const addCell = () => {
    const newCell: CodeCell = {
      id: Date.now().toString(),
      code: '# New cell\n',
    }
    setCells([...cells, newCell])
  }

  const deleteCell = (id: string) => {
    if (cells.length > 1) {
      setCells(cells.filter(cell => cell.id !== id))
    }
  }

  const updateCellCode = (id: string, code: string) => {
    setCells(cells.map(cell => 
      cell.id === id ? { ...cell, code } : cell
    ))
  }

  const executeCell = async (id: string) => {
    const cell = cells.find(c => c.id === id)
    if (!cell) return

    setCells(cells.map(c => 
      c.id === id ? { ...c, isExecuting: true, error: undefined, results: [], stdout: [], stderr: [] } : c
    ))

    try {
      const result = await executeCode(cell.code)
      
      setCells(cells.map(c => 
        c.id === id ? { 
          ...c, 
          isExecuting: false, 
          results: result.results,
          stdout: result.stdout,
          stderr: result.stderr,
          error: result.error,
        } : c
      ))
    } catch (error) {
      setCells(cells.map(c => 
        c.id === id ? { 
          ...c, 
          isExecuting: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        } : c
      ))
    }
  }

  const executeAllCells = async () => {
    for (const cell of cells) {
      await executeCell(cell.id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Enhanced Code Interpreter</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={executeAllCells}>
                <PlayIcon className="h-3 w-3 mr-1" />
                Run All
              </Button>
              <Button size="sm" variant="outline" onClick={addCell}>
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Cell
              </Button>
            </div>
          </div>
          <TabsList>
            <TabsTrigger value="notebook" className="text-xs">
              Notebook
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs">
              Variables
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs">
              <FolderOpenIcon className="h-3 w-3 mr-1" />
              Files
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs">
              <PackageIcon className="h-3 w-3 mr-1" />
              Packages
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="notebook" className="mt-0">
            <div className="space-y-4">
              {cells.map((cell, index) => (
                <CodeCellComponent
                  key={cell.id}
                  cell={cell}
                  onCodeChange={updateCellCode}
                  onExecute={executeCell}
                  onDelete={deleteCell}
                  showDelete={cells.length > 1}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="variables" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Variable Inspector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Variable inspection will be available after code execution.
                  <br />
                  <span className="text-xs">Note: This feature requires enhanced backend integration.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">File Browser</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  File system browser will show sandbox files here.
                  <br />
                  <span className="text-xs">Note: This feature requires enhanced backend integration.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Package Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Package installation and management will be available here.
                  <br />
                  <span className="text-xs">Note: This feature requires enhanced backend integration.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
