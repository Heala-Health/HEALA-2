
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Stethoscope, Calendar, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                alt="Heala" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold text-purple-800"></span>
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
            Your Health, <span className="text-purple-600">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with healthcare professionals, book appointments, access emergency services, 
            and manage your health journey all in one comprehensive platform.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register")}
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3"
            >
              Start Your Health Journey
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
              Everything you need for your health and wellness in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Stethoscope className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <CardTitle>Expert Physicians</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Connect with qualified healthcare professionals and specialists
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Book appointments online with your preferred healthcare providers
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <CardTitle>Emergency Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  24/7 emergency support and ambulance services when you need them most
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <CardTitle>Personal Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Dedicated agents to help you navigate your healthcare journey
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of users who trust Heala for their healthcare needs
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-8">
            <img 
              src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
              alt="Heala" 
              className="h-8 w-auto mr-3"
            />
            <span className="text-2xl font-bold">Heala</span>
          </div>
          <p className="text-gray-400">
            © 2025 Heala. All rights reserved. Your health, our priority.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
