"use client"

import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

interface FileTreeProps {
  files: FileTreeNode[];
  onFileSelect: (path: string) => void;
}

const FileNode: React.FC<{ node: FileTreeNode; path: string; onFileSelect: (path: string) => void }> = ({ node, path, onFileSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = `${path}/${node.name}`;

  const handleToggle = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(currentPath);
    }
  };

  return (
    <div>
      <div
        className="flex items-center p-1 cursor-pointer hover:bg-cursor-accent rounded"
        onClick={handleToggle}
      >
        {node.type === 'folder' ? (
          <>
            {isOpen ? (
              <ChevronDown size={16} className="shrink-0" />
            ) : (
              <ChevronRight size={16} className="shrink-0" />
            )}
            <Folder size={16} className="ml-2 shrink-0" />
          </>
        ) : (
          <File size={16} className="ml-6 shrink-0" />
        )}
        <span className="ml-2">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="ml-4">
          {node.children.map((child, index) => (
            <FileNode key={index} node={child} path={currentPath} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect }) => {
  return (
    <div className="p-2 text-cursor-foreground bg-cursor h-full">
      {files.map((node, index) => (
        <FileNode key={index} node={node} path="" onFileSelect={onFileSelect} />
      ))}
    </div>
  );
};
