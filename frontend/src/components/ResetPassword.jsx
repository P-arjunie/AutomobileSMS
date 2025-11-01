import React, { useState, useEffect } from 'react'
import { authAPI } from '../utils/api'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const useQuery = () => new URLSearchParams(useLocation().search)

const ResetPassword = () => {
  const query = useQuery()
  const navigate = useNavigate()
  const tokenFromQuery = query.get('token')

  const [token, setToken] = useState(tokenFromQuery || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tokenFromQuery) setToken(tokenFromQuery)
  }, [tokenFromQuery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')

    try {
      setLoading(true)
      const res = await authAPI.resetPassword({ token, newPassword })
      toast.success(res.data.message || 'Password reset successful')
      navigate('/login')
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste token here" className="w-full border rounded px-3 py-2" />
          )}
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="New password" className="w-full border rounded px-3 py-2" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm new password" className="w-full border rounded px-3 py-2" />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="bg-primary-blue text-white px-4 py-2 rounded-md">{loading ? 'Resetting...' : 'Reset Password'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
