import React from 'react';
import { ApiKeyStatus } from '../types';
import Spinner from './Spinner';

interface SettingsPageProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onValidate: () => Promise<void>;
  apiKeyStatus: ApiKeyStatus;
}

const StatusIndicator: React.FC<{ status: ApiKeyStatus }> = ({ status }) => {
    switch(status) {
        case 'VALID':
            return <span className="text-neon-lime font-bold">VALID</span>;
        case 'INVALID':
            return <span className="text-red-400 font-bold">INVALID</span>;
        case 'VALIDATING':
            return <span className="text-yellow-400 font-bold flex items-center gap-2"><Spinner /> VALIDATING...</span>;
        case 'NOT_SET':
            return <span className="text-gray-500 font-bold">NOT SET</span>;
    }
}

const SettingsPage: React.FC<SettingsPageProps> = ({ apiKey, onApiKeyChange, onValidate, apiKeyStatus }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onValidate();
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-neon-cyan tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">SETTINGS</h2>
        <p className="text-gray-400 mt-1">Configure API keys and other system settings.</p>
      </header>

      <div className="max-w-2xl">
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-bold text-neon-pink mb-1 drop-shadow-[0_0_5px_rgba(255,0,255,0.7)]">OpenAI API Key</h3>
          <p className="text-sm text-gray-400 mb-4">
            Provide your OpenAI API key to enable features like the OpenAI CLI and container management. Your key is saved locally in your browser's storage and is not sent anywhere except to OpenAI's API.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <label htmlFor="openai-api-key" className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  id="openai-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-pink font-mono"
                />
              </div>
              <div className="flex-shrink-0 pt-0 md:pt-7">
                <button
                    type="submit"
                    disabled={apiKeyStatus === 'VALIDATING'}
                    className="w-full md:w-auto bg-neon-pink hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-all shadow-md shadow-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/50 disabled:bg-gray-500 disabled:shadow-none"
                >
                    Save & Validate
                </button>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-300">Status: </span>
              <StatusIndicator status={apiKeyStatus} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;