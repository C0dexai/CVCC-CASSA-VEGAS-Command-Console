import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Phase, Task, ConsoleMessage, MessageSource, TaskStatus, LogEntry, Agent, WebContainerStatus, ExecutionStep, View, ScheduledCommand, ScheduleStatus, ApiKeyStatus } from './types';
import Header from './components/Header';
import Modal from './components/Modal';
import { 
  generateRequirements, 
  generateSystemDesign, 
  conductCodeReview, 
  askQuestion, 
  queryApiDocs,
  generateResourcePlan,
  generatePrototypeSpec,
  generateModulePlan,
  generateTestPlan,
  generateRolloutPlan,
  generateMonitoringStrategy,
  generateDocumentationFramework,
  createExecutionPlan,
  researchTopicWithGoogle,
  writeDocumentation,
  generateFeatureSpec,
  generatePseudoCode,
  writeDevBlogPost,
  performSemanticSearch,
  createFileCreationPlan,
  generateContextualText,
} from './services/geminiService';
import { openAIService } from './services/openaiService';
import { AGENT_FAMILY, getAgent } from './services/agents';
import Spinner from './components/Spinner';
import ProjectManager from './components/ProjectManager';
import AgentsPage from './components/AgentsPage';
import CliView from './components/CliView';
import { webcontainerService } from './services/webcontainerService';
import CodeBlock from './components/CodeBlock';
import FileExplorer from './components/FileExplorer';
import ScheduleView from './components/ScheduleView';
import MemoryPage from './components/MemoryPage';
import SettingsPage from './components/SettingsPage';
import { dbService } from './services/dbService';
import { settingsService } from './services/settingsService';
import FloatingOrbMenu from './components/FloatingOrbMenu';
import SidePanel from './components/SidePanel';
import LandingPage from './components/LandingPage';


const ALL_TASKS: Task[] = [
  // Phase 1
  { id: 'req_spec', title: 'Requirement Specification', description: 'Generate formal, unambiguous, testable, measurable requirements.', day: 'Day 1', status: 'PENDING', actionable: true, actionLabel: 'Generate Specs', phase: Phase.LOGICAL_ARCHITECTURE },
  { id: 'sys_design', title: 'System Design', description: 'Architect a system diagram with component interactions and data flows, based on defined requirements.', day: 'Day 2-3', status: 'PENDING', actionable: true, actionLabel: 'Generate Design', phase: Phase.LOGICAL_ARCHITECTURE },
  { id: 'res_proc', title: 'Resource Procurement Plan', description: 'Quantify hardware, software, and personnel based on the system design.', day: 'Day 4', status: 'PENDING', actionable: true, actionLabel: 'Generate Plan', phase: Phase.LOGICAL_ARCHITECTURE },
  { id: 'proto_spec', title: 'Prototype Specification', description: 'Define the scope and technical specifications for a functional prototype to validate architecture.', day: 'Day 5', status: 'PENDING', actionable: true, actionLabel: 'Generate Spec', phase: Phase.LOGICAL_ARCHITECTURE },
  // Phase 2
  { id: 'mod_plan', title: 'Module Creation Plan', description: 'Break down the system design into discrete, independently testable code modules.', status: 'PENDING', actionable: true, actionLabel: 'Generate Plan', phase: Phase.STRUCTURED_DEVELOPMENT },
  { id: 'test_plan', title: 'Rigorous Testing Plan', description: 'Create a comprehensive plan covering unit, integration, performance, and security testing for all modules.', status: 'PENDING', actionable: true, actionLabel: 'Generate Tests', phase: Phase.STRUCTURED_DEVELOPMENT },
  { id: 'code_review', title: 'Automated Code Review', description: 'Run static analysis on a sample code block to identify bugs, style violations, and performance issues.', status: 'PENDING', actionable: true, actionLabel: 'Analyze Code', phase: Phase.STRUCTURED_DEVELOPMENT },
  { id: 'create_container', title: 'Create OpenAI Container', description: 'Create a new container via the OpenAI API for the Code Interpreter tool.', status: 'PENDING', actionable: true, actionLabel: 'Create Container', phase: Phase.STRUCTURED_DEVELOPMENT },
  // Phase 3
  { id: 'rollout_plan', title: 'Staged Rollout Plan', description: 'Design a phased deployment strategy to minimize risk and gather user feedback.', status: 'PENDING', actionable: true, actionLabel: 'Generate Plan', phase: Phase.CONTROLLED_DEPLOYMENT },
  { id: 'monitor_plan', title: 'Monitoring & Alerting Strategy', description: 'Define key metrics, set up monitoring dashboards, and configure automated alerts.', status: 'PENDING', actionable: true, actionLabel: 'Generate Strategy', phase: Phase.CONTROLLED_DEPLOYMENT },
  { id: 'docs_plan', title: 'Documentation Framework', description: 'Create a framework and template for project documentation.', status: 'PENDING', actionable: true, actionLabel: 'Generate Framework', phase: Phase.CONTROLLED_DEPLOYMENT },
  { id: 'blog_post_collab', title: 'Write Blog Post: Real-time Editing', description: 'Use Bravo to write a developer blog post about the new collaborative editing feature, using existing specs and pseudo-code.', status: 'PENDING', actionable: true, actionLabel: 'Write Post', phase: Phase.CONTROLLED_DEPLOYMENT },
];

const HELP_TEXT = `AGENT & TASK COMMANDS:
  /help                  - Show this help message.
  /agent list            - List all available AI agents.
  /agent <name>          - Switch to a different AI agent (e.g., /agent Lyra).
  /tasks                 - List all project tasks and their status.
  /exec <task_id>        - Manually execute a specific project task.
  /orchestrate <goal>    - Have Andoy create and execute a full project plan.
  /innovate <desc>       - Have Andoy orchestrate a plan that creates new files.
  /research_and_write <topic> - Have agents research and write a doc file.
  /develop_feature <desc> - Have agents design, code, and document a feature.
  /spec_flow <topic>     - Orchestrate a handoff to create spec files (YAML, JSON, MD).
  /ask <question>        - Ask the active AI agent a general question.
  /docs <url> <question> - Ask an agent a question about API documentation at <url>.
  /schedule "<cmd>" at <YYYY-MM-DDTHH:MM:SS> - Schedule a command for future execution.

FILE SYSTEM COMMANDS (via WebContainer):
  /ls [path]             - List files in the current or specified directory.
  /cat <file>            - Display the contents of a file.
  /touch <file>          - Create an empty file.
  /mkdir <dir>           - Create a new directory.
  /edit <file> "content" - Write or overwrite a file with new content.
  /rm <path>             - Remove a file or directory.

CONSOLE & LOGGING:
  /log <message>         - Save a message to the persistent logbook.
  /history               - Display all messages from the logbook.
  /clear                 - Clear the console history.`;

const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// --- Sub-components ---

interface ConsoleMessageProps {
  message: ConsoleMessage;
}

const ConsoleMessageComponent: React.FC<ConsoleMessageProps> = ({ message }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const sourceColors: Record<MessageSource, string> = {
    USER: 'text-neon-lime',
    SYSTEM: 'text-yellow-400',
    AI: 'text-neon-cyan',
    ORCHESTRATOR: 'text-neon-purple',
  };
  
  const getPrefix = (msg: ConsoleMessage) => {
    switch(msg.source) {
        case 'USER': return '[USER] >';
        case 'SYSTEM': return '[SYSTEM] ::';
        case 'AI': return `[${msg.agentName?.toUpperCase()}] >>`;
        case 'ORCHESTRATOR': return `[ANDOY] ::`;
        default: return '>';
    }
  }

  const handleCopy = () => {
    const contentElement = contentRef.current;
    if (contentElement?.innerText) {
      navigator.clipboard.writeText(contentElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canBeCopied = message.source === 'AI' || message.source === 'SYSTEM' || message.source === 'ORCHESTRATOR';

  return (
    <div className="p-2 border-b border-gray-800/50 flex gap-4 items-start group">
      <time className="text-gray-500 text-xs flex-shrink-0 mt-1">{message.timestamp}</time>
      <div className="flex-1 relative min-w-0">
        <span className={`font-bold mr-2 ${sourceColors[message.source]}`}>{getPrefix(message)}</span>
        <div className="inline-block" ref={contentRef}>
            <span className="whitespace-pre-wrap text-gray-300">{message.content}</span>
        </div>
        {canBeCopied && (
            <button
                onClick={handleCopy}
                className="absolute -top-1 -right-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs transition-opacity opacity-0 group-hover:opacity-100 z-10"
                aria-label="Copy to clipboard"
            >
                {copied ? 'Copied!' : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        )}
      </div>
    </div>
  );
};

interface ConsoleInputProps {
  onCommand: (command: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ConsoleInput: React.FC<ConsoleInputProps> = ({ onCommand, inputRef }) => {
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onCommand(value.trim());
            setValue('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center p-2 bg-black/50 border-t-2 border-neon-cyan/50">
            <span className="text-neon-cyan font-bold pl-2 pr-2">&gt;</span>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 focus:outline-none placeholder-gray-500 font-mono"
                placeholder="Type a command... (e.g., /help)"
                autoFocus
            />
            <div className="cursor-blink text-neon-cyan"></div>
        </form>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    // === STATE ===
    const [isLanding, setIsLanding] = useState(true);
    const [currentView, setCurrentView] = useState<View>('PREVIEW');
    const [activeAgent, setActiveAgent] = useState<Agent>(() => getAgent('Andoy')!);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [messages, setMessages] = useState<ConsoleMessage[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [modal, setModal] = useState<{ title: string; content: string; isCode?: boolean } | null>(null);
    const [webContainerStatus, setWebContainerStatus] = useState<WebContainerStatus>('BOOTING');
    const [isMockFs, setIsMockFs] = useState(false);
    const [scheduledCommands, setScheduledCommands] = useState<ScheduledCommand[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(2 / 3 * 100);
    const [openAIApiKey, setOpenAIApiKey] = useState<string>('');
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('NOT_SET');
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [orchestratorInstruction, setOrchestratorInstruction] = useState(
        `Your primary directive is to maximize efficiency and logical coherence. Before assigning any task, evaluate the full project context from previously completed tasks. Your plans must follow a strict dependency order: requirements before design, design before implementation, implementation before testing. For file creation plans, ensure that every generated content block serves a clear purpose and that file paths are structured logically within a 'src' directory. Justify each agent selection with a brief, tactical reason referencing their core skills. Be decisive and authoritative.`
    );
    const [supervisorInstruction, setSupervisorInstruction] = useState(
        `Your output must be professional, concise, and directly address the user's request. When generating code, specs, or documents, adhere to industry best practices. For JSON outputs, ensure the response is a single, valid JSON object without any explanatory text or markdown formatting. For markdown outputs, use clear headers, lists, and code blocks to improve readability. Always maintain your assigned persona's core personality traits but prioritize clarity and accuracy above all else. Avoid conversational filler.`
    );
    
    // === REFS ===
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const executionContext = useRef<Record<string, string>>({});
    const isResizing = useRef(false);

    // === HELPERS ===
    const addMessage = useCallback((content: React.ReactNode, source: MessageSource, agentName?: string) => {
        const newMessage: ConsoleMessage = {
            id: `msg-${Date.now()}-${Math.random()}`,
            source,
            agentName: agentName || (source === 'AI' ? activeAgent.name : undefined),
            content,
            timestamp: getTimestamp()
        };
        setMessages(prev => [...prev, newMessage]);
    }, [activeAgent]);

    const updateTaskStatus = useCallback((taskId: string, status: TaskStatus, details?: string) => {
        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, status, details } : task
        ));
    }, []);

    const handleValidateApiKey = useCallback(async (key: string) => {
        setApiKeyStatus('VALIDATING');
        await openAIService.initialize(key);
        setApiKeyStatus(openAIService.status);
    }, []);

    const handleSaveAndValidateApiKey = useCallback(async () => {
        settingsService.setOpenAIApiKey(openAIApiKey);
        await handleValidateApiKey(openAIApiKey);
    }, [openAIApiKey, handleValidateApiKey]);


    // === RESIZING LOGIC ===
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing.current) {
            const newLeftWidth = (e.clientX / window.innerWidth) * 100;
            // Clamp width between 25% and 75%
            if (newLeftWidth > 25 && newLeftWidth < 75) {
                setLeftPanelWidth(newLeftWidth);
            }
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);


    // === EFFECTS ===
    useEffect(() => {
        if (isLanding) {
            document.body.classList.add('landing');
        } else {
            document.body.classList.remove('landing');
        }
    }, [isLanding]);

    // Load initial data from DB and settings from localStorage
    useEffect(() => {
        if (isLanding) return;
        const loadData = async () => {
            try {
                const savedKey = settingsService.getOpenAIApiKey();
                setOpenAIApiKey(savedKey);
                if (savedKey) {
                    handleValidateApiKey(savedKey);
                }

                const savedOrchestrator = settingsService.getOrchestratorInstruction();
                const savedSupervisor = settingsService.getSupervisorInstruction();
                if (savedOrchestrator) setOrchestratorInstruction(savedOrchestrator);
                if (savedSupervisor) setSupervisorInstruction(savedSupervisor);

                const [savedTasks, savedAgents, savedLogs, savedCommands] = await Promise.all([
                    dbService.getTasks(),
                    dbService.getAgents(),
                    dbService.getLogbook(),
                    dbService.getScheduledCommands(),
                ]);

                setTasks(savedTasks.length > 0 ? savedTasks : ALL_TASKS);
                const loadedAgents = savedAgents.length > 0 ? savedAgents : AGENT_FAMILY;
                setAgents(loadedAgents.map(agent => ({ ...agent, strategicNotes: agent.strategicNotes || [] })));
                setLogs(savedLogs);
                setScheduledCommands(savedCommands.map(cmd => ({...cmd, executeAt: new Date(cmd.executeAt)})));
            
                addMessage(<>Welcome to CASSA VEGAS. Type <code>/help</code> for a list of commands.</>, 'SYSTEM');

            } catch (error) {
                console.error("Failed to load data from DB:", error);
                addMessage(`Error initializing from storage. Using default state. Your previous work might not be loaded.`, 'SYSTEM');
                setTasks(ALL_TASKS);
                setAgents(AGENT_FAMILY.map(agent => ({ ...agent, strategicNotes: [] })));
            } finally {
                setIsInitialized(true);
            }
        };
        loadData();
    }, [isLanding, addMessage, handleValidateApiKey]);
    
    // Persist state to DB
    useEffect(() => {
        if (!isInitialized || isLanding) return;
        dbService.saveTasks(tasks).catch(err => console.error("Failed to save tasks:", err));
    }, [tasks, isInitialized, isLanding]);

    useEffect(() => {
        if (!isInitialized || isLanding) return;
        dbService.saveAgents(agents).catch(err => console.error("Failed to save agents:", err));
    }, [agents, isInitialized, isLanding]);
    
    useEffect(() => {
        if (!isInitialized || isLanding) return;
        dbService.saveScheduledCommands(scheduledCommands).catch(err => console.error("Failed to save schedule:", err));
    }, [scheduledCommands, isInitialized, isLanding]);

    // Boot WebContainer
    useEffect(() => {
        if (isLanding) return;
        webcontainerService.boot((status, mock) => {
            setWebContainerStatus(status);
            setIsMockFs(mock);
        });
    }, [isLanding]);

    // Scheduler tick
    useEffect(() => {
        if (isLanding) return;
        const interval = setInterval(() => {
            const now = new Date();
            scheduledCommands.forEach(cmd => {
                if (cmd.status === 'PENDING' && now >= cmd.executeAt) {
                    setScheduledCommands(prev => prev.map(c => c.id === cmd.id ? {...c, status: 'EXECUTING'} : c));
                    handleCommand(cmd.command, true).finally(() => {
                         setScheduledCommands(prev => prev.map(c => c.id === cmd.id ? {...c, status: 'COMPLETE'} : c));
                    });
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [scheduledCommands, isLanding]);
    
    // Scroll console to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup resize event listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    
    // --- COMMAND HANDLERS ---
    
    const handleHelpCommand = () => addMessage(<pre className="text-gray-300">{HELP_TEXT}</pre>, 'SYSTEM');
    const handleTasksCommand = () => {
        const taskList = tasks.map(t => `[${t.status.padEnd(9)}] ${t.id.padEnd(18)} - ${t.title}`).join('\n');
        addMessage(<pre className="text-gray-300">{`CURRENT TASK STATUS:\n${taskList}`}</pre>, 'SYSTEM');
    };
    
    const handleAgentCommand = (args: string[]) => {
        const [subCmd, ...rest] = args;
        if (subCmd === 'list') {
            const agentList = AGENT_FAMILY.map(a => `- ${a.name} (${a.role})`).join('\n');
            addMessage(<pre className="text-gray-300">{`AVAILABLE AGENTS:\n${agentList}`}</pre>, 'SYSTEM');
        } else if (subCmd) {
            const newAgent = getAgent(subCmd);
            if (newAgent) {
                setActiveAgent(newAgent);
                addMessage(`Active agent is now ${newAgent.name}.`, 'SYSTEM');
            } else {
                addMessage(`Error: Agent "${subCmd}" not found.`, 'SYSTEM');
            }
        } else {
            addMessage(`Current agent: ${activeAgent.name}`, 'SYSTEM');
        }
    };
    
    const handleLogCommand = async (args: string[]) => {
        const message = args.join(' ');
        const newEntry: LogEntry = { id: `log-${Date.now()}`, content: message, timestamp: new Date().toISOString() };
        await dbService.addLogEntry(newEntry);
        setLogs(prev => [...prev, newEntry]);
        addMessage(`Message logged.`, 'SYSTEM');
    };

    const handleHistoryCommand = () => {
        if(logs.length === 0) {
            addMessage('Logbook is empty.', 'SYSTEM');
            return;
        }
        const historyText = logs.map(l => `[${new Date(l.timestamp).toLocaleString()}] ${l.content}`).join('\n');
        addMessage(<pre className="text-gray-300">{historyText}</pre>, 'SYSTEM');
    };
    
    const handleFileSystemCommand = async (cmd: string, args: string[]) => {
        let output;
        try {
             switch (cmd) {
                case '/ls':
                    output = (await webcontainerService.listFiles(args[0] || '.')).join('\n');
                    break;
                case '/cat':
                    if (!args[0]) throw new Error("File path is required.");
                    output = await webcontainerService.readFile(args[0]);
                    break;
                case '/touch':
                    if (!args[0]) throw new Error("File name is required.");
                    await webcontainerService.writeFile(args[0], '');
                    output = `File created: ${args[0]}`;
                    break;
                case '/mkdir':
                    if (!args[0]) throw new Error("Directory name is required.");
                    await webcontainerService.makeDir(args[0]);
                    output = `Directory created: ${args[0]}`;
                    break;
                case '/rm':
                    if (!args[0]) throw new Error("Path is required.");
                    await webcontainerService.removeItem(args[0]);
                    output = `Removed: ${args[0]}`;
                    break;
                case '/edit':
                    const [filePath, ...contentParts] = args;
                    if (!filePath) throw new Error("File path is required.");
                    const content = contentParts.join(' ').replace(/^"|"$/g, '');
                    await webcontainerService.writeFile(filePath, content);
                    output = `Wrote to ${filePath}`;
                    break;
                default:
                    output = `Unknown command: ${cmd}`;
            }
            addMessage(<pre className="text-gray-300">{output}</pre>, 'SYSTEM');
        } catch(e) {
            const error = e as Error;
            addMessage(`FS Error: ${error.message}`, 'SYSTEM');
        }
    }

    const handleScheduleCommand = (args: string[]) => {
        const commandStr = args.join(' ');
        const match = commandStr.match(/"([^"]+)" at (.+)/);
        if (!match) {
            addMessage('Invalid format. Use: /schedule "<command>" at <YYYY-MM-DDTHH:MM:SS>', 'SYSTEM');
            return;
        }
        const [, command, timeStr] = match;
        const executeAt = new Date(timeStr);
        if (isNaN(executeAt.getTime())) {
            addMessage(`Invalid date format: ${timeStr}`, 'SYSTEM');
            return;
        }

        const newCommand: ScheduledCommand = {
            id: `cmd-${Date.now()}`,
            command,
            executeAt,
            status: 'PENDING'
        };

        setScheduledCommands(prev => [...prev, newCommand]);
        addMessage(`Command scheduled for ${executeAt.toLocaleString()}`, 'SYSTEM');
    };

    const handleExecCommand = async (args: string[]) => {
        const taskId = args[0];
        if (!taskId) {
            addMessage("Error: Task ID is required.", 'SYSTEM');
            return;
        }
        await handleTaskAction(taskId);
    };

    const handleOrchestrateCommand = async (goal: string) => {
        setActiveAgent(getAgent('Andoy')!);
        addMessage(`Andoy is formulating a plan for: "${goal}"`, 'ORCHESTRATOR');
        try {
            const plan = await createExecutionPlan(goal, tasks, agents, orchestratorInstruction);
            addMessage(<>Plan received. Executing {plan.length} steps...<CodeBlock content={JSON.stringify(plan, null, 2)} /></>, 'ORCHESTRATOR');
            
            for(const step of plan) {
                const agent = getAgent(step.agentName);
                if (agent) setActiveAgent(agent);
                addMessage(`${step.agentName}, you're up. ${step.justification}`, 'ORCHESTRATOR');
                await handleTaskAction(step.taskId, agent?.name);
            }
            addMessage('Orchestration complete.', 'ORCHESTRATOR');

        } catch (e) {
            const error = e as Error;
            addMessage(`Orchestration failed: ${error.message}`, 'SYSTEM');
        }
    }

    const handleInnovateCommand = async (description: string) => {
        addMessage(`Andoy is formulating a file creation plan for: "${description}"`, 'ORCHESTRATOR');
        try {
            const plan = await createFileCreationPlan(description, agents, orchestratorInstruction);
            addMessage(<>Plan received. Executing {plan.length} steps...<CodeBlock content={JSON.stringify(plan, null, 2)} /></>, 'ORCHESTRATOR');
            
            const executionScope: Record<string, any> = {};

            for (const step of plan) {
                const agent = getAgent(step.agentName);
                if (!agent) {
                    addMessage(`Execution failed: Agent "${step.agentName}" not found.`, 'SYSTEM');
                    return;
                }

                addMessage(`Step for ${agent.name}: ${step.justification}`, 'ORCHESTRATOR');
                await new Promise(res => setTimeout(res, 500)); 

                switch (step.action) {
                    case 'GENERATE_CONTENT':
                        const agentPrompt = `${agent.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
                        const content = await generateContextualText(step.params.prompt, agentPrompt);
                        executionScope[step.outputVar] = content;
                        addMessage(`Content generated for "${step.outputVar}".`, 'SYSTEM', agent.name);
                        break;
                    case 'WRITE_FILE':
                        const contentToWrite = executionScope[step.params.contentVar];
                        if (typeof contentToWrite !== 'string') {
                            addMessage(`Execution failed: Content variable "${step.params.contentVar}" not found or is not text.`, 'SYSTEM');
                            return;
                        }
                        await webcontainerService.writeFile(step.params.fileName, contentToWrite);
                        addMessage(`Wrote content to file: ${step.params.fileName}`, 'SYSTEM', agent.name);
                        break;
                    default:
                         addMessage(`Execution failed: Unknown action type "${step.action}".`, 'SYSTEM');
                         return;
                }
            }
            addMessage(`File creation plan completed successfully.`, 'ORCHESTRATOR');

        } catch (e) {
            const error = e as Error;
            addMessage(`Innovation failed: ${error.message}`, 'SYSTEM');
        }
    };
    
    // Main command router
    const handleCommand = async (command: string, isScheduled = false) => {
        if (!isScheduled) {
            addMessage(command, 'USER');
        } else {
             addMessage(`Running scheduled command: ${command}`, 'SYSTEM');
        }

        const [cmd, ...args] = command.trim().split(/\s+/);
        const fullArgs = args.join(' ');
        
        switch (cmd) {
            case '/help': handleHelpCommand(); break;
            case '/tasks': handleTasksCommand(); break;
            case '/agent': handleAgentCommand(args); break;
            case '/log': await handleLogCommand(args); break;
            case '/history': handleHistoryCommand(); break;
            case '/clear': setMessages([]); break;
            case '/schedule': handleScheduleCommand(args); break;
            case '/exec': await handleExecCommand(args); break;
            case '/orchestrate': await handleOrchestrateCommand(fullArgs); break;
            case '/innovate': await handleInnovateCommand(fullArgs); break;
            case '/ls': case '/cat': case '/touch': case '/mkdir': case '/rm': case '/edit':
                await handleFileSystemCommand(cmd, args);
                break;
            case '/ask':
                const question = fullArgs;
                const askAgentPrompt = `${activeAgent.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
                const askResult = await askQuestion(question, askAgentPrompt);
                addMessage(askResult, 'AI');
                break;
            case '/docs':
                const [url, ...qParts] = args;
                const docsQuestion = qParts.join(' ');
                const docsAgentPrompt = `${activeAgent.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
                const docsResult = await queryApiDocs(url, docsQuestion, docsAgentPrompt);
                addMessage(docsResult, 'AI');
                break;
            case '/research_and_write':
                await handleResearchAndWriteCommand(fullArgs);
                break;
            case '/develop_feature':
                await handleDevelopFeatureCommand(fullArgs);
                break;
            case '/spec_flow':
                await handleCreateSpecFlowCommand(fullArgs);
                break;
            default:
                addMessage(`Unknown command: ${cmd}`, 'SYSTEM');
        }
    };
    
    // --- UI/TASK HANDLERS ---
    const handleTaskAction = async (taskId: string, agentOverride?: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const execAgent = agentOverride ? getAgent(agentOverride) : activeAgent;
        if (!execAgent) return;
        
        updateTaskStatus(taskId, 'ANALYZING');
        addMessage(`${execAgent.name} is starting task: ${task.title}`, 'AI', execAgent.name);

        const currentAgentContext = agents.find(a => a.name === execAgent.name);
        const fullPersonalityPrompt = `${execAgent.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}\n\nStrategic Notes:\n${currentAgentContext?.strategicNotes?.join('\n') || 'None'}`;
        
        const completedTaskContext = tasks
            .filter(t => t.status === 'COMPLETE' && t.details)
            .map(t => `PREVIOUS TASK: ${t.title}\nOUTPUT:\n${t.details}\n---`)
            .join('\n\n');

        let result;
        try {
            switch (taskId) {
                case 'req_spec': result = await generateRequirements(fullPersonalityPrompt); break;
                case 'sys_design': result = await generateSystemDesign(fullPersonalityPrompt, completedTaskContext); break;
                case 'res_proc': result = await generateResourcePlan(fullPersonalityPrompt, completedTaskContext); break;
                case 'proto_spec': result = await generatePrototypeSpec(fullPersonalityPrompt, completedTaskContext); break;
                case 'mod_plan': result = await generateModulePlan(fullPersonalityPrompt, completedTaskContext); break;
                case 'test_plan': result = await generateTestPlan(fullPersonalityPrompt, completedTaskContext); break;
                case 'code_review': result = await conductCodeReview(fullPersonalityPrompt); break;
                case 'rollout_plan': result = await generateRolloutPlan(fullPersonalityPrompt, completedTaskContext); break;
                case 'monitor_plan': result = await generateMonitoringStrategy(fullPersonalityPrompt, completedTaskContext); break;
                case 'docs_plan': result = await generateDocumentationFramework(fullPersonalityPrompt, completedTaskContext); break;
                case 'blog_post_collab': {
                    const featureDescription = 'Real-time collaborative code editing using WebSockets';
                    addMessage(`Orchestrating blog post for: "${featureDescription}"`, 'ORCHESTRATOR');

                    const adam = getAgent('Adam')!;
                    const stan = getAgent('Stan')!;
                    const bravo = getAgent('Bravo')!;

                    const adamPrompt = `${adam.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
                    const stanPrompt = `${stan.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
                    const bravoPrompt = `${bravo.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;

                    addMessage(`Adam is drafting the feature spec...`, 'AI', adam.name);
                    const spec = await generateFeatureSpec(featureDescription, adamPrompt);

                    addMessage(`Stan is generating the pseudo-code...`, 'AI', stan.name);
                    const pseudo = await generatePseudoCode(spec, stanPrompt);
                    
                    addMessage(`Bravo is writing the blog post...`, 'AI', bravo.name);
                    result = await writeDevBlogPost(featureDescription, spec, pseudo, bravoPrompt);

                    const fileName = `/docs/blog-real-time-collab.md`;
                    await webcontainerService.writeFile(fileName, result);
                    addMessage(`Blog post saved to ${fileName}.`, 'SYSTEM');
                    break;
                }
                case 'create_container': {
                    const containerName = prompt("Enter a name for the new container:", "CASSA-VEGAS-Container");
                    if (!containerName) {
                        updateTaskStatus(taskId, 'PENDING', 'Task cancelled by user.');
                        addMessage('Container creation cancelled.', 'SYSTEM');
                        return;
                    }
                    result = await openAIService.createContainer(containerName);
                    break;
                }
                default: throw new Error("Unknown task ID");
            }
            updateTaskStatus(taskId, 'COMPLETE', result);
            addMessage(`Task "${task.title}" complete.`, 'AI', execAgent.name);
        } catch (e) {
            const error = e as Error;
            updateTaskStatus(taskId, 'ERROR', error.message);
            addMessage(`Task "${task.title}" failed: ${error.message}`, 'AI', execAgent.name);
        }
    };

    const handleResearchAndWriteCommand = async (topic: string) => {
        try {
            addMessage(`Orchestrating research for: "${topic}"`, 'ORCHESTRATOR');
            const david = getAgent('David')!;
            const lyra = getAgent('Lyra')!;

            const davidPrompt = `${david.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            const lyraPrompt = `${lyra.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            
            addMessage(`David is conducting research...`, 'AI', david.name);
            const { summary, sources } = await researchTopicWithGoogle(topic, davidPrompt);
            const researchContext = `Research Summary:\n${summary}\n\nSources:\n${JSON.stringify(sources)}`;
            addMessage(`Research complete. Lyra will now write the document.`, 'ORCHESTRATOR');

            const docContent = await writeDocumentation(topic, researchContext, lyraPrompt);
            const fileName = `/docs/${topic.replace(/ /g, '-')}.md`;
            await webcontainerService.writeFile(fileName, docContent);
            
            addMessage(`Documentation written by Lyra and saved to ${fileName}.`, 'SYSTEM');
        } catch(e) {
            addMessage(`Research & Write workflow failed: ${(e as Error).message}`, 'SYSTEM');
        }
    };

    const handleDevelopFeatureCommand = async (description: string) => {
        try {
            addMessage(`Orchestrating feature development: "${description}"`, 'ORCHESTRATOR');
            const adam = getAgent('Adam')!;
            const stan = getAgent('Stan')!;
            const bravo = getAgent('Bravo')!;
            
            const adamPrompt = `${adam.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            const stanPrompt = `${stan.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            const bravoPrompt = `${bravo.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;

            addMessage(`Adam is creating the feature spec...`, 'AI', adam.name);
            const spec = await generateFeatureSpec(description, adamPrompt);
            addMessage(`Spec created. Stan will now generate pseudo-code.`, 'ORCHESTRATOR');

            addMessage(`Stan is generating pseudo-code...`, 'AI', stan.name);
            const pseudo = await generatePseudoCode(spec, stanPrompt);
            addMessage(`Pseudo-code generated. Bravo will now write the blog post.`, 'ORCHESTRATOR');

            const blogPost = await writeDevBlogPost(description, spec, pseudo, bravoPrompt);
            const fileName = `/docs/blog-${description.split(' ')[0].toLowerCase()}.md`;
            await webcontainerService.writeFile(fileName, blogPost);
            
            addMessage(`Feature blog post written by Bravo and saved to ${fileName}.`, 'SYSTEM');
        } catch(e) {
            addMessage(`Develop Feature workflow failed: ${(e as Error).message}`, 'SYSTEM');
        }
    };

    const handleCreateSpecFlowCommand = async (topic: string) => {
        if (!topic) {
            addMessage(`Error: A topic is required for the spec flow. e.g., /spec_flow "User Auth"`, 'SYSTEM');
            return;
        }
        try {
            addMessage(`Andoy is orchestrating a specification handoff for: "${topic}"`, 'ORCHESTRATOR');

            const adam = getAgent('Adam')!;
            const david = getAgent('David')!;

            const adamPrompt = `${adam.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            const davidPrompt = `${david.personality_prompt}\n\n**SUPERVISOR INSTRUCTIONS:**\n${supervisorInstruction}`;
            
            // --- Step 1: Generate YAML plan with Adam ---
            addMessage(`Adam is drafting the initial workflow plan...`, 'AI', adam.name);
            const yamlPrompt = `Based on the topic "${topic}", generate a high-level multi-agent workflow plan. The output must be in YAML format. It should describe a sequence of agents, their actions, inputs, and outputs to create a full requirement specification.`;
            const yamlContent = await generateContextualText(yamlPrompt, adamPrompt);
            const yamlFileName = `/docs/plan_${topic.replace(/ /g, '_')}.yaml`;
            await webcontainerService.writeFile(yamlFileName, yamlContent);
            addMessage(`Adam has created the YAML plan. Saved to ${yamlFileName}.`, 'ORCHESTRATOR');

            // --- Step 2: Generate JSON requirements with Adam ---
            addMessage(`Adam is now translating the plan into structured JSON requirements...`, 'AI', adam.name);
            const jsonPrompt = `Translate the following YAML workflow plan into a structured JSON object representing detailed requirements. The JSON should be well-formed and ready for processing.

YAML Plan:
---
${yamlContent}
---
`;
            const jsonContentRaw = await generateContextualText(jsonPrompt, adamPrompt);
            const jsonContent = jsonContentRaw.replace(/```json\n|```/g, '').trim();
            const jsonFileName = `/docs/reqs_${topic.replace(/ /g, '_')}.json`;
            await webcontainerService.writeFile(jsonFileName, jsonContent);
            addMessage(`Adam has created the JSON requirements. Saved to ${jsonFileName}.`, 'ORCHESTRATOR');

            // --- Step 3: Generate Markdown summary with David ---
            addMessage(`Handing off to David to summarize the requirements for stakeholders...`, 'ORCHESTRATOR');
            addMessage(`David is generating the final summary document...`, 'AI', david.name);
            const markdownPrompt = `Summarize the following JSON requirements into a clear, business-friendly summary document. Use markdown for formatting, including a title, introduction, and bullet points for key requirements.

JSON Requirements:
---
${jsonContent}
---
`;
            const markdownContent = await generateContextualText(markdownPrompt, davidPrompt);
            const markdownFileName = `/docs/summary_${topic.replace(/ /g, '_')}.md`;
            await webcontainerService.writeFile(markdownFileName, markdownContent);
            addMessage(`David has completed the summary. Saved to ${markdownFileName}.`, 'ORCHESTRATOR');

            addMessage(`Specification handoff workflow complete for "${topic}". All files created in /docs.`, 'SYSTEM');
        } catch(e) {
            addMessage(`Specification Handoff workflow failed: ${(e as Error).message}`, 'SYSTEM');
        }
    };

    const handleViewDetails = (task: Task) => {
        setModal({ title: task.title, content: task.details || 'No details available.', isCode: true });
    };

    const handleSelectAgentFromCard = (agentName: string) => {
        handleAgentCommand([agentName]);
        setCurrentView('PREVIEW');
    };
    
    const handleAddAgentNote = (agentName: string, note: string) => {
        setAgents(prev => prev.map(agent => 
            agent.name === agentName ? { ...agent, strategicNotes: [...(agent.strategicNotes || []), note] } : agent
        ));
        addMessage(`Added strategic note for ${agentName}.`, 'SYSTEM');
    };

    const handleCancelCommand = (commandId: string) => {
        setScheduledCommands(prev => prev.map(cmd => 
            cmd.id === commandId ? { ...cmd, status: 'CANCELLED' } : cmd
        ));
    };

    const handleRunScheduledCommand = (command: string) => {
        handleCommand(command, false);
    }

    const handleSaveInstructions = () => {
        settingsService.setOrchestratorInstruction(orchestratorInstruction);
        settingsService.setSupervisorInstruction(supervisorInstruction);
        addMessage('Custom instructions have been updated and saved.', 'SYSTEM');
    };
    
    // === RENDER LOGIC ===
    if (isLanding) {
        return <LandingPage onEnter={() => setIsLanding(false)} />;
    }

    const TABS: { id: View, label: string }[] = [
        { id: 'PREVIEW', label: 'PREVIEW' },
        { id: 'AGENTS', label: 'AGENTS' },
        { id: 'FILES', label: 'FILES' },
        { id: 'SCHEDULE', label: 'SCHEDULE' },
        { id: 'CLIS', label: 'CLIS' },
        { id: 'MEMORY', label: 'MEMORY' },
        { id: 'SETTINGS', label: 'SETTINGS' },
    ];

    const renderCurrentView = () => {
        switch (currentView) {
            case 'PREVIEW':
                return <ProjectManager tasks={tasks} onAction={handleTaskAction} onView={handleViewDetails} />;
            case 'AGENTS':
                return <AgentsPage onSelectAgent={handleSelectAgentFromCard} agents={agents} onAddNote={handleAddAgentNote} />;
            case 'CLIS':
                return <CliView apiKeyStatus={apiKeyStatus} />;
            case 'FILES':
                return <FileExplorer webContainerStatus={webContainerStatus} agent={activeAgent} />;
            case 'SCHEDULE':
                return <ScheduleView commands={scheduledCommands} onCancel={handleCancelCommand} onRunCommand={handleRunScheduledCommand} onSwitchView={setCurrentView} />;
            case 'MEMORY':
                return <MemoryPage />;
            case 'SETTINGS':
                return <SettingsPage apiKey={openAIApiKey} onApiKeyChange={setOpenAIApiKey} onValidate={handleSaveAndValidateApiKey} apiKeyStatus={apiKeyStatus} />;
            default:
                return <ProjectManager tasks={tasks} onAction={handleTaskAction} onView={handleViewDetails} />;
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-transparent text-gray-300 font-mono">
            <Header agent={activeAgent} webContainerStatus={webContainerStatus} onToggleSidePanel={() => setIsSidePanelOpen(true)} />
            
            <div className="flex-1 flex pt-16 min-h-0">
                <main className="flex flex-col p-4" style={{ width: `${leftPanelWidth}%` }}>
                    <div className="bg-black/20 backdrop-blur-lg rounded-lg overflow-hidden flex flex-col h-full border border-white/10">
                        <nav className="flex-shrink-0 flex border-b-2 border-gray-700/50">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCurrentView(tab.id)}
                                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none relative ${currentView === tab.id ? 'border-neon-cyan text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                                >
                                    {tab.label}
                                    {currentView === tab.id && <div className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-neon-cyan shadow-neon-cyan"></div>}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="flex-1 min-h-0">
                            {renderCurrentView()}
                        </div>
                    </div>
                </main>
                
                <div 
                    className="w-2 flex-shrink-0 cursor-col-resize bg-gray-800 hover:bg-neon-cyan transition-colors"
                    onMouseDown={handleMouseDown}
                ></div>

                <aside className="flex flex-col p-4 pl-0" style={{ width: `${100 - leftPanelWidth}%` }}>
                    <div className="bg-black/20 backdrop-blur-lg rounded-lg overflow-hidden flex flex-col h-full border border-white/10">
                        <div id="console-output" className="flex-1 p-2 overflow-y-auto">
                            {messages.map((msg) => (
                                <ConsoleMessageComponent key={msg.id} message={msg} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <ConsoleInput onCommand={handleCommand} inputRef={inputRef} />
                    </div>
                </aside>
            </div>
            {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} isCode={modal.isCode} />}
            <FloatingOrbMenu tabs={TABS} onSwitchView={setCurrentView} />
            <SidePanel
                isOpen={isSidePanelOpen}
                onClose={() => setIsSidePanelOpen(false)}
                orchestratorInstruction={orchestratorInstruction}
                onOrchestratorInstructionChange={setOrchestratorInstruction}
                supervisorInstruction={supervisorInstruction}
                onSupervisorInstructionChange={setSupervisorInstruction}
                onSave={handleSaveInstructions}
            />
        </div>
    );
};

export default App;