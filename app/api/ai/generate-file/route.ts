import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

export async function POST(request: NextRequest) {
  try {
    const { path: newPath, prompt } = await request.json();
    const fullPath = path.join(projectRoot, newPath);

    // This is where you would call your AI model to generate the file content
    // For now, we'll just use the prompt as the content
    const content = `// content for ${newPath}\n\n${prompt}`;

    fs.writeFileSync(fullPath, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to generate file:', error);
    return NextResponse.json(
      { error: 'Failed to generate file' },
      { status: 500 }
    );
  }
}
