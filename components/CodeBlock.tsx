
import React from 'react';

interface CodeBlockProps {
  content: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content }) => {
  return (
    <pre className="bg-black/50 border border-neon-cyan/20 rounded-md p-4 mt-4 overflow-x-auto">
      <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
        {content}
      </code>
    </pre>
  );
};

export default CodeBlock;