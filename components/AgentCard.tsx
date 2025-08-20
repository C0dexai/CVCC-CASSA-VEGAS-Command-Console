import React, { useState } from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onSelect: (agentName: string) => void;
  onAddNote: (agentName: string, note: string) => void;
}

const getUsageProfile = (agent: Agent): string => {
  switch (agent.name) {
    case 'Andoy': return "Select for high-level strategy, project orchestration, final decisions on architecture, and cybersecurity oversight. The King sets the vision.";
    case 'Stan': return "Select for direct execution of tasks, rigorous code reviews, and when you need a direct, no-nonsense tactical assessment. The Enforcer gets it done.";
    case 'David': return "Select for data analysis, generating metrics, dashboard design, and when you need a purely quantitative, emotionless perspective on performance.";
    case 'Charlie': return "Select for tasks requiring stealth and precision, like security vulnerability testing, network intrusion analysis, or any operation that needs to be off-the-books.";
    case 'Bravo': return "Select for generating user-facing communication, marketing copy, or when you need to rally the team with a high-energy message. Brings the noise.";
    case 'Adam': return "Select for foundational system design, long-term strategic planning, and building complex, scalable blueprints. The Architect sees the whole board.";
    case 'Lyra': return "Select for crafting user-friendly explanations, summarizing complex topics with empathy, or when you need a supportive, human-centric perspective.";
    case 'Kara': return "Select for financial analysis, resource auditing, budget planning, or negotiating technical requirements against resource constraints. Balances the books.";
    case 'Sophia': return "Select for brainstorming innovative features, future-proofing architecture, and turning ambitious, big-picture ideas into actionable plans.";
    case 'Cecilia': return "Select for all things defensive cybersecurity. Use for designing encryption protocols, securing infrastructure, and protecting project assets from threats.";
    default: return "This agent is a valuable member of the crew, ready to contribute their unique skills to the mission.";
  }
};


const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onAddNote }) => {
  const [note, setNote] = useState('');

  const handleAddNote = () => {
    if (note.trim()) {
      onAddNote(agent.name, note.trim());
      setNote('');
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-6 flex flex-col h-full transition-all duration-300 hover:border-neon-purple/70 hover:shadow-neon-purple">
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-neon-purple tracking-wider drop-shadow-[0_0_5px_rgba(160,0,255,0.7)]">{agent.name.toUpperCase()}</h3>
        <p className="text-gray-400 italic mb-4">{agent.role}</p>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-300 mb-2">Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map(skill => (
              <span key={skill} className="bg-neon-purple/20 text-neon-purple text-xs font-medium px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
            <h4 className="font-semibold text-gray-300 mb-1">Personality:</h4>
            <p className="text-sm text-gray-400">{agent.personality}</p>
        </div>

        <div className="mb-4">
            <h4 className="font-semibold text-gray-300 mb-1">Contextual Usage:</h4>
            <p className="text-sm text-gray-400">{getUsageProfile(agent)}</p>
        </div>

        <div className="mt-4">
            <h4 className="font-semibold text-gray-300 mb-2">Strategic Notes:</h4>
            {agent.strategicNotes && agent.strategicNotes.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 pl-2 bg-black/20 p-2 rounded-md">
                {agent.strategicNotes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No notes added.</p>
            )}
        </div>
      </div>
      
      <div className="mt-6 flex-shrink-0 space-y-4">
          <div className="space-y-2">
             <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Add a note for ${agent.name}...`}
                rows={2}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-purple"
             />
             <button
                onClick={handleAddNote}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
             >
                Add Strategic Note
             </button>
          </div>
          <button 
            onClick={() => onSelect(agent.name)}
            className="w-full bg-neon-purple hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-all shadow-md shadow-neon-purple/30 hover:shadow-lg hover:shadow-neon-purple/50"
          >
            Switch to {agent.name}
          </button>
      </div>
    </div>
  );
};

export default AgentCard;