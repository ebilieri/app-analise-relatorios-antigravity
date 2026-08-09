export interface Asset {
  Tipo: string;
  Papel: string;
  Categoria: string;
  Link: string;
  "Valor Atual": string | null;
  "Minima 52 Semanas": string | null;
  "Maxima 52 Semanas": string | null;
  Relatorios: string; // "Sim" | "Não"
  "Data Ultimo Relatorio": string | null;
  "Link Relatorio": string | null;
  baixado?: boolean;
  caminhoRelatorioLocal?: string | null;
}
