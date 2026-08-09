import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Asset } from '../types';

const ROOT_DIR = process.cwd();
const JSON_PATH = path.join(ROOT_DIR, 'data.json');
const EXCEL_PATH = path.join(ROOT_DIR, 'fundos-para-analise.xlsx');

const HEADERS = [
  'Tipo',
  'Papel',
  'Categoria',
  'Link',
  'Valor Atual',
  'Minima 52 Semanas',
  'Maxima 52 Semanas',
  'Relatorios',
  'Data Ultimo Relatorio',
  'Link Relatorio'
];

/**
 * Ordena a lista de ativos primeiramente por Tipo (A-Z) e secundariamente por Papel (A-Z)
 */
export function sortAssets(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => {
    const tipoA = (a.Tipo || '').toUpperCase();
    const tipoB = (b.Tipo || '').toUpperCase();
    const tipoCompare = tipoA.localeCompare(tipoB, 'pt-BR');

    if (tipoCompare !== 0) {
      return tipoCompare;
    }

    const papelA = (a.Papel || '').toUpperCase();
    const papelB = (b.Papel || '').toUpperCase();
    return papelA.localeCompare(papelB, 'pt-BR');
  });
}

/**
 * Normaliza uma linha vinda do Excel/JSON para a estrutura de Asset
 */
function normalizeAsset(row: Record<string, any>): Asset {
  return {
    Tipo: row['Tipo'] ? String(row['Tipo']).trim() : '',
    Papel: row['Papel'] ? String(row['Papel']).trim().toUpperCase() : '',
    Categoria: row['Categoria'] ? String(row['Categoria']).trim() : '',
    Link: row['Link'] ? String(row['Link']).trim() : '',
    'Valor Atual': row['Valor Atual'] ? String(row['Valor Atual']).trim() : null,
    'Minima 52 Semanas': row['Minima 52 Semanas'] ? String(row['Minima 52 Semanas']).trim() : null,
    'Maxima 52 Semanas': row['Maxima 52 Semanas'] ? String(row['Maxima 52 Semanas']).trim() : null,
    Relatorios: row['Relatorios'] ? String(row['Relatorios']).trim() : 'Não',
    'Data Ultimo Relatorio': row['Data Ultimo Relatorio'] ? String(row['Data Ultimo Relatorio']).trim() : null,
    'Link Relatorio': row['Link Relatorio'] ? String(row['Link Relatorio']).trim() : null,
    baixado: Boolean(row['baixado']),
    caminhoRelatorioLocal: row['caminhoRelatorioLocal'] ? String(row['caminhoRelatorioLocal']).trim() : null
  };
}

/**
 * Lê a planilha fundos-para-analise.xlsx e converte em lista de Assets ordenados
 */
export function readFromExcel(): Asset[] {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Planilha não encontrada em: ${EXCEL_PATH}`);
  }
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  return sortAssets(rows.map(normalizeAsset));
}

/**
 * Salva a lista de ativos no arquivo local data.json ordenados por Tipo e Papel
 */
export function saveToJSON(assets: Asset[]): void {
  const sorted = sortAssets(assets);
  fs.writeFileSync(JSON_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
}

/**
 * Salva a lista de ativos de volta na planilha Excel ordenados por Tipo e Papel
 */
export function saveToExcel(assets: Asset[]): void {
  const sorted = sortAssets(assets);
  const exportData = sorted.map(a => ({
    'Tipo': a['Tipo'],
    'Papel': a['Papel'],
    'Categoria': a['Categoria'],
    'Link': a['Link'],
    'Valor Atual': a['Valor Atual'] || '',
    'Minima 52 Semanas': a['Minima 52 Semanas'] || '',
    'Maxima 52 Semanas': a['Maxima 52 Semanas'] || '',
    'Relatorios': a['Relatorios'],
    'Data Ultimo Relatorio': a['Data Ultimo Relatorio'] || '',
    'Link Relatorio': a['Link Relatorio'] || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: HEADERS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha1');
  XLSX.writeFile(workbook, EXCEL_PATH);
}

/**
 * Obtém todos os ativos. Se data.json existir, lê dele e valida a existência física dos relatórios.
 */
export function getAssets(): Asset[] {
  if (fs.existsSync(JSON_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      const assets: Asset[] = JSON.parse(raw);

      let dirty = false;
      const validatedAssets = assets.map(asset => {
        if (asset.baixado && asset.caminhoRelatorioLocal) {
          const relativePath = asset.caminhoRelatorioLocal.startsWith('/')
            ? asset.caminhoRelatorioLocal.substring(1)
            : asset.caminhoRelatorioLocal;
          const fullPath = path.join(ROOT_DIR, relativePath);

          if (!fs.existsSync(fullPath)) {
            console.log(`Relatório de ${asset.Papel} marcado como baixado mas não encontrado no disco (${fullPath}). Resetando estado para pendente.`);
            dirty = true;
            return {
              ...asset,
              baixado: false,
              caminhoRelatorioLocal: null
            };
          }
        }
        return asset;
      });

      const sorted = sortAssets(validatedAssets);
      if (dirty) {
        saveToJSON(sorted);
      }

      return sorted;
    } catch (e) {
      console.error('Erro ao ler data.json, recarregando do Excel...', e);
    }
  }

  // Carga inicial
  const assets = readFromExcel();
  saveToJSON(assets);
  saveToExcel(assets);
  return assets;
}

/**
 * Força a releitura da planilha Excel e faz merge com o data.json atual
 */
export function syncWithExcel(): Asset[] {
  const excelAssets = readFromExcel();
  let currentAssets: Asset[] = [];

  if (fs.existsSync(JSON_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      currentAssets = JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler data.json durante sync:', e);
    }
  }

  const assetMap = new Map<string, Asset>();

  for (const asset of currentAssets) {
    assetMap.set(asset.Papel.toUpperCase(), asset);
  }

  for (const excelItem of excelAssets) {
    const key = excelItem.Papel.toUpperCase();
    if (assetMap.has(key)) {
      const existing = assetMap.get(key)!;
      assetMap.set(key, {
        ...existing,
        Tipo: excelItem.Tipo,
        Categoria: excelItem.Categoria,
        Link: excelItem.Link,
        Relatorios: excelItem.Relatorios,
        'Valor Atual': existing['Valor Atual'] || excelItem['Valor Atual'],
        'Minima 52 Semanas': existing['Minima 52 Semanas'] || excelItem['Minima 52 Semanas'],
        'Maxima 52 Semanas': existing['Maxima 52 Semanas'] || excelItem['Maxima 52 Semanas'],
        'Data Ultimo Relatorio': existing['Data Ultimo Relatorio'] || excelItem['Data Ultimo Relatorio'],
        'Link Relatorio': existing['Link Relatorio'] || excelItem['Link Relatorio'],
        caminhoRelatorioLocal: existing.caminhoRelatorioLocal || null
      });
    } else {
      assetMap.set(key, excelItem);
    }
  }

  const mergedAssets = sortAssets(Array.from(assetMap.values()));
  saveToJSON(mergedAssets);
  saveToExcel(mergedAssets);
  return mergedAssets;
}

/**
 * Atualiza um único ativo e salva as mudanças no JSON e no Excel (mantendo a ordenação por Tipo e Papel)
 */
export function updateSingleAsset(papel: string, updates: Partial<Asset>): Asset | null {
  const assets = getAssets();
  const index = assets.findIndex(a => a.Papel.toUpperCase() === papel.toUpperCase());
  if (index === -1) return null;

  assets[index] = {
    ...assets[index],
    ...updates
  };

  const sorted = sortAssets(assets);
  saveToJSON(sorted);
  saveToExcel(sorted);
  return sorted.find(a => a.Papel.toUpperCase() === papel.toUpperCase()) || assets[index];
}
