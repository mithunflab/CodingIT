import 'dotenv/config';
import { Sandbox, SandboxOpts } from '@e2b/code-interpreter';
import { Langfuse } from "langfuse";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: "https://us.cloud.langfuse.com"
});

async function main() {
  let sbx: Sandbox | undefined = undefined;
  const trace = langfuse.trace({ name: "sandbox-execution" });

  try {
    const sandboxOptions: SandboxOpts = { timeoutMs: 300000 };
    const createSpan = trace.span({ name: "create-sandbox" });
    sbx = await Sandbox.create(sandboxOptions);
    createSpan.end();
    console.log('Sandbox created successfully.');

    const codeToRun = 'print("hello world")';
    console.log(`Executing code: ${codeToRun}`);
    const runCodeSpan = trace.span({ name: "run-code" });
    const execution = await sbx.runCode(codeToRun);
    runCodeSpan.end({
      output: execution.results,
      input: codeToRun,
    });

    console.log('Execution logs:');
    execution.logs.stdout.forEach(log => console.log(`[STDOUT] ${log}`));
    execution.logs.stderr.forEach(log => console.error(`[STDERR] ${log}`));

    if (execution.error) {
      console.error('Execution error:', execution.error);
      trace.update({
        metadata: {
          error: execution.error,
          statusMessage: "Error during code execution",
        },
      });
    } else {
      console.log('Execution results:', execution.results);
    }

    console.log('Listing files in /:');
    const listFilesSpan = trace.span({ name: "list-files" });
    const files = await sbx.files.list('/');
    listFilesSpan.end({ output: files });
    console.log(files);

  } catch (error) {
    console.error('An error occurred:', error);
    trace.update({
      metadata: {
        error: error,
        statusMessage: "An unexpected error occurred",
      },
    });
  } finally {
    if (sbx) {
      console.log('Closing preview...');
      try {
        await (sbx as any).close();
        console.log('Sandbox closed successfully.');
      } catch (closeError) {
        console.error('Error closing sandbox:', closeError);
      }
    }
    Sandbox.toString();
  }
}

main()
  .then(() => console.log('Script finished.'))
  .catch(error => console.error('Unhandled error in main:', error));
