import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { taskGetHistory, getDashboardStats } from '../lib/ipc';
import TaskLogs from '../components/TaskLogs';

function Reports() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, failed, stopped
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, success, total
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Load history and stats
  const loadData = async () => {
    setLoading(true);
    try {
      const [historyResult, statsResult] = await Promise.all([
        taskGetHistory(100), // Load last 100 tasks
        getDashboardStats(),
      ]);

      if (historyResult.success) {
        setHistory(historyResult.history || []);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort history
  const filteredHistory = history
    .filter((task) => {
      // Filter by status
      if (filter !== 'all' && task.status !== filter) return false;

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          task.message_template.toLowerCase().includes(search) ||
          task.id.toString().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'success') {
        const aRate = a.total_numbers > 0 ? (a.sent_count / a.total_numbers) * 100 : 0;
        const bRate = b.total_numbers > 0 ? (b.sent_count / b.total_numbers) * 100 : 0;
        return bRate - aRate;
      } else if (sortBy === 'total') {
        return b.total_numbers - a.total_numbers;
      }
      return 0;
    });

  // Calculate aggregate stats
  const aggregateStats = history.reduce(
    (acc, task) => {
      acc.totalTasks++;
      acc.totalMessages += task.total_numbers;
      acc.totalSent += task.sent_count;
      acc.totalFailed += task.failed_count;
      acc.totalSkipped += task.skipped_count;

      if (task.status === 'completed') acc.completedTasks++;
      if (task.status === 'failed') acc.failedTasks++;
      if (task.status === 'stopped') acc.stoppedTasks++;

      return acc;
    },
    {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      stoppedTasks: 0,
      totalMessages: 0,
      totalSent: 0,
      totalFailed: 0,
      totalSkipped: 0,
    }
  );

  const overallSuccessRate =
    aggregateStats.totalSent + aggregateStats.totalFailed > 0
      ? Math.round(
          (aggregateStats.totalSent / (aggregateStats.totalSent + aggregateStats.totalFailed)) * 100
        )
      : 0;

  // Export to CSV
  const handleExport = () => {
    const csvData = [
      ['Task ID', 'Status', 'Created At', 'Total', 'Sent', 'Failed', 'Skipped', 'Success Rate'],
      ...filteredHistory.map((task) => {
        const successRate =
          task.sent_count + task.failed_count > 0
            ? Math.round((task.sent_count / (task.sent_count + task.failed_count)) * 100)
            : 0;
        return [
          task.id,
          task.status,
          new Date(task.created_at).toLocaleString(),
          task.total_numbers,
          task.sent_count,
          task.failed_count,
          task.skipped_count,
          `${successRate}%`,
        ];
      }),
    ];

    const csv = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whasender-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'stopped':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'running':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'paused_manual':
      case 'paused_ban':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'stopped':
        return 'Stopped';
      case 'running':
        return 'Running';
      case 'paused_manual':
        return 'Paused';
      case 'paused_ban':
        return 'Paused (Ban)';
      case 'scheduled':
        return 'Scheduled';
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

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-2">View task history and performance metrics</p>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">{aggregateStats.totalTasks}</h3>
              <p className="text-sm text-gray-400">Total Tasks</p>
              <div className="flex gap-2 text-xs">
                <span className="text-green-400">{aggregateStats.completedTasks} completed</span>
                <span className="text-red-400">{aggregateStats.failedTasks} failed</span>
              </div>
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {aggregateStats.totalMessages.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-400">Total Messages</p>
              <p className="text-xs text-gray-500">
                {aggregateStats.totalSent.toLocaleString()} sent
              </p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">{overallSuccessRate}%</h3>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-xs text-gray-500">All time average</p>
            </div>
          </div>

          {/* Failed Messages */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {aggregateStats.totalFailed.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-400">Failed Messages</p>
              <p className="text-xs text-gray-500">
                {aggregateStats.totalSkipped.toLocaleString()} skipped
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'failed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setFilter('stopped')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'stopped'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Stopped
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="date">Sort by Date</option>
              <option value="success">Sort by Success Rate</option>
              <option value="total">Sort by Total Messages</option>
            </select>

            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Task History Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">
              Task History ({filteredHistory.length})
            </h2>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No tasks found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Message</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Sent</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Failed</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Success</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredHistory.map((task) => {
                    const successRate =
                      task.sent_count + task.failed_count > 0
                        ? Math.round((task.sent_count / (task.sent_count + task.failed_count)) * 100)
                        : 0;

                    return (
                      <tr key={task.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-4 text-sm text-white font-medium">#{task.id}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium border rounded-full ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300">
                          {new Date(task.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(task.created_at).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300 max-w-xs truncate">
                          {task.message_template.substring(0, 50)}
                          {task.message_template.length > 50 ? '...' : ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-white text-right font-medium">
                          {task.total_numbers}
                        </td>
                        <td className="px-4 py-4 text-sm text-green-400 text-right">
                          {task.sent_count}
                        </td>
                        <td className="px-4 py-4 text-sm text-red-400 text-right">
                          {task.failed_count}
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <span
                            className={`font-semibold ${
                              successRate >= 90
                                ? 'text-green-400'
                                : successRate >= 70
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {successRate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setShowLogsModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                            Logs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Logs Modal */}
      {showLogsModal && selectedTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Task #{selectedTaskId} Logs
              </h2>
              <button
                onClick={() => {
                  setShowLogsModal(false);
                  setSelectedTaskId(null);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <TaskLogs taskId={selectedTaskId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
