import { useState } from 'react';
import { submitAuthRequest } from '../services/authApi';

const initialForm = {
  username: '',
  email: '',
  name: '',
  password: '',
  mobile: '',
  role: 'Seeker',
  address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
};

export function useAuthForm() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [form, setForm] = useState(initialForm);

  const isRegistering = mode === 'register';

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (['street', 'city', 'state', 'zipCode', 'country'].includes(name)) {
        return { ...current, address: { ...current.address, [name]: value } };
      }
      return { ...current, [name]: value };
    });
    setFeedback(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFeedback(null);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await submitAuthRequest(mode, form);
      if (response.data.accessToken) localStorage.setItem('accessToken', response.data.accessToken);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
      }
      setFeedback({ type: 'success', text: response.data.message || 'You are all set.' });

      if (isRegistering) {
        setMode('login');
        setForm((current) => ({ ...current, password: '' }));
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'We could not complete that request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setFeedback(null);
    setMode('login');
  };

  return {
    feedback,
    form,
    currentUser,
    isRegistering,
    isSubmitting,
    mode,
    showPassword,
    setShowPassword,
    signOut,
    submitForm,
    switchMode,
    updateField,
  };
}
