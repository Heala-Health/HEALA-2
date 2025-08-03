
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Stethoscope, Calendar, Users, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import HEALAappImage from "@/images/HEALAapp.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
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
                <span className="text-2xl font-bold text-purple-800"></span>
              </Link>
              <Link to="/" className="text-gray-600 hover:text-purple-600">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-purple-600">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-purple-600">Contact Us</Link>
              <Link to="/privacy-policy" className="text-gray-600 hover:text-purple-600">Privacy Policy</Link>
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

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
              alt="Heala" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Revolutionizing Healthcare Access in <span className="text-purple-600">Nigeria</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            In a country where healthcare access is a challenge, Heala connects you with verified Nigerian health professionals, emergency services, and personalized care recommendations.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register")}
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3"
            >
              Access Quality Care Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth/login")}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-lg text-gray-600">
              Addressing Nigeria's healthcare challenges with innovative technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Stethoscope className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <CardTitle>Connect with Verified Nigerian Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Access a network of licensed Nigerian physicians and specialists
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Book Appointments with Nearby Hospitals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Find and schedule appointments at hospitals and clinics near you
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <CardTitle>Access Emergency Care in Critical Situations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Get immediate help with 24/7 emergency services and ambulance dispatch
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Get Assistance from Trained Health Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Receive personalized support from our trained health agents, especially for those with limited digital literacy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* App Promotion Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <img src={HEALAappImage} alt="Heala App" className="w-full h-auto object-contain" />
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Download the Heala App</h2>
              <p className="text-lg text-gray-600 mb-8">
                Experience seamless healthcare access with the Heala app. Book appointments, connect with doctors, and manage your health on the go.
              </p>
              <a
                href="https://play.google.com/store/apps/details?id=com.heala.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-3 bg-purple-600 text-white text-lg font-medium rounded hover:bg-purple-700"
              >
                Download Heala App
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            The Nigerian Healthcare Crisis
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-purple-600">1:2,500</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Doctor to patient ratio in Nigeria, far below the WHO recommendation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-purple-600">20%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Of global maternal deaths occur in Nigeria</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-purple-600">151</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Preventable deaths in a recent meningitis outbreak</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <p className="text-xl text-gray-600 mb-4">
              Heala is committed to addressing these challenges through technology and innovation.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth/register")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Join Us in Making a Difference
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Movement to Transform Nigerian Healthcare
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Thousands of Nigerians are already experiencing better healthcare access. Join them today.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth/register")}
            className="bg-white text-purple-600 hover:bg-gray-50 text-lg px-8 py-3"
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                  alt="Heala" 
                  className="h-8 w-auto mr-3"
                />
                <span className="text-2xl font-bold"></span>
              </Link>
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

export default Index;
