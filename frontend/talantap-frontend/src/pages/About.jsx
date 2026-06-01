import Navbar from '../components/NavBar';
import { Sparkles, Target, Users, Award, Heart, Zap, BookOpen, Rocket } from 'lucide-react';
import student from '../assets/student.jpg'
import teacher from '../assets/teacher.jpg'
import community from '../assets/community.jpg'

const About = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Matching',
      description: 'Smart recommendations based on your interests and skills',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Expert Coaches',
      description: 'Learn from experienced professionals in every field',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Flexible Scheduling',
      description: 'Online sessions that fit your busy student life',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Skill Development',
      description: 'Build valuable skills while having fun',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const stats = [
    { number: '500+', label: 'Active Students' },
    { number: '8', label: 'Diverse Clubs' },
    { number: '20+', label: 'Expert Coaches' },
    { number: '95%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              About TalantTap
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Empowering students and teenagers to discover their passions through online clubs
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section with Images */}
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mb-16">
          {/* Left Image */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-blue-200 to-indigo-300 rounded-3xl overflow-hidden shadow-xl h-96">
              <img
                src={student}
                alt="Students learning"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>

          {/* Center Content */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-slate-700 mb-4 text-center leading-relaxed">
              We created TalantTap to help students and teenagers discover their passions, develop new skills, and connect with like-minded peers through engaging online clubs.
            </p>
            <p className="text-lg text-slate-700 text-center leading-relaxed">
              Our platform combines AI-powered recommendations with expert coaching to create the perfect learning experience for every student.
            </p>
          </div>

          {/* Right Image */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-purple-200 to-pink-300 rounded-3xl overflow-hidden shadow-xl h-96">
              <img
                src={teacher}
                alt="Online coaching"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300"
            >
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                {stat.number}
              </div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-slate-800 text-center mb-12">
            Why Choose TalantTap?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section with Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-2xl">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                Our Story
              </h2>
            </div>
            <div className="space-y-4 text-lg text-slate-700 leading-relaxed">
              <p>
                TalantTap was born from a simple idea: every student deserves access to quality extracurricular activities that match their interests and help them grow.
              </p>
              <p>
                We noticed that many talented teenagers struggle to find the right clubs due to location constraints, scheduling conflicts, or simply not knowing what's available.
              </p>
              <p>
                By bringing clubs online and using AI to match students with the perfect activities, we're making it easier than ever for young people to explore their passions and develop new skills.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-200 to-emerald-300 rounded-3xl overflow-hidden shadow-xl h-full min-h-96">
            <img
              src={community}
              alt="Our community"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <Zap className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of students already discovering their passions and building valuable skills through our online clubs!
            </p>
            <button
              onClick={() => window.location.href = '/clubs'}
              className="bg-white text-indigo-600 font-bold px-10 py-4 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
            >
              Explore Clubs Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;