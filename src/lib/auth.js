import { auth } from './supabase.js'

class AuthManager {
  constructor() {
    this.currentUser = null
    this.authCallbacks = []
    this.init()
  }

  async init() {
    // Get initial user
    const { data: { user } } = await auth.getCurrentUser()
    this.currentUser = user
    
    // Listen for auth changes
    auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null
      this.notifyCallbacks(event, session)
      this.updateUI()
    })
    
    this.updateUI()
  }

  onAuthStateChange(callback) {
    this.authCallbacks.push(callback)
    return () => {
      const index = this.authCallbacks.indexOf(callback)
      if (index > -1) {
        this.authCallbacks.splice(index, 1)
      }
    }
  }

  notifyCallbacks(event, session) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(event, session)
      } catch (error) {
        console.error('Auth callback error:', error)
      }
    })
  }

  updateUI() {
    const loginBtn = document.getElementById('login-btn')
    const signupBtn = document.getElementById('signup-btn')
    const navActions = document.querySelector('.nav-actions')
    
    if (this.currentUser) {
      // User is logged in
      if (loginBtn) loginBtn.style.display = 'none'
      if (signupBtn) signupBtn.style.display = 'none'
      
      // Add user menu if not exists
      let userMenu = document.getElementById('user-menu')
      if (!userMenu && navActions) {
        userMenu = document.createElement('div')
        userMenu.id = 'user-menu'
        userMenu.className = 'user-menu'
        userMenu.innerHTML = `
          <button class="nav-action-btn user-btn" id="user-btn">
            <span class="action-icon">👤</span>
            <span>${this.currentUser.user_metadata?.full_name || this.currentUser.email}</span>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a href="#" id="profile-link">Meu Perfil</a>
            <a href="#" id="bookings-link">Minhas Reservas</a>
            <a href="#" id="messages-link">Mensagens</a>
            <hr>
            <a href="#" id="logout-link">Sair</a>
          </div>
        `
        navActions.appendChild(userMenu)
        
        // Setup user menu events
        this.setupUserMenu()
      }
    } else {
      // User is not logged in
      if (loginBtn) loginBtn.style.display = 'flex'
      if (signupBtn) signupBtn.style.display = 'flex'
      
      // Remove user menu
      const userMenu = document.getElementById('user-menu')
      if (userMenu) {
        userMenu.remove()
      }
    }
  }

  setupUserMenu() {
    const userBtn = document.getElementById('user-btn')
    const userDropdown = document.getElementById('user-dropdown')
    const logoutLink = document.getElementById('logout-link')
    
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        userDropdown.classList.toggle('show')
      })
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdown.classList.remove('show')
      })
    }
    
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault()
        await this.signOut()
      })
    }
  }

  async signUp(email, password, userData) {
    try {
      const { data, error } = await auth.signUp(email, password, userData)
      
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  async signOut() {
    try {
      const { error } = await auth.signOut()
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  isAuthenticated() {
    return !!this.currentUser
  }

  getUser() {
    return this.currentUser
  }

  getUserId() {
    return this.currentUser?.id
  }
}

export const authManager = new AuthManager()