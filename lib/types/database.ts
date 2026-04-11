export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      person: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          middle_name: string | null;
          birth_date: string;
          birth_place: string | null;
          role: string;
          bio: string | null;
          note: string | null;
          avatar_url: string;
          father_id: string | null;
          mother_id: string | null;
          spouse_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          middle_name?: string | null;
          birth_date: string;
          birth_place?: string | null;
          role: string;
          bio?: string | null;
          note?: string | null;
          avatar_url?: string;
          father_id?: string | null;
          mother_id?: string | null;
          spouse_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          middle_name?: string | null;
          birth_date?: string;
          birth_place?: string | null;
          role?: string;
          bio?: string | null;
          note?: string | null;
          avatar_url?: string;
          father_id?: string | null;
          mother_id?: string | null;
          spouse_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "person_father_id_fkey";
            columns: ["father_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "person_mother_id_fkey";
            columns: ["mother_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "person_spouse_id_fkey";
            columns: ["spouse_id"];
            referencedRelation: "person";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

