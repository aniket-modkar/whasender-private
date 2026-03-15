import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PaperAirplaneIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  getDashboardStats,
  taskStart,
  taskPause,
  taskResume,
  onTaskProgress,
  onTaskStatusChange,
} from '../lib/ipc';
import useAuthStore from '../stores/authStore';

function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskProgress, setTaskProgress] = useState(null);

  // Load dashboard stats
  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getDashboardStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Set up event listeners for task updates
    const unsubProgress = onTaskProgress((data) => {
      setTaskProgress(data);
    });

    const unsubStatus = onTaskStatusChange(() => {
      loadStats(); // Reload stats when task status changes
    });

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => {
      if (unsubProgress) unsubProgress();
      if (unsubStatus) unsubStatus();
      clearInterval(interval);
    };
  }, []);

  const handleTaskAction = async (action, taskId) => {
    try {
      if (action === 'start') {
        await taskStart(taskId);
      } else if (action === 'pause') {
        await taskPause();
      } else if (action === 'resume') {
        await taskResume();
      }
      await loadStats();
    } catch (error) {
      console.error('Error performing task action:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'paused_manual':
      case 'paused_ban':
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused_manual':
        return 'Paused';
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

  const successRate =
    stats?.todayStats.total > 0
      ? Math.round((stats.todayStats.sent / stats.todayStats.total) * 100)
      : 0;

  const limitPercentage = stats ? Math.round((stats.sentToday / stats.dailyLimit) * 100) : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Welcome back, {user?.name || 'User'}! Here's your campaign overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Messages Sent Today */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <PaperAirplaneIcon className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {stats?.sentToday || 0}
                <span className="text-sm text-gray-400 font-normal ml-2">
                  / {stats?.dailyLimit || 0}
                </span>
              </h3>
              <p className="text-sm text-gray-400">Messages Sent</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    limitPercentage >= 90 ? 'bg-red-500' : limitPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">{successRate}%</h3>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-xs text-gray-500">
                {stats?.todayStats.sent || 0} sent, {stats?.todayStats.failed || 0} failed
              </p>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-xs text-gray-400">All Time</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">{stats?.completedTasks || 0}</h3>
              <p className="text-sm text-gray-400">Completed Tasks</p>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="text-xs text-gray-400">Warmup</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Day {stats?.accountAge || 0}</h3>
              <p className="text-sm text-gray-400">Account Age</p>
              <p className="text-xs text-gray-500">
                {stats?.accountAge >= 31 ? 'Fully warmed up' : 'Warming up...'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Task Section */}
        {stats?.activeTask ? (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Active Task</h2>
              <span className={`text-sm font-medium ${getStatusColor(stats.activeTask.status)}`}>
                {getStatusLabel(stats.activeTask.status)}
              </span>
            </div>

            {/* Task Info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Message Template</p>
                <p className="text-white bg-gray-900 p-3 rounded border border-gray-700 text-sm">
                  {stats.activeTask.message_template.length > 150
                    ? stats.activeTask.message_template.substring(0, 150) + '...'
                    : stats.activeTask.message_template}
                </p>
              </div>

              {/* Progress Bar */}
              {taskProgress || (stats.activeTask.sent_count > 0) ? (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {taskProgress?.sent || stats.activeTask.sent_count} / {stats.activeTask.total_numbers}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.round(
                          ((taskProgress?.sent || stats.activeTask.sent_count) /
                            stats.activeTask.total_numbers) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  {taskProgress && (
                    <p className="text-xs text-gray-500 mt-2">
                      Currently sending to: {taskProgress.currentPhone}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Sent</p>
                  <p className="text-lg font-semibold text-green-400">
                    {taskProgress?.sent || stats.activeTask.sent_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Failed</p>
                  <p className="text-lg font-semibold text-red-400">
                    {taskProgress?.failed || stats.activeTask.failed_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Skipped</p>
                  <p className="text-lg font-semibold text-yellow-400">
                    {taskProgress?.skipped || stats.activeTask.skipped_count || 0}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {stats.activeTask.status === 'scheduled' && (
                  <button
                    onClick={() => handleTaskAction('start', stats.activeTask.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start Now
                  </button>
                )}
                {stats.activeTask.status === 'running' && (
                  <button
                    onClick={() => handleTaskAction('pause')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <PauseIcon className="w-4 h-4" />
                    Pause
                  </button>
                )}
                {(stats.activeTask.status === 'paused_manual' || stats.activeTask.status === 'paused_ban') && (
                  <button
                    onClick={() => handleTaskAction('resume')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <Link
                  to="/monitor"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  View Details
                </Link>
              </div>

              {/* Ban Warning */}
              {stats.activeTask.status === 'paused_ban' && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Rate Limit Detected</p>
                    <p className="text-xs text-red-300 mt-1">
                      WhatsApp has detected unusual activity. Please wait before resuming.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center mb-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <PaperAirplaneIcon className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Tasks</h3>
              <p className="text-gray-400 mb-6">
                Create your first task to start sending WhatsApp messages
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
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/new-task"
            className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <PaperAirplaneIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">New Campaign</h3>
                <p className="text-sm text-gray-400">Create a new message task</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">View Reports</h3>
                <p className="text-sm text-gray-400">Analyze your performance</p>
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-gray-800 hover:bg-gray-750 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <CheckCircleIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Settings</h3>
                <p className="text-sm text-gray-400">Configure your account</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
