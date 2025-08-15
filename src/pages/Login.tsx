
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login useEffect - loading:', loading, 'user:', !!user, 'profile:', !!profile, 'role:', profile?.role);
    
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
          console.log('Unknown role, redirecting to home');
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

  // If user is logged in but has no profile, show a message with retry option
  if (user && !profile && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-yellow-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 mb-4">
            Your account exists but your profile needs to be set up. This should happen automatically. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-2"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/auth/register')} 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Complete Setup
          </button>
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
