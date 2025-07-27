import { db, storage } from './supabase.js'
import { authManager } from './auth.js'

export class DatabaseManager {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Candidaturas
  async submitCandidatura(formData) {
    try {
      // Upload photo if provided
      let fotoUrl = null
      const fotoFile = formData.get('foto')
      
      if (fotoFile && fotoFile.size > 0) {
        const fileName = `candidaturas/${Date.now()}_${fotoFile.name}`
        const { data: uploadData, error: uploadError } = await storage.uploadFile(
          'photos',
          fileName,
          fotoFile
        )
        
        if (uploadError) throw uploadError
        
        fotoUrl = storage.getPublicUrl('photos', fileName)
      }

      // Prepare candidatura data
      const candidaturaData = {
        nome: formData.get('nome'),
        idade: parseInt(formData.get('idade')),
        pais: formData.get('pais') || 'Moçambique',
        provincia: formData.get('provincia'),
        email: formData.get('email'),
        whatsapp: formData.get('whatsapp'),
        foto_url: fotoUrl,
        termos_aceitos: formData.get('termos') === 'on',
        status: 'pendente'
      }

      const { data, error } = await db.createCandidatura(candidaturaData)
      
      if (error) throw error

      // Clear cache
      this.clearCache('candidaturas')
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Submit candidatura error:', error)
      return { success: false, error: error.message }
    }
  }

  async getCandidaturas() {
    try {
      const cacheKey = 'candidaturas_list'
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getCandidaturas()
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get candidaturas error:', error)
      return { success: false, error: error.message }
    }
  }

  // Models
  async getModels() {
    try {
      const cacheKey = 'models_list'
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getModels()
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get models error:', error)
      return { success: false, error: error.message }
    }
  }

  async getModelById(id) {
    try {
      const cacheKey = `model_${id}`
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getModelById(id)
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get model error:', error)
      return { success: false, error: error.message }
    }
  }

  // Services
  async getServices() {
    try {
      const cacheKey = 'services_list'
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getServices()
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get services error:', error)
      return { success: false, error: error.message }
    }
  }

  // Bookings
  async createBooking(bookingData) {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Deve estar logado para fazer uma reserva')
      }

      const booking = {
        ...bookingData,
        client_id: authManager.getUserId(),
        status: 'pending'
      }

      const { data, error } = await db.createBooking(booking)
      
      if (error) throw error

      // Clear cache
      this.clearCache('bookings')
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Create booking error:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserBookings() {
    try {
      if (!authManager.isAuthenticated()) {
        return { success: true, data: [] }
      }

      const userId = authManager.getUserId()
      const cacheKey = `user_bookings_${userId}`
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getUserBookings(userId)
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get user bookings error:', error)
      return { success: false, error: error.message }
    }
  }

  // Messages
  async sendMessage(receiverId, content, bookingId = null) {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Deve estar logado para enviar mensagens')
      }

      const messageData = {
        sender_id: authManager.getUserId(),
        receiver_id: receiverId,
        content,
        booking_id: bookingId
      }

      const { data, error } = await db.sendMessage(messageData)
      
      if (error) throw error

      // Clear conversation cache
      this.clearCache('messages')
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, error: error.message }
    }
  }

  async getConversation(userId) {
    try {
      if (!authManager.isAuthenticated()) {
        return { success: true, data: [] }
      }

      const currentUserId = authManager.getUserId()
      const cacheKey = `conversation_${currentUserId}_${userId}`
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getConversation(currentUserId, userId)
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get conversation error:', error)
      return { success: false, error: error.message }
    }
  }

  // Reviews
  async createReview(modelId, bookingId, rating, comment, isAnonymous = false) {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Deve estar logado para deixar uma avaliação')
      }

      const reviewData = {
        client_id: authManager.getUserId(),
        model_id: modelId,
        booking_id: bookingId,
        rating,
        comment,
        is_anonymous: isAnonymous
      }

      const { data, error } = await db.createReview(reviewData)
      
      if (error) throw error

      // Clear cache
      this.clearCache('reviews')
      this.clearCache(`model_${modelId}`)
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Create review error:', error)
      return { success: false, error: error.message }
    }
  }

  async getModelReviews(modelId) {
    try {
      const cacheKey = `model_reviews_${modelId}`
      const cached = this.getCache(cacheKey)
      if (cached) return { success: true, data: cached }

      const { data, error } = await db.getModelReviews(modelId)
      
      if (error) throw error

      this.setCache(cacheKey, data)
      return { success: true, data }
    } catch (error) {
      console.error('Get model reviews error:', error)
      return { success: false, error: error.message }
    }
  }
}

export const dbManager = new DatabaseManager()