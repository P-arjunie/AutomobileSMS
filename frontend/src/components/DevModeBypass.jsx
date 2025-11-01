import React from 'react';
import { Link } from 'react-router-dom';

// Development Mode Bypass - Allows viewing admin pages without authentication
// ⚠️ REMOVE THIS IN PRODUCTION! This is only for development/testing purposes.

const DevModeBypass = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Development Mode</h1>
          <p className="text-gray-600">
            You can view the admin pages without authentication.
            <br />
            <span className="text-red-600 font-semibold">⚠️ This is for development only!</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dev/admin/dashboard"
            className="block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition duration-200"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
            </div>
            <p className="text-sm text-gray-600">View statistics and overview</p>
          </Link>

          <Link
            to="/dev/admin/appointments"
            className="block p-6 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition duration-200"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
            </div>
            <p className="text-sm text-gray-600">Manage all appointments</p>
          </Link>

          <Link
            to="/dev/admin/services"
            className="block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition duration-200"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">All Services</h3>
            </div>
            <p className="text-sm text-gray-600">View all service projects</p>
          </Link>

          <Link
            to="/dev/admin/reports"
            className="block p-6 bg-orange-50 hover:bg-orange-100 rounded-lg border-2 border-orange-200 transition duration-200"
          >
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
            </div>
            <p className="text-sm text-gray-600">Generate and export reports</p>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> API calls may fail without a backend server running. 
            The pages will still render, but data loading will show errors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevModeBypass;

