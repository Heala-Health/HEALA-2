import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                <span className="text-2xl font-bold text-purple-800">Heala</span>
              </div>
             <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600">Contact Us</Link>
              <Link to="/privacy-policy" className="text-gray-600 hover:text-purple-600">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</Link>
            
            </div>
            <div className="space-x-4">
              <Link to="/auth/login" className="border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-md text-sm font-medium">Sign In</Link>
              <Link to="/auth/register" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Privacy Policy Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Privacy Policy</h1>
        <p className="text-lg text-gray-700 mb-4">
          At Heala, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-lg text-gray-700 mb-4">
          We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 ml-4">
          <li><span className="font-semibold">Personal Data:</span> Name, email address, phone number, medical history, and other health-related information.</li>
          <li><span className="font-semibold">Usage Data:</span> Information about how you access and use the website, such as your IP address, browser type, and operating system.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-lg text-gray-700 mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 ml-4">
          <li>Provide, operate, and maintain our services.</li>
          <li>Improve, personalize, and expand our services.</li>
          <li>Understand and analyze how you use our services.</li>
          <li>Develop new products, services, features, and functionality.</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
          <li>Process your transactions and manage your appointments.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Disclosure of Your Information</h2>
        <p className="text-lg text-gray-700 mb-4">
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 ml-4">
          <li><span className="font-semibold">With Your Consent:</span> We may disclose your personal information for any purpose with your consent.</li>
          <li><span className="font-semibold">To Service Providers:</span> We may share your information with third-party service providers that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
          <li><span className="font-semibold">For Legal Reasons:</span> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Security of Your Information</h2>
        <p className="text-lg text-gray-700 mb-4">
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Privacy Rights</h2>
        <p className="text-lg text-gray-700 mb-4">
          Depending on your location, you may have the following rights regarding your personal information:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 ml-4">
          <li>The right to access, update, or delete the information we have on you.</li>
          <li>The right to object to our processing of your personal information.</li>
          <li>The right to request that we restrict the processing of your personal information.</li>
          <li>The right to data portability.</li>
          <li>The right to withdraw consent.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Changes to This Privacy Policy</h2>
        <p className="text-lg text-gray-700 mb-4">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
        <p className="text-lg text-gray-700 mb-4">
          If you have any questions about this Privacy Policy, please contact us:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 ml-4">
          <li>By email: support@heala.com</li>
          <li>By visiting this page on our website: <Link to="/contact" className="text-purple-600 hover:underline">Contact Us</Link></li>
        </ul>
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
              <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
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

export default PrivacyPolicy;
