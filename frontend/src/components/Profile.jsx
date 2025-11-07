import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'
// Header is provided by App layout (role-aware)

const Profile = () => {
  const navigate = useNavigate()
  const { user, updateProfile, logout } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    employeeId: '',
    department: '',
    avatar: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [pwState, setPwState] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        employeeId: user.employeeId || '',
        department: user.department || '',
        avatar: user.avatar || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({ ...prev, avatar: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        avatar: form.avatar,
        employeeId: form.employeeId,
        department: form.department
      }

      const result = await updateProfile(payload)
      if (result.success) {
        toast.success('Profile updated')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile save error', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!pwState.currentPassword || !pwState.newPassword) {
      toast.error('Please fill both current and new password')
      return
    }

    if (pwState.newPassword !== pwState.confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setPwLoading(true)
      const res = await authAPI.changePassword({ currentPassword: pwState.currentPassword, newPassword: pwState.newPassword })
      toast.success(res.data.message || 'Password changed')
      // Backend invalidates sessions — log the user out
      await logout()
      navigate('/login')
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to change password'
      toast.error(msg)
    } finally {
      setPwLoading(false)
      setPwState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary-blue/30 to-primary-purple/40">
      {/* header provided by App layout */}

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
          <p className="mt-2 text-sm text-gray-600">Manage your account information and settings</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary-light to-primary-purple/30 flex items-center justify-center ring-4 ring-white shadow-lg">
                {form.avatar ? (
                  <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold text-primary-blue">{form.firstName?.[0] || 'U'}</div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatar} 
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-blue hover:file:bg-primary-light cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">PNG, JPG or GIF (max. 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input 
                name="firstName" 
                value={form.firstName} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition" 
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input 
                name="lastName" 
                value={form.lastName} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition" 
                placeholder="Enter last name"
              />
            </div>
          </div>

            <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <input 
                name="email" 
                value={form.email} 
                readOnly 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed" 
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition" 
              placeholder="Enter phone number"
            />
          </div>

          {form.role === 'employee' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-6 bg-primary-light rounded-lg border border-primary-blue/20">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                <input 
                  name="employeeId" 
                  value={form.employeeId} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition bg-white" 
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input 
                  name="department" 
                  value={form.department} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition bg-white" 
                  placeholder="Enter department"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-6 py-3 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change Password Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600">Ensure your account stays secure</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
              <input 
                type="password" 
                value={pwState.currentPassword} 
                onChange={(e) => setPwState(prev => ({ ...prev, currentPassword: e.target.value }))} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input 
                type="password" 
                value={pwState.newPassword} 
                onChange={(e) => setPwState(prev => ({ ...prev, newPassword: e.target.value }))} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={pwState.confirmNewPassword} 
                onChange={(e) => setPwState(prev => ({ ...prev, confirmNewPassword: e.target.value }))} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" 
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={pwLoading} 
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {pwLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Changing...
                  </span>
                ) : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
