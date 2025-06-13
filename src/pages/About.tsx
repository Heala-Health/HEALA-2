import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
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

      {/* About Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">About Heala</h1>
        <p className="text-lg text-gray-700 mb-4">
          Heala is a pioneering healthcare platform dedicated to transforming healthcare access in Nigeria. Our mission is to bridge the significant healthcare gap by connecting individuals with verified Nigerian health professionals, emergency services, and personalized care recommendations.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          In a country where healthcare challenges are prevalent, Heala leverages innovative technology to provide seamless and reliable access to quality medical care. We believe that everyone deserves timely and effective healthcare, regardless of their location or digital literacy.
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4 text-center">Our Vision</h2>
        <p className="text-lg text-gray-700 mb-4">
          To create a healthier Nigeria where quality healthcare is a right, not a privilege. We envision a future where every Nigerian can easily access the medical attention they need, fostering a healthier and more productive society.
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4 text-center">Our Values</h2>
        <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
          <li><span className="font-semibold">Accessibility:</span> Ensuring healthcare is within reach for all.</li>
          <li><span className="font-semibold">Quality:</span> Connecting users with verified and highly-rated professionals.</li>
          <li><span className="font-semibold">Innovation:</span> Utilizing technology to solve complex healthcare problems.</li>
          <li><span className="font-semibold">Compassion:</span> Providing care with empathy and understanding.</li>
          <li><span className="font-semibold">Integrity:</span> Operating with transparency and trustworthiness.</li>
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

export default About;
