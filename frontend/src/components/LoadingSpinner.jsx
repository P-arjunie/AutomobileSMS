import React from 'react'

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-primary-blue/30 to-primary-purple/40">
      <div className="text-center">
        <div className="inline-block relative">
          <div className={`${sizeClasses[size]} border-4 border-primary-blue/30 border-t-primary-blue rounded-full animate-spin`}></div>
        </div>
        <p className="mt-4 text-primary-dark font-medium">{text}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
