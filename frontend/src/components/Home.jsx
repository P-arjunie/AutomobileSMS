import React from 'react'
import { Link } from 'react-router-dom'

const Home = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary-blue/20 to-primary-purple/30">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-primary-blue mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="text-xl font-bold text-primary-dark">Automobile SMS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-primary-dark hover:text-primary-blue transition duration-200">
                Dashboard
              </Link>
              <Link to="/appointments/book" className="text-primary-dark hover:text-primary-blue transition duration-200">
                Appointments
              </Link>
              <Link to="#" className="text-primary-dark hover:text-primary-blue transition duration-200">
                Vehicles
              </Link>
              <Link to="#" className="text-primary-dark hover:text-primary-blue transition duration-200">
                Messages
              </Link>
              <button 
                onClick={onLogout}
                className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-purple transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-primary-dark leading-tight">
              Welcome to <span className="text-primary-blue">Automobile SMS</span>
            </h1>
            <p className="text-xl text-gray-600">
              Manage your vehicle fleet efficiently with real-time monitoring, SMS notifications, and comprehensive tracking.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <div className="text-3xl font-bold text-primary-blue">150+</div>
                <div className="text-sm text-gray-600 mt-1">Vehicles</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <div className="text-3xl font-bold text-primary-purple">5K+</div>
                <div className="text-sm text-gray-600 mt-1">Messages</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <div className="text-3xl font-bold text-primary-blue">99%</div>
                <div className="text-sm text-gray-600 mt-1">Uptime</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-8">
              <button className="bg-gradient-to-r from-primary-blue to-primary-purple text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200">
                Add Vehicle
              </button>
              <button className="bg-white text-primary-blue border-2 border-primary-blue px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition duration-200">
                View Reports
              </button>
            </div>
          </div>

          {/* Right Content - Car Image */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Car Mechanic Image */}
              <img 
                src="/homeimage.jpg" 
                alt="Automobile Service" 
                className="w-full h-auto object-cover rounded-3xl"
              />
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg backdrop-blur-sm bg-white/90">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-primary-dark">Live Monitoring</span>
                </div>
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-blue/20 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition duration-200">
            <div className="bg-primary-blue/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-dark mb-2">Real-time Analytics</h3>
            <p className="text-gray-600">Monitor vehicle performance and driver behavior with live data updates.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition duration-200">
            <div className="bg-primary-purple/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-dark mb-2">SMS Notifications</h3>
            <p className="text-gray-600">Instant alerts for maintenance, incidents, and important updates.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition duration-200">
            <div className="bg-primary-blue/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-dark mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
