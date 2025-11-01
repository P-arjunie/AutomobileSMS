import React, { useEffect, useState } from 'react'
import { authAPI } from '../utils/api'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const useQuery = () => new URLSearchParams(useLocation().search)

const VerifyEmail = () => {
  const query = useQuery()
  const navigate = useNavigate()
  const tokenFromQuery = query.get('token')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const verify = async () => {
      const token = tokenFromQuery
      if (!token) return
      try {
        setLoading(true)
        const res = await authAPI.verifyEmail({ token })
        toast.success(res.data.message || 'Email verified')
        navigate('/login')
      } catch (error) {
        const msg = error.response?.data?.message || 'Failed to verify email'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [tokenFromQuery])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? <p>Verifying...</p> : <p>If you were redirected here, verification will be processed shortly.</p>}
      </div>
    </div>
  )
}

export default VerifyEmail
