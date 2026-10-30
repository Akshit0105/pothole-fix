import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
      <Card padding="lg" className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">wrong_location</span>
        </div>
        <h1 className="font-display-hero text-headline-sm text-on-surface">404 - Page Not Found</h1>
        <p className="font-body-sm text-body-sm text-secondary">
          The requested road infrastructure portal route does not exist.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="md">
              Return to Public Overview
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
