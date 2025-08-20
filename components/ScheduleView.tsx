import React, { useState } from 'react';
import { ScheduledCommand, ScheduleStatus, View } from '../types';
import Spinner from './Spinner';

interface ScheduleViewProps {
  commands: ScheduledCommand[];
  onCancel: (commandId: string) => void;
  onRunCommand: (command: string) => void;
  onSwitchView: (view: View) => void;
}

const samplePrompts = [
    {
      title: 'Full Project Orchestration',
      description: 'Use Andoy, the King, to generate and execute a complete plan for a high-level goal. He will delegate tasks to the most suitable agents.',
      command: '/orchestrate Build a secure user authentication feature for our web app'
    },
    {
      title: 'Develop a Feature Workflow',
      description: 'A multi-step workflow involving architecture, pseudo-code generation, and writing a developer blog post about a new feature.',
      command: '/develop_feature A real-time notification system using websockets'
    },
    {
      title: 'Research & Document Workflow',
      description: 'A complex workflow where one agent researches a topic and another writes a document based on the findings. The result is saved to the file system.',
      command: '/research_and_write The role of AI in modern cybersecurity'
    },
    {
      title: 'Execute a Specific Task',
      description: 'Directly command the currently active agent to perform a single task from the project blueprint. Try this after switching to a specific agent like Adam.',
      command: '/exec sys_design'
    },
    {
      title: 'Agent-to-Agent Handoff',
      description: 'Switch to a specific agent to leverage their skills. After switching, you can assign them a task that fits their role.',
      command: '/agent Adam'
    },
    {
      title: 'Ask an Agent a Question',
      description: 'Get a direct answer from the active agent based on their unique personality and expertise. Try asking Adam about design or Lyra about user communication.',
      command: '/ask What are the most important principles of good system design?'
    },
];

const PromptExampleCard: React.FC<{
    title: string;
    description: string;
    command: string;
    onRunCommand: (command: string) => void;
    onSwitchView: (view: View) => void;
}> = ({ title, description, command, onRunCommand, onSwitchView }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRun = () => {
        onRunCommand(command);
        onSwitchView('PREVIEW');
    };

    return (
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-4 flex flex-col transition-all duration-300 hover:border-neon-pink/70 hover:shadow-neon-pink">
            <div className="flex-grow">
                <h4 className="text-lg font-bold text-neon-pink">{title}</h4>
                <p className="text-sm text-gray-400 mt-1 mb-3">{description}</p>
                <code className="block bg-black/50 p-3 rounded-md text-gray-200 font-mono text-sm mb-4 break-all">{command}</code>
            </div>
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={handleCopy}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                >
                    {copied ? 'Copied!' : 'Copy Command'}
                </button>
                <button
                    onClick={handleRun}
                    className="flex-1 bg-neon-pink hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-colors text-sm shadow-neon-pink"
                >
                    Run & View Console
                </button>
            </div>
        </div>
    );
};


const StatusBadge: React.FC<{ status: ScheduleStatus }> = ({ status }) => {
    const baseClasses = "font-bold text-xs px-3 py-1 rounded-full inline-block";
    switch (status) {
        case 'PENDING':
            return <span className={`${baseClasses} bg-gray-600 text-gray-200`}>PENDING</span>;
        case 'EXECUTING':
            return (
                <span className={`${baseClasses} bg-blue-500 text-white flex items-center gap-2`}>
                    <Spinner /> EXECUTING
                </span>
            );
        case 'COMPLETE':
            return <span className={`${baseClasses} bg-neon-lime text-black shadow-neon-lime`}>COMPLETE</span>;
        case 'FAILED':
            return <span className={`${baseClasses} bg-red-800 text-red-100`}>FAILED</span>;
        case 'CANCELLED':
            return <span className={`${baseClasses} bg-yellow-600 text-black`}>CANCELLED</span>;
        default:
            return null;
    }
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ commands, onCancel, onRunCommand, onSwitchView }) => {
  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-y-auto">
        <header className="flex-shrink-0 mb-6">
            <h2 className="text-3xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">TASK SCHEDULER</h2>
            <p className="text-gray-400 mt-1">A list of all pending and completed scheduled commands.</p>
        </header>

        {commands.length > 0 ? (
          <div className="mb-8 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-800/70 border-b-2 border-neon-cyan/50">
                      <tr>
                          <th className="p-4 font-semibold text-gray-300">ID</th>
                          <th className="p-4 font-semibold text-gray-300">Command</th>
                          <th className="p-4 font-semibold text-gray-300">Execute At</th>
                          <th className="p-4 font-semibold text-gray-300 text-center">Status</th>
                          <th className="p-4 font-semibold text-gray-300 text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                      {commands.map(cmd => (
                          <tr key={cmd.id} className="hover:bg-gray-800/50 transition-colors">
                              <td className="p-4 text-sm text-gray-500 font-mono">{cmd.id}</td>
                              <td className="p-4 font-mono text-gray-200">
                                  <code className="bg-black/30 p-2 rounded-md">{cmd.command}</code>
                              </td>
                              <td className="p-4 text-gray-300">{cmd.executeAt.toLocaleString()}</td>
                              <td className="p-4 text-center">
                                  <StatusBadge status={cmd.status} />
                              </td>
                              <td className="p-4 text-center">
                                  {cmd.status === 'PENDING' && (
                                      <button
                                          onClick={() => onCancel(cmd.id)}
                                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
                                      >
                                          Cancel
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        ) : (
           <div className="text-center p-8 bg-black/20 backdrop-blur-lg border border-dashed border-white/10 rounded-lg mb-8">
                <p className="text-gray-400">No commands scheduled yet. Use the prompt library below or the console to schedule a task.</p>
                <code className="mt-4 inline-block bg-gray-800 text-neon-pink p-3 rounded-md text-sm">
                    /schedule "/exec req_spec" at 2025-01-01T09:00:00
                </code>
            </div>
        )}
        
        <div className="flex-shrink-0">
            <header className="mb-4">
                <h3 className="text-2xl font-bold text-neon-pink tracking-wider drop-shadow-[0_0_8px_rgba(255,0,255,0.5)]">Prompt Library</h3>
                <p className="text-gray-400 mt-1">Examples to get you started with agent orchestration and task execution.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {samplePrompts.map(p => (
                    <PromptExampleCard 
                        key={p.title}
                        {...p}
                        onRunCommand={onRunCommand}
                        onSwitchView={onSwitchView}
                    />
                ))}
            </div>
        </div>

    </div>
  );
};

export default ScheduleView;