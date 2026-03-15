import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import { authIsAuthenticated, authGetUser, authCheckStatus, waGetStatus, taskPause } from './lib/ipc';
import Layout from './components/Layout';
import Login from './pages/Login';
import WhatsAppAuth from './pages/WhatsAppAuth';
import Dashboard from './pages/Dashboard';
import NewTask from './pages/NewTask';
import Monitor from './pages/Monitor';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AccountInactive from './pages/AccountInactive';

// Protected Route Component (requires auth and active account)
function ProtectedRoute({ children, skipActiveCheck = false }) {
  const { isLoggedIn, isActive } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if account is active (unless explicitly skipped)
  if (!skipActiveCheck && !isActive) {
    return <AccountInactive />;
  }

  return children;
}

// Dashboard Route (requires auth + WhatsApp check on first load only)
function DashboardRoute({ children }) {
  const { isLoggedIn, isActive } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only check once when component first mounts
    if (checkedOnce) return;

    const checkWAStatus = async () => {
      if (!isLoggedIn) {
        navigate('/login');
        return;
      }

      try {
        const waStatus = await waGetStatus();
        // Only redirect if WhatsApp is completely disconnected, not if it's connecting
        if (!waStatus.success || (!waStatus.isConnected && waStatus.status !== 'connecting' && waStatus.status !== 'reconnecting')) {
          navigate('/wa-auth');
        }
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
      } finally {
        setChecking(false);
        setCheckedOnce(true);
      }
    };

    checkWAStatus();
  }, [isLoggedIn, navigate, checkedOnce]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking WhatsApp connection...</p>
        </div>
      </div>
    );
  }

  // Show AccountInactive if account is not active
  if (!isActive) {
    return <AccountInactive />;
  }

  return children;
}

function App() {
  const [loading, setLoading] = useState(true);
  const { login, isLoggedIn, updateUser, setActive, isActive } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const authResult = await authIsAuthenticated();

        if (authResult.success && authResult.isAuthenticated) {
          // Get user data
          const userResult = await authGetUser();

          if (userResult.success && userResult.user) {
            // Update auth store
            login(userResult.user, 'token');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [login]);

  // Periodic account status check (every 5 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkAccountStatus = async () => {
      try {
        const result = await authCheckStatus();

        if (result.success) {
          const wasActive = isActive;
          const nowActive = result.isActive;

          // Update user data
          if (result.user) {
            updateUser(result.user);
          }

          // If account became inactive, pause any running tasks
          if (wasActive && !nowActive) {
            console.log('Account became inactive, pausing tasks...');
            try {
              await taskPause();
            } catch (error) {
              console.error('Error pausing task:', error);
            }
          }

          // Update active status
          setActive(nowActive);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    // Check immediately on mount
    checkAccountStatus();

    // Then check every 5 minutes (300000 ms)
    const intervalId = setInterval(checkAccountStatus, 300000);

    return () => clearInterval(intervalId);
  }, [isLoggedIn, isActive, updateUser, setActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/wa-auth" replace /> : <Login />} />
        <Route
          path="/wa-auth"
          element={
            <ProtectedRoute>
              <WhatsAppAuth />
            </ProtectedRoute>
          }
        />

        {/* Main app routes with Layout */}
        <Route
          element={
            <DashboardRoute>
              <Layout />
            </DashboardRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-task" element={<NewTask />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
