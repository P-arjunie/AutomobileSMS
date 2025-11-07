import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer',
    employeeId: '',
    department: '',
    agreeToTerms: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (error) {
      clearError()
    }
    
    // Clear field-specific errors
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    if (!formData.password) errors.password = 'Password is required'
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeToTerms) errors.terms = 'You must agree to the terms and conditions'
    
    // Employee-specific validation
    if (formData.role === 'employee') {
      if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required'
      if (!formData.department) errors.department = 'Department is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const registrationData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phone: formData.phone.trim(),
      role: formData.role,
      ...(formData.role === 'employee' && {
        employeeId: formData.employeeId.trim(),
        department: formData.department
      })
    }

    const result = await register(registrationData)
    
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-primary-blue/30 to-primary-purple/40 p-4">
      <div className="w-full max-w-2xl">
        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-blue to-primary-purple p-6 text-center">
            <div className="inline-block p-2 bg-white rounded-full mb-2">
              <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-sm text-primary-light">Join Automobile SMS today</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="bg-primary-light p-3 rounded-lg border-2 border-primary-blue/30">
                <label className="block text-xs font-semibold text-primary-dark mb-2">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer ${formData.role === 'customer' ? 'bg-primary-purple text-white' : 'bg-white text-primary-dark hover:bg-primary-light'} border-2 border-primary-blue/30 rounded-lg p-3 transition duration-200 flex flex-col items-center`}>
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={formData.role === 'customer'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <svg className={`w-6 h-6 mb-1 ${formData.role === 'customer' ? 'text-white' : 'text-primary-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-semibold">Customer</span>
                    <span className={`text-xs ${formData.role === 'customer' ? 'text-primary-light' : 'text-primary-blue'}`}>Personal use</span>
                  </label>
                  
                  <label className={`cursor-pointer ${formData.role === 'employee' ? 'bg-primary-purple text-white' : 'bg-white text-primary-dark hover:bg-primary-light'} border-2 border-primary-blue/30 rounded-lg p-3 transition duration-200 flex flex-col items-center`}>
                    <input
                      type="radio"
                      name="role"
                      value="employee"
                      checked={formData.role === 'employee'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <svg className={`w-6 h-6 mb-1 ${formData.role === 'employee' ? 'text-white' : 'text-primary-purple'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold">Employee</span>
                    <span className={`text-xs ${formData.role === 'employee' ? 'text-primary-light' : 'text-primary-blue'}`}>Business use</span>
                  </label>
                </div>
              </div>

              {/* Employee-specific fields */}
              {formData.role === 'employee' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800">Employee Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="employeeId" className="block text-sm font-medium text-primary-dark mb-2">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        id="employeeId"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200 ${
                          formErrors.employeeId ? 'border-red-300' : 'border-primary-blue/30'
                        }`}
                        placeholder="EMP001"
                      />
                      {formErrors.employeeId && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.employeeId}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-primary-dark mb-2">
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200 ${
                          formErrors.department ? 'border-red-300' : 'border-primary-blue/30'
                        }`}
                      >
                        <option value="">Select Department</option>
                        <option value="mechanical">Mechanical</option>
                        <option value="electrical">Electrical</option>
                        <option value="bodywork">Bodywork</option>
                        <option value="painting">Painting</option>
                        <option value="inspection">Inspection</option>
                        <option value="management">Management</option>
                      </select>
                      {formErrors.department && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-primary-dark mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200 ${
                      formErrors.firstName ? 'border-red-300' : 'border-primary-blue/30'
                    }`}
                    placeholder="John"
                    required
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-primary-dark mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200 ${
                      formErrors.lastName ? 'border-red-300' : 'border-primary-blue/30'
                    }`}
                    placeholder="Doe"
                    required
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-dark mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-primary-blue/30 rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-primary-dark mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-primary-blue/30 rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary-dark mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-primary-blue/30 rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200"
                      placeholder="••••••••"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-primary-blue hover:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-primary-blue hover:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-dark mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-primary-blue/30 rounded-lg focus:ring-2 focus:ring-primary-purple focus:border-transparent transition duration-200"
                      placeholder="••••••••"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5 text-primary-blue hover:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-primary-blue hover:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 text-primary-purple focus:ring-primary-purple border-primary-blue/30 rounded cursor-pointer"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-primary-dark cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-primary-purple hover:text-primary-dark underline">
                    Terms and Conditions
                  </a>
                  {' '}and{' '}
                  <a href="#" className="font-medium text-primary-purple hover:text-primary-dark underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-blue to-primary-purple text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-purple hover:to-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transform hover:scale-[1.02] transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Error Display */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Form Errors */}
              {formErrors.terms && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
                  {formErrors.terms}
                </div>
              )}
            </form>

            {/* Sign In Link */}
            <p className="mt-4 text-center text-sm text-primary-dark">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-purple hover:text-primary-dark transition duration-200 underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-sm text-white">
          © 2025 Automobile SMS. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Register
