/*
  # Create orders table and related structures
  
  1. New Tables
    - `pedidos` - Store order information
      - id (uuid, primary key)
      - fabricante (text, not null)
      - data_aquisicao (date, not null)
      - codigo_rastreamento (text)
      - criado_por (uuid, foreign key users)
      - data_criacao (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabricante TEXT NOT NULL,
  data_aquisicao DATE NOT NULL,
  codigo_rastreamento TEXT,
  criado_por UUID NOT NULL REFERENCES auth.users(id),
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view all orders"
  ON pedidos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create orders"
  ON pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Admins can update orders"
  ON pedidos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );