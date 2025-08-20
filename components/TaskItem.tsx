
import React from 'react';
import { Task, TaskStatus } from '../types';
import Spinner from './Spinner';

interface TaskItemProps {
  task: Task;
  onAction: (taskId: string) => void;
  onView: (task: Task) => void;
}

const StatusIndicator: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const baseClasses = "font-bold text-xs px-2 py-1 rounded-full";
  switch (status) {
    case 'PENDING':
      return <span className={`${baseClasses} bg-gray-600 text-gray-200`}>PENDING</span>;
    case 'IN_PROGRESS':
      return <span className={`${baseClasses} bg-blue-500 text-white`}>IN PROGRESS</span>;
    case 'ANALYZING':
       return <span className={`${baseClasses} bg-yellow-500 text-black flex items-center gap-2`}><Spinner /> ANALYZING...</span>;
    case 'COMPLETE':
      return <span className={`${baseClasses} bg-neon-lime text-black shadow-neon-lime`}>COMPLETE</span>;
    case 'ERROR':
      return <span className={`${baseClasses} bg-red-600 text-red-100`}>ERROR</span>;
    default:
      return null;
  }
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onAction, onView }) => {
  const canPerformAction = task.actionable && task.status !== 'ANALYZING' && task.status !== 'COMPLETE';
  const canViewDetails = task.status === 'COMPLETE' || task.status === 'ERROR';

  return (
    <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 hover:border-neon-cyan/70 hover:shadow-neon-cyan">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <StatusIndicator status={task.status} />
          {task.day && <span className="text-sm text-gray-500 font-bold tracking-wider">{task.day}</span>}
        </div>
        <h3 className="text-lg font-semibold text-neon-cyan drop-shadow-[0_0_4px_rgba(0,255,255,0.5)]">{task.title}</h3>
        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
      </div>
      <div className="flex-shrink-0 flex gap-2 w-full md:w-auto">
        {canPerformAction && (
          <button
            onClick={() => onAction(task.id)}
            disabled={task.status === 'ANALYZING'}
            className="w-full md:w-auto bg-neon-pink hover:bg-opacity-80 text-black font-bold py-2 px-4 rounded transition-all shadow-md shadow-neon-pink/30 hover:shadow-lg hover:shadow-neon-pink/50 disabled:bg-gray-500 disabled:shadow-none disabled:text-gray-300"
          >
            {task.actionLabel}
          </button>
        )}
        {canViewDetails && (
           <button
            onClick={() => onView(task)}
            className="w-full md:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;