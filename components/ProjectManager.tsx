import React, { useState } from 'react';
import { Phase, Task, PhaseData } from '../types';
import PhaseSelector from './PhaseSelector';
import PhaseContent from './PhaseContent';

const ALL_PHASES: Phase[] = [
  Phase.LOGICAL_ARCHITECTURE,
  Phase.STRUCTURED_DEVELOPMENT,
  Phase.CONTROLLED_DEPLOYMENT,
];

interface ProjectManagerProps {
  tasks: Task[];
  onAction: (taskId: string) => void;
  onView: (task: Task) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ tasks, onAction, onView }) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.LOGICAL_ARCHITECTURE);

  const phasesData: PhaseData[] = ALL_PHASES.map(phaseId => ({
    id: phaseId,
    tasks: tasks.filter(task => task.phase === phaseId),
  }));

  const currentPhaseData = phasesData.find(p => p.id === currentPhase)!;

  return (
    <div className="bg-transparent p-4 md:p-6 h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold text-neon-cyan mb-4 tracking-widest flex-shrink-0 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">PROJECT BLUEPRINT</h2>
      <div className="flex-shrink-0">
        <PhaseSelector
          phases={ALL_PHASES}
          currentPhase={currentPhase}
          onSelectPhase={setCurrentPhase}
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <PhaseContent
          phaseData={currentPhaseData}
          onAction={onAction}
          onView={onView}
        />
      </div>
    </div>
  );
};

export default ProjectManager;