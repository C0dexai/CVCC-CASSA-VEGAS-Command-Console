import React, { useState, useRef, useEffect } from 'react';
import { ConsoleMessage, MessageSource } from '../types';
import Spinner from './Spinner';
import CodeBlock from './CodeBlock';

const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Simple markdown-like renderer for code blocks
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
    // Split content by markdown-style code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="whitespace-pre-wrap break-words">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeContent = part.replace(/```.*\n/,'').replace(/```$/, '');
                    return <CodeBlock key={index} content={codeContent} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};


const CliMessageComponent: React.FC<{ message: ConsoleMessage }> = ({ message }) => {
    const sourceColors: Record<string, string> = {
        USER: 'text-neon-lime',
        SYSTEM: 'text-yellow-400',
        AI: 'text-neon-cyan',
    };

    const getPrefix = (msg: ConsoleMessage) => {
        switch (msg.source) {
            case 'USER': return '>';
            case 'SYSTEM': return '::';
            case 'AI': return '<<';
            default: return '>';
        }
    };

    return (
        <div className="p-2 flex gap-4 items-start font-mono text-sm">
            <time className="text-gray-500 flex-shrink-0 mt-1">{message.timestamp}</time>
            <div className={`font-bold ${sourceColors[message.source]}`}>{getPrefix(message)}</div>
            <div className="flex-1 min-w-0">
                {typeof message.content === 'string' ? (
                    <MessageContent content={message.content} />
                ) : (
                    message.content
                )}
            </div>
        </div>
    );
};


interface CliTerminalProps {
    cliName: string;
    welcomeMessage: string;
    onCommand: (command: string) => Promise<string>;
}

const CliTerminal: React.FC<CliTerminalProps> = ({ cliName, welcomeMessage, onCommand }) => {
    const [history, setHistory] = useState<ConsoleMessage[]>([
        { id: 'init-cli', source: 'SYSTEM', content: welcomeMessage, timestamp: getTimestamp() }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isProcessing]);

    const addMessage = (source: MessageSource, content: React.ReactNode) => {
        setHistory(prev => [...prev, {
            id: `msg-${Date.now()}-${Math.random()}`,
            source,
            content,
            timestamp: getTimestamp()
        }]);
    };

    const handleCommand = async (command: string) => {
        if (!command.trim() || isProcessing) return;

        addMessage('USER', command);
        setInputValue('');
        setIsProcessing(true);

        try {
            const result = await onCommand(command.trim());
            addMessage('AI', result);
        } catch (e) {
            const error = e as Error;
            addMessage('SYSTEM', `Critical Error: ${error.message}`);
        }

        setIsProcessing(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCommand(inputValue);
    };

    return (
        <div className="h-full flex flex-col bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden">
            <header className="p-2 border-b border-gray-700/50 text-center">
                <h3 className="font-bold text-neon-pink tracking-wider drop-shadow-[0_0_5px_rgba(255,0,255,0.7)]">{cliName}</h3>
            </header>
            <div className="flex-1 overflow-y-auto p-2">
                {history.map(msg => <CliMessageComponent key={msg.id} message={msg} />)}
                {isProcessing && (
                    <div className="p-2 flex gap-4 items-center">
                        <time className="text-gray-500 text-xs flex-shrink-0">{getTimestamp()}</time>
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Spinner />
                            <span>PROCESSING...</span>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex items-center p-2 bg-gray-900 border-t-2 border-neon-pink/50">
                <span className="text-neon-lime font-bold pl-2 pr-2">&gt;</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-transparent text-gray-200 focus:outline-none placeholder-gray-500 font-mono"
                    placeholder={isProcessing ? "Processing..." : "Enter command..."}
                    disabled={isProcessing}
                    autoFocus
                />
                {!isProcessing && <div className="cursor-blink text-neon-lime"></div>}
            </form>
        </div>
    );
};

export default CliTerminal;