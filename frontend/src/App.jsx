import './App.css';
import AuthPanel from './components/AuthPanel';
import BrandPanel from './components/BrandPanel';
import HirerPage from './components/HirerPage';
import { useAuthForm } from './hooks/useAuthForm';

function App() {
  const auth = useAuthForm();

  if (auth.currentUser?.role === 'Seeker') {
    return <HirerPage user={auth.currentUser} onSignOut={auth.signOut} />;
  }

  return (
    <main className="auth-shell">
      <BrandPanel />
      <AuthPanel auth={auth} />
    </main>
  );
}

export default App;
