
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      console.log('Redirecting user with role:', profile.role);
      // Redirect based on role to the correct dashboard routes
      switch (profile.role) {
        case 'patient':
          navigate('/patient?tab=appointments');
          break;
        case 'physician':
          navigate('/physician?tab=overview');
          break;
        case 'hospital_admin':
          navigate('/hospital?tab=overview');
          break;
        case 'agent':
          navigate('/agent?tab=overview');
          break;
        case 'admin':
          navigate('/admin?tab=users');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your Heala account"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
