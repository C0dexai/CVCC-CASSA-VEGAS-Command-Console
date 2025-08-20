import React from 'react';
import { Agent } from '../types';
import type { WebContainerStatus } from '../types';
import Spinner from './Spinner';

interface HeaderProps {
    agent: Agent;
    webContainerStatus: WebContainerStatus;
    onToggleSidePanel: () => void;
}

const WebContainerStatusIndicator: React.FC<{ status: WebContainerStatus }> = ({ status }) => {
    switch (status) {
        case 'BOOTING':
            return (
                <div className="flex items-center space-x-2 text-yellow-400">
                    <Spinner />
                    <span>FS: BOOTING</span>
                </div>
            );
        case 'READY':
             return (
                <div className="flex items-center space-x-2 text-neon-lime">
                     <span className="relative flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-lime shadow-neon-lime"></span>
                    </span>
                    <span>FS: READY</span>
                </div>
            );
        case 'ERROR':
        case 'UNSUPPORTED':
            return (
                <div className="flex items-center space-x-2 text-red-400">
                    <span className="relative flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span>FS: ERROR</span>
                </div>
            );
        default:
            return null;
    }
}

const Header: React.FC<HeaderProps> = ({ agent, webContainerStatus, onToggleSidePanel }) => {
  return (
    <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4 fixed top-0 left-0 right-0 z-20 h-16 flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
          {agent.name.toUpperCase()} :: COMMAND CONSOLE
        </h1>
        <div className="flex items-center space-x-4 text-xs md:text-sm">
          <button onClick={onToggleSidePanel} className="text-gray-400 hover:text-neon-purple transition-colors" title="Custom Instructions">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>
           <div className="hidden md:block text-gray-500">|</div>
          <WebContainerStatusIndicator status={webContainerStatus} />
          <div className="hidden md:block text-gray-500">|</div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-400">SYSTEM: ONLINE</span>
          </div>
           <div className="hidden md:block text-gray-500">|</div>
           <div className="hidden md:block">
            <span className="text-gray-300">AGENT: <span className="font-bold text-white">{agent.name}</span> ({agent.role})</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;