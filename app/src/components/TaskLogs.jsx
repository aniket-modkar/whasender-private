import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { taskGetLogs, taskExportLogs, taskClearLogs } from '../lib/ipc';

const TaskLogs = ({ taskId, autoRefresh = false, refreshInterval = 5000 }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [limit, setLimit] = useState(100);
  const [exporting, setExporting] = useState(false);
  const logsEndRef = useRef(null);

  // Load logs from database
  const loadLogs = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const result = await taskGetLogs(taskId, {
        limit,
        level: levelFilter === 'all' ? null : levelFilter,
        search: searchTerm || null,
      });

      if (result.success) {
        setLogs(result.logs);
      } else {
        console.error('Failed to load logs:', result.error);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadLogs();
  }, [taskId, levelFilter, searchTerm, limit]);

  // Auto-refresh (optional)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLogs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, taskId, levelFilter, searchTerm, limit]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Export logs
  const handleExport = async (format) => {
    setExporting(true);
    try {
      const result = await taskExportLogs(taskId, format);

      if (result.success) {
        // Create download link
        const blob = new Blob([result.data], {
          type: format === 'csv' ? 'text/csv' : 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Export failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Clear logs
  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all logs for this task? This cannot be undone.')) {
      return;
    }

    try {
      const result = await taskClearLogs(taskId);

      if (result.success) {
        setLogs([]);
        alert(`Deleted ${result.deleted} log entries`);
      } else {
        alert('Failed to clear logs: ' + result.error);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Failed to clear logs');
    }
  };

  // Get log icon
  const getLogIcon = (level) => {
    switch (level) {
      case 'info':
        return '•';
      case 'warn':
        return '⚠';
      case 'error':
        return '✗';
      case 'ban':
        return '🚫';
      default:
        return '•';
    }
  };

  // Get log color
  const getLogColor = (level) => {
    switch (level) {
      case 'info':
        return 'text-blue-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'ban':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Task Logs</h2>
          <div className="flex gap-2">
            {/* Export buttons */}
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || logs.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              title="Export as CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting || logs.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              title="Export as JSON"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              JSON
            </button>
            {/* Clear button */}
            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              title="Clear all logs"
            >
              <TrashIcon className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warnings</option>
              <option value="error">Errors</option>
              <option value="ban">Bans</option>
            </select>
          </div>

          {/* Limit */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Show:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span>Total: {logs.length} logs</span>
          {levelFilter !== 'all' && <span>Filtered by: {levelFilter}</span>}
          {searchTerm && <span>Search: "{searchTerm}"</span>}
        </div>
      </div>

      {/* Logs */}
      <div className="p-4 bg-gray-900 h-[500px] overflow-y-auto font-mono text-sm">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No logs found</p>
              {(searchTerm || levelFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLevelFilter('all');
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {logs.map((log) => (
              <div key={log.id} className="mb-2 flex gap-2 items-start hover:bg-gray-800/50 px-2 py-1 rounded">
                <span className="text-gray-600 text-xs mt-0.5 whitespace-nowrap">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className={`${getLogColor(log.level)} font-bold`}>
                  {getLogIcon(log.level)}
                </span>
                <span className={`${getLogColor(log.level)} uppercase text-xs mt-0.5`}>
                  {log.level}:
                </span>
                <span className="text-gray-300 flex-1 break-words">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default TaskLogs;
