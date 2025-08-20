import React from 'react';
import CodeBlock from './CodeBlock';

interface FileContentProps {
  content: string | null;
}

const FileContent: React.FC<FileContentProps> = ({ content }) => {
  if (content === null) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select a file to view its content.</p>
      </div>
    );
  }

  return <CodeBlock content={content} />;
};

export default FileContent;
