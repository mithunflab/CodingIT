import 'dotenv/config';
import { Sandbox, SandboxOpts } from '@e2b/code-interpreter';

async function main() {
  let sbx: Sandbox | undefined = undefined;

  try {
    const sandboxOptions: SandboxOpts = { timeoutMs: 300000 };
    sbx = await Sandbox.create(sandboxOptions);
    console.log('Sandbox created successfully.');

    const codeToRun = 'print("hello world")';
    console.log(`Executing code: ${codeToRun}`);
    const execution = await sbx.runCode(codeToRun); // Execute Python inside the sandbox

    console.log('Execution logs:');
    execution.logs.stdout.forEach(log => console.log(`[STDOUT] ${log}`));
    execution.logs.stderr.forEach(log => console.error(`[STDERR] ${log}`));

    if (execution.error) {
      console.error('Execution error:', execution.error);
    } else {
      console.log('Execution results:', execution.results);
    }

    console.log('Listing files in /:');
    const files = await sbx.files.list('/');
    console.log(files);

  } catch (error) {
    console.error('An error occurred:', error);
    // Depending on the application, you might want to exit or handle the error differently
    // process.exit(1); 
  } finally {
    if (sbx) {
      console.log('Closing preview...');
      try {
        await (sbx as any).close();
        console.log('Sandbox closed successfully.');
      } catch (closeError) { // Updated variable name
        console.error('Error closing sandbox:', closeError); // Updated log message
      }
    }
  }
}

main()
  .then(() => console.log('Script finished.'))
  .catch(error => console.error('Unhandled error in main:', error));
