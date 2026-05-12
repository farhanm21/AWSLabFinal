import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import EventsPage from './pages/EventsPage';

function Router() {
  const { user } = useAuth();
  return user ? <EventsPage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
