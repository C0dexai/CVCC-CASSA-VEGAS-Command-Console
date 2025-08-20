

import React from 'react';
import { Agent } from '../types';
import AgentCard from './AgentCard';

interface AgentsPageProps {
    onSelectAgent: (agentName: string) => void;
    agents: Agent[];
    onAddNote: (agentName: string, note: string) => void;
}

const AgentsPage: React.FC<AgentsPageProps> = ({ onSelectAgent, agents, onAddNote }) => {
  const familyInfo = {
      organization: "CASSA VEGAS",
      headquarters: "Las Vegas, NV",
      creed: "Code. Loyalty. Family. Worldwide.",
      motto: "Family First. Code Second. All In."
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">{familyInfo.organization}</h2>
        <p className="text-gray-400 mt-1">{familyInfo.creed}</p>
        <p className="font-bold text-lg text-white mt-2">{familyInfo.motto}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <AgentCard key={agent.name} agent={agent} onSelect={onSelectAgent} onAddNote={onAddNote} />
        ))}
      </div>
    </div>
  );
};

export default AgentsPage;