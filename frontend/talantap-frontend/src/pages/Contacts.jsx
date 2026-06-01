import { useState } from 'react';
import Navbar from '../components/NavBar';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

const Contacts = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add form submission logic here
    console.log('Form submitted:', formData);
    alert('Message sent! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      value: 'dkelgenbay15@gmail.com', // PLACEHOLDER - Edit this
      link: 'mailto:dkelgenbay15@gmail.com',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone',
      value: '+7 708 373 30 65', // PLACEHOLDER - Edit this
      link: 'tel:+77083733065',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Address',
      value: '34/1 Manas Str., Almaty City, 050000', // PLACEHOLDER - Edit this
      link: '#',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Working Hours',
      value: 'Mon - Fri: 9:00 AM - 6:00 PM', // PLACEHOLDER - Edit this
      link: '#',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Have questions? We'd love to hear from you!
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="container mx-auto max-w-7xl px-4 -mt-12 relative z-20 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => (
            <a
              key={index}
              href={info.link}
              className="bg-white rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`bg-gradient-to-r ${info.color} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                {info.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{info.title}</h3>
              <p className="text-slate-600 text-sm">{info.value}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Contact Form and Info Section */}
      <div className="container mx-auto max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-2xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">Send us a Message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  placeholder="Tell us more..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div className="space-y-6">
            {/* FAQ Section */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Frequently Asked</h2>
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="font-bold text-slate-800 mb-2">How do I enroll in a club?</h3>
                  <p className="text-slate-600">
                    Browse our clubs, select one that interests you, choose a coach, and complete the enrollment process. It's that simple!
                  </p>
                </div>
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="font-bold text-slate-800 mb-2">Can I change clubs later?</h3>
                  <p className="text-slate-600">
                    Yes! You can unenroll from your current club and join a different one anytime from your profile page.
                  </p>
                </div>
                <div className="pb-4">
                  <h3 className="font-bold text-slate-800 mb-2">Are the sessions really online?</h3>
                  <p className="text-slate-600">
                    Absolutely! All our clubs meet online via video calls, making it easy to participate from anywhere.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Support Hours</h2>
              <div className="space-y-2 text-blue-100">
                <p><strong className="text-white">Monday - Friday:</strong> 9:00 AM - 6:00 PM</p>
                <p><strong className="text-white">Saturday:</strong> 10:00 AM - 4:00 PM</p>
                <p><strong className="text-white">Sunday:</strong> Closed</p>
              </div>
              <p className="mt-4 text-sm text-blue-200">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section - Placeholder */}
      <div className="container mx-auto max-w-7xl px-4 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-semibold">Map Placeholder</p>
              <p className="text-slate-500 text-sm">Our address will be here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;