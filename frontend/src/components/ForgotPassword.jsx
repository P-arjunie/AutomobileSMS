import React, { useState } from 'react'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword({ email })
      toast.success(res.data.message || 'If that email exists, a reset link was sent')
      setEmail('')
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send reset email'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
        <p className="text-sm text-gray-600 mb-4">Enter your account email and we'll send a password reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your.email@example.com" className="w-full border rounded px-3 py-2" />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="bg-primary-blue text-white px-4 py-2 rounded-md">{loading ? 'Sending...' : 'Send reset link'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
