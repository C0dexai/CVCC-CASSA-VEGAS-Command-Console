import React from 'react';

export enum Phase {
  LOGICAL_ARCHITECTURE = 'Phase 1: Logical Architecture & Resource Allocation',
  STRUCTURED_DEVELOPMENT = 'Phase 2: Structured Development',
  CONTROLLED_DEPLOYMENT = 'Phase 3: Controlled Deployment & Maintenance',
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR' | 'ANALYZING';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  day?: string;
  details?: string;
  actionable: boolean;
  actionLabel?: string;
  phase: Phase;
}

export interface PhaseData {
  id: Phase;
  tasks: Task[];
}

export type MessageSource = 'USER' | 'SYSTEM' | 'AI' | 'ORCHESTRATOR';

export interface ConsoleMessage {
    id: string;
    source: MessageSource;
    agentName?: string;
    content: React.ReactNode;
    timestamp: string;
}

export interface LogEntry {
    id: string;
    content: string;
    timestamp: string;
}

export interface Agent {
  name: string;
  gender: string;
  role:string;
  skills: string[];
  voice_style: string;
  personality: string;
  personality_prompt: string;
  strategicNotes?: string[];
}

export type WebContainerStatus = 'BOOTING' | 'READY' | 'ERROR' | 'UNSUPPORTED';

export interface ExecutionStep {
  taskId: string;
  agentName: string;
  justification: string;
}

export interface FileSystemNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
}

export type View = 'PREVIEW' | 'AGENTS' | 'CLIS' | 'FILES' | 'SCHEDULE' | 'MEMORY' | 'SETTINGS';

export type ScheduleStatus = 'PENDING' | 'EXECUTING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';

export interface ScheduledCommand {
  id: string;
  command: string;
  executeAt: Date;
  status: ScheduleStatus;
}

export type VectorIndexStatus = 'NOT_INDEXED' | 'INDEXING' | 'INDEXED' | 'ERROR';

export type ApiKeyStatus = 'VALID' | 'INVALID' | 'NOT_SET' | 'VALIDATING';
