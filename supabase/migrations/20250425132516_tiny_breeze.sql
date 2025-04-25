/*
  # Criação do schema inicial do sistema de inventário
  
  1. Novas Tabelas
     - `categorias` - Categorias de equipamentos
     - `profiles` - Perfis de usuários com informações adicionais
     - `equipamentos` - Registro de equipamentos do inventário
     - `movimentacoes` - Registro de entradas e saídas de equipamentos
  
  2. Segurança
     - Habilitação de RLS em todas as tabelas
     - Políticas para controle de acesso por perfil de usuário
*/

-- Criação da tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criação da tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Criação da tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipamentos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  num_serie TEXT NOT NULL UNIQUE,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
  data_aquisicao DATE NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Criação da tabela de movimentações
CREATE TABLE IF NOT EXISTS movimentacoes (
  id SERIAL PRIMARY KEY,
  equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id UUID NOT NULL REFERENCES profiles(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criação de um trigger para atualizar a quantidade no equipamento
CREATE OR REPLACE FUNCTION atualizar_quantidade_equipamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE equipamentos SET quantidade = quantidade + NEW.quantidade WHERE id = NEW.equipamento_id;
  ELSIF NEW.tipo = 'saida' THEN
    UPDATE equipamentos SET quantidade = quantidade - NEW.quantidade WHERE id = NEW.equipamento_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_quantidade
AFTER INSERT ON movimentacoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_quantidade_equipamento();

-- Definir políticas de segurança (RLS)

-- Habilitar RLS para todas as tabelas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar perfis"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para categorias
CREATE POLICY "Todos usuários autenticados podem ver categorias"
  ON categorias
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem inserir categorias"
  ON categorias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar categorias"
  ON categorias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para equipamentos
CREATE POLICY "Todos usuários autenticados podem ver equipamentos"
  ON equipamentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar equipamentos"
  ON equipamentos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Políticas para movimentações
CREATE POLICY "Todos usuários autenticados podem ver movimentações"
  ON movimentacoes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem registrar movimentações"
  ON movimentacoes
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem atualizar movimentações"
  ON movimentacoes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Função para criar um perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (new.id, new.email, 'usuario');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER trigger_criar_perfil_apos_cadastro
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.criar_perfil_usuario();

-- Inserir categorias iniciais
INSERT INTO categorias (nome, descricao)
VALUES 
  ('Informática', 'Equipamentos relacionados a computadores e periféricos'),
  ('Ferramentas', 'Ferramentas manuais e elétricas'),
  ('Escritório', 'Material de escritório e mobiliário'),
  ('Eletrônicos', 'Equipamentos eletrônicos diversos')
ON CONFLICT DO NOTHING;