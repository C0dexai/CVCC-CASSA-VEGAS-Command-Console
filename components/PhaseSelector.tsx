
import React from 'react';
import { Phase } from '../types';

interface PhaseSelectorProps {
  phases: Phase[];
  currentPhase: Phase;
  onSelectPhase: (phase: Phase) => void;
}

const PhaseSelector: React.FC<PhaseSelectorProps> = ({ phases, currentPhase, onSelectPhase }) => {
  return (
    <nav className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-md p-2 mb-8">
      <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-2">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => onSelectPhase(phase)}
            className={`
              flex-1 p-3 text-sm md:text-base font-medium text-left transition-all duration-300 
              border-l-4 focus:outline-none relative group
              ${
                currentPhase === phase
                  ? 'bg-neon-cyan/20 border-neon-cyan text-white'
                  : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:border-gray-500'
              }
            `}
          >
            <span className="block tracking-wider drop-shadow-lg">{phase}</span>
            {currentPhase === phase && <div className="absolute inset-0 border border-neon-cyan/50 rounded-md shadow-neon-cyan pointer-events-none animate-pulse"></div>}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default PhaseSelector;