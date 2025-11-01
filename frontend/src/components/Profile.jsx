import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header (same as dashboard) */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-blue">Automobile SMS</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                <span className="ml-2 px-2 py-1 bg-primary-blue/10 text-primary-blue rounded-full text-xs">
                  {user?.role}
                </span>
              </div>
              <Link to="/profile" className="bg-white border px-3 py-2 rounded-md text-sm text-primary-blue hover:bg-primary-light">Profile</Link>
              <button
                onClick={async () => { await logout() }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">No avatar</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload avatar</label>
              <input type="file" accept="image/*" onChange={handleAvatar} className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email (read-only)</label>
            <input name="email" value={form.email} readOnly className="mt-1 block w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
          </div>

          {form.role === 'employee' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input name="employeeId" value={form.employeeId} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input name="department" value={form.department} onChange={handleChange} className="mt-1 block w-full rounded-md border px-3 py-2" />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="bg-primary-blue text-white px-4 py-2 rounded-md">
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current password</label>
              <input type="password" value={pwState.currentPassword} onChange={(e) => setPwState(prev => ({ ...prev, currentPassword: e.target.value }))} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input type="password" value={pwState.newPassword} onChange={(e) => setPwState(prev => ({ ...prev, newPassword: e.target.value }))} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
              <input type="password" value={pwState.confirmNewPassword} onChange={(e) => setPwState(prev => ({ ...prev, confirmNewPassword: e.target.value }))} className="mt-1 block w-full rounded-md border px-3 py-2" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading} className="bg-green-600 text-white px-4 py-2 rounded-md">
                {pwLoading ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile
