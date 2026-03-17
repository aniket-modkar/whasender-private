import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  taskGetActive,
  taskStart,
  taskPause,
  taskResume,
  taskStop,
  onTaskProgress,
  onTaskStatusChange,
  onTaskComplete,
  onTaskBanDetected,
} from '../lib/ipc';
import TaskLogs from '../components/TaskLogs';

function Monitor() {
  const [activeTask, setActiveTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logTab, setLogTab] = useState('live'); // 'live' or 'historical'
  const logsEndRef = useRef(null);

  // Auto-scroll logs to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Load active task
  const loadActiveTask = async () => {
    setLoading(true);
    try {
      const result = await taskGetActive();
      if (result.success && result.task) {
        setActiveTask(result.task);
        // Initialize progress from task data
        setTaskProgress({
          sent: result.task.sent_count,
          failed: result.task.failed_count,
          skipped: result.task.skipped_count,
          total: result.task.total_numbers,
        });
      } else {
        setActiveTask(null);
        setTaskProgress(null);
      }
    } catch (error) {
      console.error('Error loading active task:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTask();

    // Set up event listeners
    const unsubProgress = onTaskProgress((data) => {
      setTaskProgress(data);
      addLog('info', `Sending to ${data.currentPhone} (${data.sent}/${data.total})`);
    });

    const unsubStatus = onTaskStatusChange((data) => {
      loadActiveTask();
      addLog('status', `Task status changed: ${data.oldStatus} → ${data.newStatus}${data.reason ? ` (${data.reason})` : ''}`);
    });

    const unsubComplete = onTaskComplete((data) => {
      loadActiveTask();
      addLog('success', `Task completed! Sent: ${data.stats.sentCount}, Failed: ${data.stats.failedCount}, Skipped: ${data.stats.skippedCount}`);
    });

    const unsubBan = onTaskBanDetected((data) => {
      addLog('error', `⚠️ Ban/Rate limit detected! Task paused at ${data.sentSoFar} messages.`);
    });

    return () => {
      if (unsubProgress) unsubProgress();
      if (unsubStatus) unsubStatus();
      if (unsubComplete) unsubComplete();
      if (unsubBan) unsubBan();
    };
  }, []);

  // Add log entry
  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  };

  // Task actions
  const handleStart = async () => {
    if (!activeTask) return;
    setActionLoading(true);
    try {
      const result = await taskStart(activeTask.id);
      if (result.success) {
        addLog('success', 'Task started');
        await loadActiveTask();
      } else {
        addLog('error', `Failed to start: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const result = await taskPause();
      if (result.success) {
        addLog('info', 'Task paused');
        await loadActiveTask();
      } else {
        addLog('error', `Failed to pause: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      // Pass taskId for more robust resuming
      const result = await taskResume(activeTask?.id);
      if (result.success) {
        addLog('success', 'Task resumed');
        await loadActiveTask();
      } else {
        addLog('error', `Failed to resume: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeTask) return;
    if (!window.confirm('Are you sure you want to stop this task? This action cannot be undone.')) {
      return;
    }
    setActionLoading(true);
    try {
      const result = await taskStop(activeTask.id);
      if (result.success) {
        addLog('info', 'Task stopped');
        await loadActiveTask();
      } else {
        addLog('error', `Failed to stop: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'paused_manual':
      case 'paused_ban':
      case 'paused_limit':
        return 'text-yellow-400';
      case 'scheduled':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
      case 'stopped':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'paused_manual':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'paused_limit':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'paused_ban':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'scheduled':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'failed':
      case 'stopped':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused_manual':
        return 'Paused';
      case 'paused_limit':
        return 'Paused (Daily Limit)';
      case 'paused_ban':
        return 'Paused (Ban Detected)';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'stopped':
        return 'Stopped';
      default:
        return status;
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'status':
        return '↻';
      default:
        return '•';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'status':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Task Monitor</h1>
            <p className="text-gray-400 mt-2">No active task to monitor</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Tasks</h3>
              <p className="text-gray-400 mb-6">
                Create a new task to start monitoring progress
              </p>
              <Link
                to="/new-task"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Create New Task
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = taskProgress
    ? Math.round((taskProgress.sent / taskProgress.total) * 100)
    : Math.round((activeTask.sent_count / activeTask.total_numbers) * 100);

  const successRate = taskProgress
    ? taskProgress.sent + taskProgress.failed > 0
      ? Math.round((taskProgress.sent / (taskProgress.sent + taskProgress.failed)) * 100)
      : 0
    : activeTask.sent_count + activeTask.failed_count > 0
    ? Math.round((activeTask.sent_count / (activeTask.sent_count + activeTask.failed_count)) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Task Monitor</h1>
            <p className="text-gray-400 mt-2">Real-time task progress and logs</p>
          </div>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Task Status Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white">Task #{activeTask.id}</h2>
              <span className={`px-3 py-1 text-sm font-medium border rounded-full ${getStatusBadge(activeTask.status)}`}>
                {getStatusLabel(activeTask.status)}
              </span>
            </div>
            <div className="flex gap-2">
              {activeTask.status === 'scheduled' && (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  <PlayIcon className="w-4 h-4" />
                  Start
                </button>
              )}
              {activeTask.status === 'running' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </button>
              )}
              {(activeTask.status === 'paused_manual' || activeTask.status === 'paused_ban' || activeTask.status === 'paused_limit') && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Resume
                </button>
              )}
              {['running', 'paused_manual', 'paused_ban', 'paused_limit', 'scheduled'].includes(activeTask.status) && (
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  <StopIcon className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Message Template */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Message Template</label>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-sm text-white whitespace-pre-wrap">
                {activeTask.message_template.length > 300
                  ? activeTask.message_template.substring(0, 300) + '...'
                  : activeTask.message_template}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Overall Progress</span>
              <span className="text-white font-medium">
                {taskProgress?.sent || activeTask.sent_count} / {activeTask.total_numbers} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                style={{ width: `${progressPercentage}%` }}
              >
                {progressPercentage > 10 && (
                  <span className="text-xs text-white font-medium">{progressPercentage}%</span>
                )}
              </div>
            </div>
            {taskProgress?.currentPhone && (
              <p className="text-xs text-gray-500 mt-2">
                Currently sending to: +{taskProgress.currentPhone}
              </p>
            )}
          </div>

          {/* Ban Warning */}
          {activeTask.status === 'paused_ban' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Rate Limit / Ban Detected</p>
                <p className="text-xs text-red-300 mt-1">
                  WhatsApp has detected unusual activity. Please wait before resuming to avoid permanent ban.
                </p>
              </div>
            </div>
          )}

          {/* Manual Pause Warning */}
          {activeTask.status === 'paused_manual' && (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-400">⏸️ Task Paused</p>
                <p className="text-xs text-blue-300 mt-1">
                  {activeTask.pause_reason || 'Task has been paused. Click Resume to continue from where it left off.'}
                  {activeTask.total_numbers - activeTask.sent_count > 0 &&
                    ` ${activeTask.total_numbers - activeTask.sent_count} messages remaining.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Daily Limit Warning */}
          {activeTask.status === 'paused_limit' && (
            <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-6">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-400">⏸️ Daily Limit Reached</p>
                <p className="text-xs text-orange-300 mt-1">
                  Task paused to protect your account. Will automatically resume tomorrow at 9:00 AM IST.
                  {activeTask.total_numbers - activeTask.sent_count} messages remaining.
                </p>
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Sent</p>
              <p className="text-2xl font-bold text-green-400">
                {taskProgress?.sent || activeTask.sent_count}
              </p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {taskProgress?.failed || activeTask.failed_count}
              </p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Skipped</p>
              <p className="text-2xl font-bold text-yellow-400">
                {taskProgress?.skipped || activeTask.skipped_count}
              </p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-400">{successRate}%</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-purple-400">
                {activeTask.total_numbers - (taskProgress?.sent || activeTask.sent_count) - (taskProgress?.failed || activeTask.failed_count) - (taskProgress?.skipped || activeTask.skipped_count)}
              </p>
            </div>
          </div>
        </div>

        {/* Logs Section with Tabs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {/* Tabs */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setLogTab('live')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    logTab === 'live'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Live Activity
                </button>
                <button
                  onClick={() => setLogTab('historical')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    logTab === 'historical'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Historical Logs
                </button>
              </div>
              {logTab === 'live' && (
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>
            {logTab === 'live' && (
              <p className="text-xs text-gray-400">
                Real-time activity for current session (cleared on page refresh)
              </p>
            )}
            {logTab === 'historical' && (
              <p className="text-xs text-gray-400">
                Persistent logs from database (searchable and exportable)
              </p>
            )}
          </div>

          {/* Live Logs Tab */}
          {logTab === 'live' && (
            <div className="p-4 bg-gray-900 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity yet. Logs will appear here.</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <span className="text-gray-600">[{log.timestamp}]</span>
                    <span className={getLogColor(log.type)}>{getLogIcon(log.type)}</span>
                    <span className={getLogColor(log.type)}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Historical Logs Tab */}
          {logTab === 'historical' && activeTask && (
            <div className="p-4 bg-gray-900">
              <TaskLogs taskId={activeTask.id} autoRefresh={activeTask.status === 'running'} />
            </div>
          )}
          {logTab === 'historical' && !activeTask && (
            <div className="p-4 bg-gray-900 h-96 flex items-center justify-center">
              <p className="text-gray-500">No active task to show logs for</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Monitor;
