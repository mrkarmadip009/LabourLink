import './App.css';
import AuthPanel from './components/AuthPanel';
import BrandPanel from './components/BrandPanel';
import HirerPage from './components/HirerPage';
import LabourSearchPage from './components/LabourSearchPage';
import BookingsPage from './components/BookingsPage';
import ProfilePage from './components/ProfilePage';
import ProviderPage from './components/ProviderPage';
import { useAuthForm } from './hooks/useAuthForm';
import { useState } from 'react';

function App() {
  const auth = useAuthForm();
  const [page, setPage] = useState('dashboard');

  if (auth.currentUser) {
    const commonProps = {
      user: auth.currentUser,
      currentPage: page,
      onNavigate: setPage,
      onSignOut: auth.signOut,
    };

    if (auth.currentUser.role === 'Provider') {
      return page === 'profile' ? <ProfilePage {...commonProps} /> : <ProviderPage {...commonProps} />;
    }

    if (page === 'find') return <LabourSearchPage {...commonProps} />;
    if (page === 'bookings') return <BookingsPage {...commonProps} />;
    if (page === 'profile') return <ProfilePage {...commonProps} />;
    return <HirerPage {...commonProps} />;
  }

  return (
    <main className="auth-shell">
      <BrandPanel />
      <AuthPanel auth={auth} />
    </main>
  );
}

export default App;
