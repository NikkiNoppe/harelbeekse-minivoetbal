import React from 'react';
import { useAuth } from '@/components/pages/login/AuthProvider';
import AdminPollPage from './admin/polls/AdminPollPage';
import RefereePollPage from './referee/RefereePollPage';

const ScheidsrechtersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return <AdminPollPage />;
  }

  // For referees and other users, show the referee poll page
  return (
    <RefereePollPage 
      userId={user?.id || 0} 
      username={user?.username || ''} 
    />
  );
};

export default ScheidsrechtersPage;