import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import puppeteer from 'puppeteer';
import { updateSingleAsset } from '@/backend/services/dataService';

function formatDateForFilename(dateStr: string | null): string {
  if (!dateStr) return 'data-desconhecida';

  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const parts = clean.split(/[\/\.-]/);
  if (parts.length === 3) {
    let [day, month, year] = parts;
    if (year.length === 2) year = '20' + year;
    if (day.length === 1) day = '0' + day;
    if (month.length === 1) month = '0' + month;
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return clean.replace(/[^a-zA-Z0-9-]/g, '_');
}

function downloadFileNative(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const requestOptions = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive'
      }
    };

    const file = fs.createWriteStream(destPath);

    const req = client.get(url, requestOptions, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFileNative(res.headers.location, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP Status ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      file.close();
      fs.unlink(destPath, () => {});
      reject(new Error('Timeout de 20s excedido'));
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { papel, dataUltimoRelatorio, linkDownloadPDF, linkRelatorio } = body;
    const targetLinkPDF = linkDownloadPDF || linkRelatorio;

    if (!papel || !targetLinkPDF) {
      return NextResponse.json(
        { success: false, error: 'Papel e LinkDownloadPDF são obrigatórios para download' },
        { status: 400 }
      );
    }

    const relatorioDir = path.join(process.cwd(), 'relatorios');
    if (!fs.existsSync(relatorioDir)) {
      fs.mkdirSync(relatorioDir, { recursive: true });
    }

    const dateFormatted = formatDateForFilename(dataUltimoRelatorio);
    const fileName = `${papel.toLowerCase()}-${dateFormatted}.pdf`;
    const filePath = path.join(relatorioDir, fileName);
    const relativeWebPath = `/relatorios/${fileName}`;

    let alreadyExists = false;

    if (fs.existsSync(filePath)) {
      alreadyExists = true;
      console.log(`Relatório já existe localmente: ${fileName}`);
    } else {
      console.log(`Baixando relatório de ${papel} a partir de ${targetLinkPDF}...`);

      let downloaded = false;
      try {
        await downloadFileNative(targetLinkPDF, filePath);
        downloaded = true;
      } catch (nativeErr) {
        console.warn(`[Download Nativo Falhou para ${papel}]:`, (nativeErr as Error).message, 'Tentando fallback via Puppeteer...');
      }

      if (!downloaded) {
        let browser = null;
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          const page = await browser.newPage();
          const response = await page.goto(targetLinkPDF, { waitUntil: 'networkidle2', timeout: 30000 });
          if (response) {
            const buffer = await response.buffer();
            fs.writeFileSync(filePath, buffer);
            downloaded = true;
          }
        } finally {
          if (browser) await browser.close();
        }
      }

      if (!downloaded) {
        throw new Error(`Não foi possível baixar o relatório de ${papel}`);
      }
    }

    // Atualiza JSON com o flag baixado e o caminho local do relatório
    const updatedAsset = updateSingleAsset(papel, {
      baixado: true,
      caminhoRelatorioLocal: relativeWebPath
    });

    return NextResponse.json({
      success: true,
      fileName,
      filePath: relativeWebPath,
      alreadyExists,
      data: updatedAsset
    });
  } catch (error) {
    console.error('Erro na API /api/download-report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
