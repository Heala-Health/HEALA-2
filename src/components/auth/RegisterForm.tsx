
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FormFields } from './FormFields';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'patient',
    specialization: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to register user with role:', formData.role);
      
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'physician' && {
          specialization: formData.specialization,
          license_number: formData.licenseNumber
        })
      };

      console.log('User metadata:', userData);

      const { error } = await signUp(formData.email, formData.password, userData);
      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else {
          setError(error.message);
        }
        return;
      }
      
      console.log('User registration successful');
      
      // Show success message and redirect
      navigate('/auth/login', { 
        state: { 
          message: 'Registration successful! Please check your email to verify your account, then sign in.' 
        }
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <FormFields formData={formData} setFormData={setFormData} />
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
      
      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => navigate('/auth/login')}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
};
