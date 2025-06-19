import { NextResponse } from 'next/server';
import type { paths } from '@/lib/openapi.types'; // Assuming openapi.types.ts is in lib

// This type would correspond to the response for GET /hello
type HelloWorldResponse = paths['/hello']['get']['responses']['200']['content']['application/json'];

export async function GET() {
  const response: HelloWorldResponse = {
    message: 'Hello, world!',
  };
  return NextResponse.json(response);
}
