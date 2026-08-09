import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export interface QuoteData {
  valorAtual: string | null;
  minima52Semanas: string | null;
  maxima52Semanas: string | null;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

/**
 * Tenta extrair cotações usando Axios + Cheerio
 */
async function scrapeWithAxios(url: string): Promise<QuoteData | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extração do Valor Atual
    let valorAtual = $('div[title*="Valor atual"] strong.value, div[title*="Valor atual"] .value')
      .first()
      .text()
      .trim();

    if (!valorAtual) {
      valorAtual = $('[title*="Valor atual do ativo"] strong.value').text().trim();
    }

    // Extração da Mínima 52 semanas
    let minima52Semanas = $('div[title*="mínimo"] strong.value, div[title*="Mínimo"] .value, div[title*="Min."] strong.value')
      .first()
      .text()
      .trim();

    if (!minima52Semanas) {
      minima52Semanas = $('[title*="Valor mínimo das últimas 52 semanas"] strong.value').text().trim();
    }

    // Extração da Máxima 52 semanas
    let maxima52Semanas = $('div[title*="máximo"] strong.value, div[title*="Máximo"] .value, div[title*="Máx."] strong.value')
      .first()
      .text()
      .trim();

    if (!maxima52Semanas) {
      maxima52Semanas = $('[title*="Valor máximo das últimas 52 semanas"] strong.value').text().trim();
    }

    if (valorAtual || minima52Semanas || maxima52Semanas) {
      return {
        valorAtual: valorAtual || null,
        minima52Semanas: minima52Semanas || null,
        maxima52Semanas: maxima52Semanas || null
      };
    }
    return null;
  } catch (err) {
    console.warn(`[Axios Scrape Quote Failed for ${url}]:`, (err as Error).message);
    return null;
  }
}

/**
 * Fallback com Puppeteer caso o Axios seja bloqueado ou falhe
 */
async function scrapeWithPuppeteer(url: string): Promise<QuoteData> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_HEADERS['User-Agent']);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const result = await page.evaluate(() => {
      const getByTitle = (term: string) => {
        const el = Array.from(document.querySelectorAll('div[title], span[title]')).find(e =>
          (e.getAttribute('title') || '').toLowerCase().includes(term.toLowerCase())
        );
        if (el) {
          const valEl = el.querySelector('.value, strong');
          return valEl ? valEl.textContent?.trim() || null : null;
        }
        return null;
      };

      return {
        valorAtual: getByTitle('valor atual'),
        minima52Semanas: getByTitle('mínim') || getByTitle('min.'),
        maxima52Semanas: getByTitle('máxim') || getByTitle('máx.')
      };
    });

    return result;
  } catch (err) {
    console.error(`[Puppeteer Scrape Quote Failed for ${url}]:`, (err as Error).message);
    return { valorAtual: null, minima52Semanas: null, maxima52Semanas: null };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Função principal para scraping de cotação de um ativo
 */
export async function scrapeQuote(url: string): Promise<QuoteData> {
  const axiosResult = await scrapeWithAxios(url);
  if (axiosResult && (axiosResult.valorAtual || axiosResult.minima52Semanas || axiosResult.maxima52Semanas)) {
    return axiosResult;
  }
  return await scrapeWithPuppeteer(url);
}
