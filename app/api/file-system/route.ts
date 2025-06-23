import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type FileSystemNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileSystemNode[];
};

const projectRoot = process.cwd();

function getFileTree(dir: string): FileSystemNode[] {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const tree: FileSystemNode[] = [];

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);
    const id = path.relative(projectRoot, fullPath);

    if (dirent.isDirectory()) {
      tree.push({
        id,
        name: dirent.name,
        type: 'folder',
        path: id,
        children: getFileTree(fullPath),
      });
    } else {
      tree.push({
        id,
        name: dirent.name,
        type: 'file',
        path: id,
      });
    }
  }
  return tree;
}

export async function GET(request: NextRequest) {
  try {
    const fileTree = getFileTree(projectRoot);
    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('Failed to read file tree:', error);
    return NextResponse.json(
      { error: 'Failed to read file tree' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path: newPath, type } = await request.json();
    const fullPath = path.join(projectRoot, newPath);

    if (type === 'folder') {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      fs.writeFileSync(fullPath, '');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create file/folder:', error);
    return NextResponse.json(
      { error: 'Failed to create file/folder' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { oldPath, newPath } = await request.json();
    const fullOldPath = path.join(projectRoot, oldPath);
    const fullNewPath = path.join(projectRoot, newPath);

    fs.renameSync(fullOldPath, fullNewPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to rename file/folder:', error);
    return NextResponse.json(
      { error: 'Failed to rename file/folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path: deletePath } = await request.json();
    const fullPath = path.join(projectRoot, deletePath);

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmdirSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file/folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete file/folder' },
      { status: 500 }
    );
  }
}
