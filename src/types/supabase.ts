export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: number
          nome: string
          descricao: string | null
          created_at: string
        }
        Insert: {
          id?: number
          nome: string
          descricao?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          nome?: string
          descricao?: string | null
          created_at?: string
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          id: number
          nome: string
          num_serie: string
          categoria_id: number
          quantidade: number
          data_aquisicao: string
          descricao: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          nome: string
          num_serie: string
          categoria_id: number
          quantidade: number
          data_aquisicao: string
          descricao?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          nome?: string
          num_serie?: string
          categoria_id?: number
          quantidade?: number
          data_aquisicao?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          }
        ]
      }
      movimentacoes: {
        Row: {
          id: number
          equipamento_id: number
          tipo: 'entrada' | 'saida'
          quantidade: number
          data: string
          usuario_id: string
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          equipamento_id: number
          tipo: 'entrada' | 'saida'
          quantidade: number
          data: string
          usuario_id: string
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          equipamento_id?: number
          tipo?: 'entrada' | 'saida'
          quantidade?: number
          data?: string
          usuario_id?: string
          observacoes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          nome: string
          role: 'admin' | 'usuario'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          nome: string
          role?: 'admin' | 'usuario'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          role?: 'admin' | 'usuario'
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}