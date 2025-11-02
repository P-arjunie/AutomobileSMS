import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// Dev-only: list all users to help debug DB writes
router.get('/users', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpire -verifyEmailToken -verifyEmailExpire')
    res.json({ count: users.length, users })
  } catch (error) {
    console.error('Debug users error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
