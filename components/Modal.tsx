
import React from 'react';
import CodeBlock from './CodeBlock';

interface ModalProps {
  title: string;
  content: string;
  onClose: () => void;
  isCode?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, content, onClose, isCode = false }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-dark-bg/70 backdrop-blur-lg border border-neon-pink/50 rounded-lg shadow-2xl shadow-neon-pink/20 w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.7)]">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {isCode ? <CodeBlock content={content} /> : <div className="text-gray-300 whitespace-pre-wrap">{content}</div>}
        </main>
        <footer className="p-4 border-t border-gray-700 text-right">
            <button
                onClick={onClose}
                className="bg-neon-pink hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-all shadow-md shadow-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/50"
            >
                CLOSE
            </button>
        </footer>
      </div>
    </div>
  );
};

export default Modal;