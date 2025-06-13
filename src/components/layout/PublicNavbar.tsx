import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const PublicNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                alt="Heala" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-purple-800">Heala</span>
            </Link>
            <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
            <Link to="/about" className="text-gray-600 hover:text-purple-600">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-purple-600">Contact Us</Link>
            <Link to="/privacy-policy" className="text-gray-600 hover:text-purple-600">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-purple-600">Terms of Service</Link>
          </div>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/auth/login")}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth/register")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
