import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { isMockMode, API_BASE_URL } from '../services/apiClient';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signup(name, email, password);
      navigate('/citizen/dashboard');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check network connectivity or backend status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card padding="lg">
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-label-sm font-label-sm mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Civic Registration
            </div>
            <h1 className="font-display-hero text-headline-sm text-on-surface">
              Register Citizen Account
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Submit and track road repairs in your neighborhood.
            </p>
          </div>

          {!isMockMode() ? (
            <div className="mb-4 p-2.5 rounded-lg bg-primary-fixed/20 border border-primary/20 flex items-center gap-2 text-[12px] text-primary">
              <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
              <span>
                <strong>Real API Mode:</strong> Creating account at <code>{API_BASE_URL}</code>
              </span>
            </div>
          ) : null}

          {errorMessage && (
            <div className="p-3 mb-4 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-title-md text-label-md text-on-surface mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Akshit Sharma"
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <div>
              <label className="block font-title-md text-label-md text-on-surface mb-1">
                Community Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akshit.sharma@community.in"
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <div>
              <label className="block font-title-md text-label-md text-on-surface mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure passcode"
                className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Create Citizen Profile
            </Button>
          </form>

          <div className="mt-5 pt-3 border-t border-surface-container-high text-center">
            <span className="font-body-sm text-body-sm text-secondary">
              Already have an account?{' '}
            </span>
            <Link to="/login" className="font-title-md text-label-md text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
