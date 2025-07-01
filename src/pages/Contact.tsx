import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                  alt="Heala" 
                  className="h-8 w-auto"
                />
                <span className="text-2xl font-bold text-purple-800"></span>
              </div>
                                     <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
                                      <Link to="/about" className="text-gray-600 hover:text-purple-600">About</Link>
                                      <Link to="/contact" className="text-gray-600 hover:text-purple-600">Contact Us</Link>
                                      <Link to="/privacy-policy" className="text-gray-600 hover:text-purple-600">Privacy Policy</Link>
                                      <Link to="/terms-of-service" className="text-gray-400 hover:text-purple-600">Terms of Service</Link>
            </div>
            <div className="space-x-4">
              <Link to="/auth/login" className="border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-md text-sm font-medium">Sign In</Link>
              <Link to="/auth/register" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contact Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Contact Us</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          We'd love to hear from you! Whether you have a question about our services, need support, or want to provide feedback, please don't hesitate to reach out.
        </p>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <Mail className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h2>
            <p className="text-gray-700">support@heala.com</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <Phone className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h2>
            <p className="text-gray-700">+234 700 123 4567</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
            <MapPin className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Visit Us</h2>
            <p className="text-gray-700">123 Healthcare Street, Abuja, Nigeria</p>
          </div>
        </div>

        <div className="mt-16 p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send Us a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-lg"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-lg"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-gray-700">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-lg"
                placeholder="Your message here..."
              ></textarea>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                alt="Heala" 
                className="h-8 w-auto mr-3"
              />
              <span className="text-2xl font-bold">Heala</span>
            </div>
            <div className="space-x-6">
                          <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600">Contact Us</Link>
              <Link to="/privacy-policy" className="text-gray-600 hover:text-purple-600">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</Link>
          
            </div>
          </div>
          <p className="text-center text-gray-400 mb-4">
            Our mission is to bridge the healthcare gap in Nigeria by providing accessible, quality care to all.
          </p>
          <p className="text-center text-gray-400">
            © 2025 Heala. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
