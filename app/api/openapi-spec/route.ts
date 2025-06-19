import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'openapi.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const spec = yaml.load(fileContents);
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error);
    return NextResponse.json({ message: 'Error loading OpenAPI spec' }, { status: 500 });
  }
}
