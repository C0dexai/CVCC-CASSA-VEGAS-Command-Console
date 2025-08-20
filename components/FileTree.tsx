import React, { useState } from 'react';
import { FileSystemNode, VectorIndexStatus } from '../types';
import FolderIcon from './icons/FolderIcon';
import FileIcon from './icons/FileIcon';

interface FileTreeProps {
  nodes: FileSystemNode[];
  onSelectNode: (node: FileSystemNode) => void;
  selectedNode: FileSystemNode | null;
  indexStatus: Map<string, VectorIndexStatus>;
  level?: number;
}

const StatusIndicator: React.FC<{ status?: VectorIndexStatus }> = ({ status }) => {
    const tooltipText = {
        'INDEXED': 'This file is indexed and searchable.',
        'INDEXING': 'This file is currently being indexed.',
        'ERROR': 'An error occurred during indexing.',
        'NOT_INDEXED': 'This file is not indexed.'
    }[status || 'NOT_INDEXED'];

    const baseClass = "w-2.5 h-2.5 rounded-full flex-shrink-0";
    switch (status) {
        case 'INDEXED':
            return <div className={`${baseClass} bg-neon-lime shadow-neon-lime`} title={tooltipText}></div>;
        case 'INDEXING':
            return <div className={`${baseClass} bg-yellow-400 animate-pulse`} title={tooltipText}></div>;
        case 'ERROR':
            return <div className={`${baseClass} bg-red-500`} title={tooltipText}></div>;
        default:
            return <div className={`${baseClass} bg-gray-600`} title={tooltipText}></div>;
    }
};

const FileTreeNode: React.FC<{ node: FileSystemNode; onSelectNode: (node: FileSystemNode) => void; selectedNode: FileSystemNode | null; level: number; indexStatus: Map<string, VectorIndexStatus>; }> = ({ node, onSelectNode, selectedNode, level, indexStatus }) => {
  const [isOpen, setIsOpen] = useState(level < 2);

  const handleNodeClick = () => {
    onSelectNode(node);
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    }
  };

  const isSelected = selectedNode?.path === node.path;
  const indentStyle = { paddingLeft: `${level * 1.25}rem` };

  if (node.type === 'directory') {
    return (
      <div>
        <div
          onClick={handleNodeClick}
          style={indentStyle}
          className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-neon-cyan/20' : 'hover:bg-gray-700/50'}`}
        >
          <FolderIcon isOpen={isOpen} />
          <span className="font-medium text-gray-300">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <FileTree
            nodes={node.children}
            onSelectNode={onSelectNode}
            selectedNode={selectedNode}
            indexStatus={indexStatus}
            level={level + 1}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectNode(node)}
      style={indentStyle}
      className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-neon-cyan/20 text-white' : 'hover:bg-gray-700/50 text-gray-400'}`}
    >
      <FileIcon />
      <span className="truncate flex-1">{node.name}</span>
      <StatusIndicator status={indexStatus.get(node.path)} />
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ nodes, onSelectNode, selectedNode, indexStatus, level = 0 }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <FileTreeNode
          key={node.path}
          node={node}
          onSelectNode={onSelectNode}
          selectedNode={selectedNode}
          level={level}
          indexStatus={indexStatus}
        />
      ))}
    </div>
  );
};

export default FileTree;