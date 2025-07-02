import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken, user } = response.data;
        const { userId, username, firstName, lastName, role, email: userEmail, tenantId, createdBy, phoneNumber } = user;

        // ✅ Store in Zustand (also updates sessionStorage)
        login({ userId, username, firstName, lastName, email: userEmail, role, tenantId, createdBy, phoneNumber, accessToken, refreshToken });

        // ✅ Set axios default for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('loggedIn', 'true');

        // ✅ Navigate
        navigate('/');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
