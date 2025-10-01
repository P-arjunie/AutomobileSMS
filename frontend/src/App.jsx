import React, { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'

function App() {
  const [currentPage, setCurrentPage] = useState('login') // 'login', 'register', or 'home'

  const switchToRegister = () => {
    setCurrentPage('register')
  }

  const switchToLogin = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('home')
  }

  const handleLogout = () => {
    setCurrentPage('login')
  }

  return (
    <div className="App">
      {currentPage === 'login' ? (
        <Login 
          onSwitchToRegister={switchToRegister} 
          onLoginSuccess={handleLoginSuccess}
        />
      ) : currentPage === 'register' ? (
        <Register onSwitchToLogin={switchToLogin} />
      ) : (
        <Home onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
