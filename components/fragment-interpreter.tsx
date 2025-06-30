import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ExecutionResultInterpreter } from '@/lib/types'
import { Result as CellResultData } from '@e2b/code-interpreter'
import { Terminal } from 'lucide-react'
import Image from 'next/image'

function CellResult({ result }: { result: CellResultData }) {
  // Order of checks is important
  if (result.png) {
    return (
      <Image
        src={`data:image/png;base64,${result.png}`}
        alt="result"
        width={600}
        height={400}
      />
    )
  }
  if (result.jpeg) {
    return (
      <Image
        src={`data:image/jpeg;base64,${result.jpeg}`}
        alt="result"
        width={600}
        height={400}
      />
    )
  }
  if (result.pdf) {
    return (
      <iframe
        src={`data:application/pdf;base64,${result.pdf}`}
        className="w-full h-96 border-none"
        title="PDF result"
      />
    )
  }
  if (result.html) {
    return (
      <iframe
        srcDoc={result.html}
        className="w-full h-96 border-none"
        sandbox="allow-scripts"
        title="HTML result"
      />
    )
  }
  if (result.latex) {
    return <pre className="text-xs font-mono">{result.latex}</pre>
  }
  if (result.json) {
    return (
      <pre className="text-xs font-mono">
        {JSON.stringify(result.json, null, 2)}
      </pre>
    )
  }
  if (result.text) {
    return <pre className="text-xs font-mono">{result.text}</pre>
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
    <div className="w-full h-32 max-h-32 overflow-y-auto flex flex-col items-start justify-start space-y-1 p-4">
      {stdout &&
        stdout.length > 0 &&
        stdout.map((out: string, index: number) => (
          <pre key={index} className="text-xs">
            {out}
          </pre>
        ))}
      {stderr &&
        stderr.length > 0 &&
        stderr.map((err: string, index: number) => (
          <pre key={index} className="text-xs text-red-500">
            {err}
          </pre>
        ))}
    </div>
  )
}

export function FragmentInterpreter({
  result,
}: {
  result: ExecutionResultInterpreter
}) {
  const { cellResults, stdout, stderr, runtimeError } = result

  // The AI-generated code experienced runtime error
  if (runtimeError) {
    const { name, value, traceback } = runtimeError
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>
            {name}: {value}
          </AlertTitle>
          <AlertDescription className="font-mono whitespace-pre-wrap">
            {traceback}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (cellResults.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="w-full flex-1 p-4 flex flex-col items-start justify-center border-b space-y-4">
          {cellResults.map((cellResult, index) => (
            <CellResult key={index} result={cellResult} />
          ))}
        </div>
        <LogsOutput stdout={stdout} stderr={stderr} />
      </div>
    )
  }

  // No cell results, but there is stdout or stderr
  if (stdout.length > 0 || stderr.length > 0) {
    return <LogsOutput stdout={stdout} stderr={stderr} />
  }

  return <span>No output or logs</span>
}
