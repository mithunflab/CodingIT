import { useState, useEffect, useCallback } from 'react';

type FileSystemNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileSystemNode[];
};

export function useFileTree() {
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFileTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/file-system');
      if (!response.ok) {
        throw new Error('Failed to fetch file tree');
      }
      const data = await response.json();
      setFileTree(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  const createNode = useCallback(
    async (path: string, type: 'file' | 'folder') => {
      try {
        const response = await fetch('/api/file-system', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path, type }),
        });
        if (!response.ok) {
          throw new Error('Failed to create node');
        }
        await fetchFileTree();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchFileTree],
  );

  const renameNode = useCallback(
    async (oldPath: string, newPath: string) => {
      try {
        const response = await fetch('/api/file-system', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldPath, newPath }),
        });
        if (!response.ok) {
          throw new Error('Failed to rename node');
        }
        await fetchFileTree();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchFileTree],
  );

  const deleteNode = useCallback(
    async (path: string) => {
      try {
        const response = await fetch('/api/file-system', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete node');
        }
        await fetchFileTree();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchFileTree],
  );

  const generateFile = useCallback(
    async (path: string, prompt: string) => {
      try {
        const response = await fetch('/api/ai/generate-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path, prompt }),
        });
        if (!response.ok) {
          throw new Error('Failed to generate file');
        }
        await fetchFileTree();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [fetchFileTree],
  );

  return {
    fileTree,
    isLoading,
    error,
    refetch: fetchFileTree,
    createNode,
    renameNode,
    deleteNode,
    generateFile,
  };
}
