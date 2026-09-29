import axios from 'axios';

export const submitAuthRequest = (mode, form) => {
  const endpoint = mode === 'register' ? '/api/users' : '/api/users/login';
  const payload = mode === 'register' ? form : { username: form.username, password: form.password };

  return axios.post(endpoint, payload, { withCredentials: true });
};
