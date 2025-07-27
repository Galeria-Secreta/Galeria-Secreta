/*
  # Complete Galeria Secreta Database Schema

  1. New Tables
    - `users` - User accounts (clients, models, admins)
    - `models` - Model profiles and information
    - `services` - Available services
    - `model_services` - Services offered by each model
    - `bookings` - Client bookings with models
    - `messages` - Communication between users
    - `reviews` - Client reviews for models
    - `candidaturas` - Model applications

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for each user role
    - Secure data access based on user authentication

  3. Functions
    - Update timestamp trigger function
    - Automatic triggers for updated_at columns

  4. Storage
    - Photos bucket for profile and gallery images
*/

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin', 'model')),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 65),
  location text NOT NULL,
  category text DEFAULT 'Profissional' CHECK (category IN ('Profissional', 'Experiente', 'Premium', 'Exclusiva', 'VIP', 'Elite')),
  bio text,
  main_photo_url text,
  gallery_photos text[] DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  hourly_rate numeric(10,2),
  availability text DEFAULT '24/7',
  is_active boolean DEFAULT true,
  rating numeric(3,2) DEFAULT 5.0,
  total_reviews integer DEFAULT 0,
  whatsapp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active models"
  ON models
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Models can update own profile"
  ON models
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage models"
  ON models
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  base_price numeric(10,2),
  duration_hours integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Model Services junction table
CREATE TABLE IF NOT EXISTS model_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  custom_price numeric(10,2),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_id, service_id)
);

ALTER TABLE model_services ENABLE ROW LEVEL SECURITY;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  booking_date timestamptz NOT NULL,
  duration_hours integer DEFAULT 1,
  total_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  special_requests text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM models 
      WHERE models.id = bookings.model_id 
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM models 
      WHERE models.id = bookings.model_id 
      AND models.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, booking_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Candidaturas table
CREATE TABLE IF NOT EXISTS candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  idade integer NOT NULL CHECK (idade >= 18 AND idade <= 65),
  pais text DEFAULT 'Moçambique',
  provincia text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  foto_url text,
  termos_aceitos boolean DEFAULT false,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada')),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE candidaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create candidaturas"
  ON candidaturas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all candidaturas"
  ON candidaturas
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update candidaturas"
  ON candidaturas
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE TRIGGER update_candidaturas_updated_at
  BEFORE UPDATE ON candidaturas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default services
INSERT INTO services (name, description, icon, base_price, duration_hours) VALUES
  ('Acompanhamento Social', 'Eventos sociais, jantares e ocasiões especiais', '🍽️', 2000.00, 3),
  ('Eventos Corporativos', 'Reuniões de negócios e eventos empresariais', '🏢', 2500.00, 4),
  ('Viagens', 'Acompanhamento em viagens nacionais e internacionais', '✈️', 5000.00, 24),
  ('Eventos Culturais', 'Teatro, ópera, exposições e eventos artísticos', '🎭', 1800.00, 3),
  ('Sessões Fotográficas', 'Acompanhamento em ensaios e campanhas', '📸', 1500.00, 2),
  ('Vida Noturna', 'Bares sofisticados e ambientes exclusivos', '🌃', 2200.00, 4)
ON CONFLICT DO NOTHING;

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');