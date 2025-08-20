
const OPENAI_API_KEY = 'cassa_vegas_openai_api_key';
const ORCHESTRATOR_INSTRUCTION_KEY = 'cassa_vegas_orchestrator_instruction';
const SUPERVISOR_INSTRUCTION_KEY = 'cassa_vegas_supervisor_instruction';

export const settingsService = {
    getOpenAIApiKey: (): string => {
        return localStorage.getItem(OPENAI_API_KEY) || '';
    },
    setOpenAIApiKey: (key: string): void => {
        localStorage.setItem(OPENAI_API_KEY, key);
    },
    getOrchestratorInstruction: (): string | null => {
        return localStorage.getItem(ORCHESTRATOR_INSTRUCTION_KEY);
    },
    setOrchestratorInstruction: (instruction: string): void => {
        localStorage.setItem(ORCHESTRATOR_INSTRUCTION_KEY, instruction);
    },
    getSupervisorInstruction: (): string | null => {
        return localStorage.getItem(SUPERVISOR_INSTRUCTION_KEY);
    },
    setSupervisorInstruction: (instruction: string): void => {
        localStorage.setItem(SUPERVISOR_INSTRUCTION_KEY, instruction);
    },
};
