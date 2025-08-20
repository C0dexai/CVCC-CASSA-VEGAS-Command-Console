
import React from 'react';
import { PhaseData, Task } from '../types';
import TaskItem from './TaskItem';

interface PhaseContentProps {
  phaseData: PhaseData;
  onAction: (taskId: string) => void;
  onView: (task: Task) => void;
}

const PhaseContent: React.FC<PhaseContentProps> = ({ phaseData, onAction, onView }) => {
  return (
    <section>
      <div className="space-y-4">
        {phaseData.tasks.map((task) => (
          <TaskItem key={task.id} task={task} onAction={onAction} onView={onView} />
        ))}
      </div>
    </section>
  );
};

export default PhaseContent;
