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
    const execution = await sbx.runCode(codeToRun); 

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
  }
}

main()
  .then(() => console.log('Script finished.'))
  .catch(error => console.error('Unhandled error in main:', error));
