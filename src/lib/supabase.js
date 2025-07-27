import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Candidaturas
  createCandidatura: async (candidaturaData) => {
    const { data, error } = await supabase
      .from('candidaturas')
      .insert([candidaturaData])
      .select()
    return { data, error }
  },

  getCandidaturas: async () => {
    const { data, error } = await supabase
      .from('candidaturas')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  updateCandidatura: async (id, updates) => {
    const { data, error } = await supabase
      .from('candidaturas')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Models
  getModels: async () => {
    const { data, error } = await supabase
      .from('models')
      .select(`
        *,
        user:users(full_name, email)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  getModelById: async (id) => {
    const { data, error } = await supabase
      .from('models')
      .select(`
        *,
        user:users(full_name, email),
        model_services(
          *,
          service:services(*)
        )
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Services
  getServices: async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')
    return { data, error }
  },

  // Bookings
  createBooking: async (bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
    return { data, error }
  },

  getUserBookings: async (userId) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        model:models(*),
        service:services(*)
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Messages
  sendMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
    return { data, error }
  },

  getConversation: async (userId1, userId2) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  // Reviews
  createReview: async (reviewData) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
    return { data, error }
  },

  getModelReviews: async (modelId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        client:users(full_name)
      `)
      .eq('model_id', modelId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// Storage helpers
export const storage = {
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  },

  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])
    return { data, error }
  }
}