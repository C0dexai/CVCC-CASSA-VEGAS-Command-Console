import React, { useState } from 'react';
import CliTerminal from './CliTerminal';
import { sendGeminiCliPrompt } from '../services/geminiService';
import { openAIService } from '../services/openaiService';
import { ApiKeyStatus } from '../types';

type ActiveCli = 'gemini' | 'openai';

interface CliViewProps {
  apiKeyStatus: ApiKeyStatus;
}

const CliView: React.FC<CliViewProps> = ({ apiKeyStatus }) => {
  const [activeCli, setActiveCli] = useState<ActiveCli>('gemini');

  const getOpenAIWelcomeMessage = () => {
    switch(apiKeyStatus) {
      case 'VALID': return "Connected to OpenAI API (gpt-4o-mini). Type a prompt to begin.";
      case 'INVALID': return "OpenAI API key is invalid. Please correct it in the SETTINGS tab.";
      case 'VALIDATING': return "Validating OpenAI API key...";
      case 'NOT_SET': return "OpenAI API key not provided. Please set it in the SETTINGS tab to enable this CLI.";
    }
  }

  const cliConfig: Record<ActiveCli, { name: string; welcome: string; handler: (cmd: string) => Promise<string>; }> = {
    gemini: {
      name: "Gemini CLI",
      welcome: "Connected to Google Gemini (gemini-2.5-flash).",
      handler: sendGeminiCliPrompt
    },
    openai: {
      name: `OpenAI CLI ${apiKeyStatus !== 'VALID' ? '(Requires Key)' : ''}`,
      welcome: getOpenAIWelcomeMessage(),
      handler: (cmd: string) => openAIService.sendOpenAiCliPrompt(cmd)
    }
  };

  const selectedConfig = cliConfig[activeCli];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <nav className="flex-shrink-0 mb-4 flex space-x-2 border-b-2 border-gray-700/50">
        {(Object.keys(cliConfig) as ActiveCli[]).map(cliKey => (
           <button
             key={cliKey}
             onClick={() => setActiveCli(cliKey)}
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none relative
              ${activeCli === cliKey 
                ? 'border-neon-cyan text-white' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`
              }
           >
            {cliConfig[cliKey].name}
            {activeCli === cliKey && <div className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-neon-cyan shadow-neon-cyan"></div>}
           </button>
        ))}
      </nav>
      <div className="flex-1 min-h-0">
          <CliTerminal
            key={activeCli} // Add key to force re-mount and reset state on tab change
            cliName={selectedConfig.name}
            welcomeMessage={selectedConfig.welcome}
            onCommand={selectedConfig.handler}
          />
      </div>
    </div>
  );
};

export default CliView;