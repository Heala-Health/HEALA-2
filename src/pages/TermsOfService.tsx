import React from 'react';
import { Link } from 'react-router-dom'; // Assuming Link will be needed for navigation

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-700 mb-4">
          Welcome to Heala! These Terms of Service ("Terms") govern your use of the Heala website, mobile application, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">1. Acceptance of Terms</h2>
        <p className="text-gray-700 mb-4">
          By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as any additional terms and conditions that are referenced herein or that may apply to specific features of the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2. Changes to Terms</h2>
        <p className="text-gray-700 mb-4">
          We reserve the right to modify or update these Terms at any time. We will notify you of any significant changes by posting the new Terms on the Service or by other means. Your continued use of the Service after such modifications constitutes your acceptance of the revised Terms.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3. Use of the Service</h2>
        <p className="text-gray-700 mb-4">
          The Heala Service is intended to connect users with healthcare professionals, emergency services, and health-related information in Nigeria. You agree to use the Service only for lawful purposes and in accordance with these Terms.
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>You must be at least 18 years old to use the Service, or have the consent of a parent or legal guardian.</li>
          <li>You are responsible for maintaining the confidentiality of your account information and password.</li>
          <li>You agree not to use the Service for any fraudulent or illegal activity.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">4. Disclaimer of Medical Advice</h2>
        <p className="text-gray-700 mb-4">
          The content provided through the Service, including text, graphics, images, and information, is for informational purposes only and does not constitute medical advice. Always seek the advice of a qualified healthcare professional for any medical concerns or conditions. Do not disregard professional medical advice or delay in seeking it because of something you have read on the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">5. Limitation of Liability</h2>
        <p className="text-gray-700 mb-4">
          To the fullest extent permitted by law, Heala and its affiliates, officers, employees, agents, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6. Governing Law</h2>
        <p className="text-gray-700 mb-4">
          These Terms shall be governed and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">7. Contact Us</h2>
        <p className="text-gray-700 mb-4">
          If you have any questions about these Terms, please contact us at support@heala.com.
        </p>

        <div className="mt-8 text-center">
          <Link to="/" className="text-purple-600 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
