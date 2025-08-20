import React from 'react';

const MemoryArchitectureCard: React.FC<{ title: string; description: string; children: React.ReactNode; color: 'cyan' | 'purple' }> = ({ title, description, children, color }) => {
    const colorClasses = {
        cyan: {
            text: 'text-neon-cyan',
            shadow: 'hover:shadow-neon-cyan',
            border: 'hover:border-neon-cyan/70',
            highlight: 'text-neon-cyan',
        },
        purple: {
            text: 'text-neon-purple',
            shadow: 'hover:shadow-neon-purple',
            border: 'hover:border-neon-purple/70',
            highlight: 'text-neon-purple',
        }
    };
    const classes = colorClasses[color];

    return (
        <div className={`bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-6 transition-all duration-300 ${classes.border} ${classes.shadow}`}>
            <h3 className={`text-xl font-bold ${classes.text} tracking-wider drop-shadow-[0_0_5px]`}>{title}</h3>
            <p className="text-gray-400 mt-2 mb-4">{description}</p>
            <div className="text-sm text-gray-300 space-y-3">{children}</div>
        </div>
    );
};


const MemoryPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">COGNITIVE ARCHITECTURE</h2>
        <p className="text-gray-400 mt-1 max-w-3xl mx-auto">
          A blueprint for the system's long-term memory and contextual awareness. This outlines how CASSA VEGAS agents can achieve true statefulness and learn from past operations.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MemoryArchitectureCard
          title="Vector Store: The Project's Living Archive"
          description="A vector store acts as a specialized database for searchable, long-term memory. Instead of storing text, it stores numerical representations (vectors) of the information's meaning."
          color="cyan"
        >
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">How It Would Work:</h4>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-neon-cyan">File Ingestion:</strong> When a file is created or uploaded (e.g., a requirements doc, code file, or meeting transcript), its content is broken into chunks.
              </li>
              <li>
                <strong className="text-neon-cyan">Embedding:</strong> Each chunk is sent to an AI model (like Gemini) to be converted into a vector embedding—a list of numbers that captures the semantic meaning.
              </li>
              <li>
                <strong className="text-neon-cyan">Storage:</strong> The vector is stored in a database (e.g., Pinecone, ChromaDB) along with a reference to the original text chunk and its source file.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">The Advantage:</h4>
            <p>
              When an agent needs context (e.g., "Summarize security requirements for the auth feature"), it converts that query into a vector and uses it to find the most similar vectors in the database. This is **semantic search**, retrieving information based on meaning, not just keywords. It's how agents can find relevant data even if the wording is different.
            </p>
          </div>
        </MemoryArchitectureCard>
        
        <MemoryArchitectureCard
          title="Agent Memory: Beyond Short-Term Context"
          description="Agent memory ensures that each AI persona retains its identity, learns from its actions, and remembers the history of its interactions across multiple sessions."
          color="purple"
        >
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">Implementation Strategy:</h4>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-neon-purple">Action Logging:</strong> Every significant action (task execution, decision, handoff) taken by an agent is logged. This includes the command, the agent's justification, the result, and the timestamp.
              </li>
               <li>
                <strong className="text-neon-purple">Memory Summarization:</strong> Periodically, a background process could use an AI model to summarize an agent's recent actions into key takeaways, updating its "Strategic Notes" automatically. For example, "Stan recently reviewed three code modules and found they all lacked proper error handling."
              </li>
              <li>
                <strong className="text-neon-purple">Contextual Injection:</strong> When an agent is activated, a summary of its recent activities and relevant historical context (retrieved from the vector store) is dynamically injected into its system prompt. This reminds the agent of its recent work and relevant past events.
              </li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold text-gray-200 mb-1">The Advantage:</h4>
            <p>
              This creates true continuity. An agent like 'Adam' won't just design a system based on immediate requirements; he'll remember past architectural decisions he made and why. This prevents redundant work, improves decision-making, and allows agent roles to become more refined and consistent over time, just like a human team member.
            </p>
          </div>
        </MemoryArchitectureCard>
      </div>

      <div className="mt-8 bg-black/50 backdrop-blur-lg border border-neon-lime/50 rounded-lg p-6 text-center shadow-lg shadow-neon-lime/20">
        <h4 className="text-xl font-bold text-white">Current Status: Persistence Layer Implemented</h4>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          The application now uses the browser's IndexedDB to provide persistence for core application state. Your <strong className="text-neon-lime">Tasks</strong>, <strong className="text-neon-lime">Agent Notes</strong>, <strong className="text-neon-lime">Logbook</strong>, and <strong className="text-neon-lime">Scheduled Commands</strong> will be saved between sessions. This establishes the foundational memory layer for the CASSA VEGAS platform.
        </p>
      </div>

    </div>
  );
};

export default MemoryPage;