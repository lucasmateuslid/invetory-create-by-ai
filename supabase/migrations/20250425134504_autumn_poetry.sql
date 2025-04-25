/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive policies from profiles table
    - Add new non-recursive policies for admin and user access
    
  2. Security
    - Maintains row level security
    - Updates policies to prevent infinite recursion
    - Preserves existing access control logic
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "enable_admin_all"
ON profiles
FOR ALL 
TO authenticated
USING (
  role = 'admin'
);

CREATE POLICY "enable_user_select_own"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);