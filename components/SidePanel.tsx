import React from 'react';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    orchestratorInstruction: string;
    onOrchestratorInstructionChange: (value: string) => void;
    supervisorInstruction: string;
    onSupervisorInstructionChange: (value: string) => void;
    onSave: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen,
    onClose,
    orchestratorInstruction,
    onOrchestratorInstructionChange,
    supervisorInstruction,
    onSupervisorInstructionChange,
    onSave,
}) => {
    
    const handleSave = () => {
        onSave();
        onClose();
    };

    return (
        <div 
            className={`fixed inset-0 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-hidden={!isOpen}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-dark-bg/70 backdrop-blur-lg border-l-2 border-neon-purple/50 shadow-2xl shadow-neon-purple/20 flex flex-col transition-transform transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="side-panel-title"
            >
                <header className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                    <h2 id="side-panel-title" className="text-2xl font-bold text-neon-purple drop-shadow-[0_0_5px_rgba(160,0,255,0.7)] tracking-wider">
                        CUSTOM INSTRUCTIONS
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close panel">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-1 p-6 overflow-y-auto space-y-8">
                    <div>
                        <label htmlFor="orchestrator-instructions" className="block text-lg font-semibold text-neon-cyan mb-2">
                            Orchestrator (Andoy) Instructions
                        </label>
                        <p className="text-sm text-gray-400 mb-3">
                            High-level directives for the main orchestrator agent. These instructions guide how it creates and delegates plans.
                        </p>
                        <textarea
                            id="orchestrator-instructions"
                            value={orchestratorInstruction}
                            onChange={(e) => onOrchestratorInstructionChange(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-cyan font-mono"
                            placeholder="e.g., Prioritize security and scalability in all generated plans..."
                        />
                    </div>
                    <div>
                        <label htmlFor="supervisor-instructions" className="block text-lg font-semibold text-neon-cyan mb-2">
                            Supervisor (Agent) Instructions
                        </label>
                        <p className="text-sm text-gray-400 mb-3">
                            General rules for all agents executing individual tasks. This ensures quality and consistency in their outputs.
                        </p>
                         <textarea
                            id="supervisor-instructions"
                            value={supervisorInstruction}
                            onChange={(e) => onSupervisorInstructionChange(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-cyan font-mono"
                            placeholder="e.g., All code must include comments. All documentation must be in markdown."
                        />
                    </div>
                </main>

                <footer className="p-6 border-t border-gray-700 text-right flex-shrink-0">
                    <button
                        onClick={handleSave}
                        className="bg-neon-purple hover:bg-opacity-80 text-black font-bold py-3 px-6 rounded transition-all shadow-md shadow-neon-purple/30 hover:shadow-lg hover:shadow-neon-purple/50"
                    >
                        Save & Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SidePanel;