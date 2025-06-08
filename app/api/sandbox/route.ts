import { FragmentSchema as OriginalFragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

type CodeFile = { file_path: string; file_content: string };
type FragmentSchema = OriginalFragmentSchema & {
  code?: string | CodeFile[];
  file_path?: string;
};

const sandboxTimeout = 10 * 60 * 1000

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    teamID,
    accessToken,
  }: {
    fragment: FragmentSchema
    userID: string | undefined
    teamID: string | undefined
    accessToken: string | undefined
  } = await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)
  // console.log('apiKey', apiKey)

  const sbx = await Sandbox.create(fragment.template, {
        metadata: {
            template: fragment.template,
            userID: userID ?? '',
            teamID: teamID ?? '',
        },
        timeoutMs: sandboxTimeout,
        ...(teamID && accessToken
            ? {
                headers: {
                    'X-Supabase-Team': teamID,
                    'X-Supabase-Token': accessToken,
                },
            }
            : {}),
    })

  // Install dependencies if specified
  if (
    fragment.has_additional_dependencies &&
    typeof fragment.install_dependencies_command === 'string' &&
    fragment.install_dependencies_command.trim() !== ''
  ) {
    console.log(`Attempting to install dependencies with command: ${fragment.install_dependencies_command}`);
    const { stdout, stderr, exitCode } = await sbx.commands.run(fragment.install_dependencies_command);
    if (exitCode !== 0) {
      console.error('Error installing dependencies. Exit code:', exitCode);
      console.error('Installation stdout:', stdout);
      console.error('Installation stderr:', stderr);
      await sbx.kill();
      return new Response(JSON.stringify({ error: 'Failed to install dependencies', details: `Exit code: ${exitCode}`, stdout, stderr }), { status: 500 });
    }
    console.log('Dependencies installed successfully. stdout:', stdout, 'stderr:', stderr);
  }

  // Write files to the sandbox
  // Prioritize fragment.files as it matches the schema from AI generation
  if (fragment.files && Array.isArray(fragment.files) && fragment.files.length > 0) {
    for (const file of fragment.files) {
      if (file.file_path && typeof file.file_content === 'string') {
        await sbx.files.write(file.file_path, file.file_content);
        console.log(`Copied file from fragment.files to ${file.file_path} in ${sbx.sandboxId}`);
      } else {
        console.warn(`Skipping file from fragment.files due to missing path or content: ${JSON.stringify(file)}`);
      }
    }
  } else if (fragment.code && Array.isArray(fragment.code)) { // Fallback for fragment.code as array
    for (const file of fragment.code as CodeFile[]) {
      if (file.file_path && typeof file.file_content === 'string') {
        await sbx.files.write(file.file_path, file.file_content);
        console.log(`Copied file from fragment.code (array) to ${file.file_path} in ${sbx.sandboxId}`);
      } else {
        console.warn(`Skipping file from fragment.code (array) due to missing path or content: ${JSON.stringify(file)}`);
      }
    }
  } else if (typeof fragment.code === 'string' && fragment.file_path) {
    await sbx.files.write(fragment.file_path, fragment.code);
    console.log(`Copied file from fragment.code (string) to ${fragment.file_path} in ${sbx.sandboxId}`);
  } else {
    console.warn(`No files or code provided in the fragment to write to sandbox ${sbx.sandboxId}`);
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-v1') {
    let codeToRun = '';
    if (typeof fragment.code === 'string') {
        codeToRun = fragment.code;
    } else if (fragment.files && fragment.files.length > 0) {
        const pyFile = fragment.files.find(f => f.file_path && f.file_path.endsWith('.py'));
        if (pyFile && typeof pyFile.file_content === 'string') {
            codeToRun = pyFile.file_content;
        }
    }

    if (!codeToRun) {
        console.error('Code interpreter template, but no executable Python code found in fragment.code string or fragment.files.');
        await sbx.kill();
        return new Response(JSON.stringify({ error: 'No executable Python code found for code-interpreter-v1' }), { status: 400 });
    }

    const { logs, error, results } = await sbx.runCode(codeToRun);
    await sbx.kill(); // Close sandbox after execution for interpreter
    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        stdout: logs.stdout,
        stderr: logs.stderr,
        runtimeError: error,
        cellResults: results,
      } as ExecutionResultInterpreter),
    );
  } else {
    // For web templates (e.g., 'nextjs'), return the URL
    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        url: `https://${sbx?.getHost(fragment.port || 80)}`,
      } as ExecutionResultWeb),
    );
  }
}