import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export interface ReportData {
  dataUltimoRelatorio: string | null;
  linkRelatorio: string | null;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
};

/**
 * Tenta extrair informações do último relatório via Axios analisando atributos data-page no HTML
 */
async function scrapeWithAxios(url: string): Promise<ReportData | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });

    const $ = cheerio.load(response.data);

    // Procura elementos div.documents.card ou inputs com atributo data-page
    let dataPageAttr = $('div.documents.card[data-page]').attr('data-page') ||
                       $('[data-page]').attr('data-page') ||
                       $('input#results').val() as string ||
                       $('input#documents-list').val() as string;

    if (dataPageAttr) {
      try {
        const docs = JSON.parse(dataPageAttr);
        if (Array.isArray(docs) && docs.length > 0) {
          // Filtra relatórios gerenciais ou da categoria 6
          const relatorios = docs.filter((item: any) => {
            const desc = (item.description || item.type || item.tipo || item.title || '').toLowerCase();
            const category = String(item.category || item.categoria || item.categoryId || '');
            return desc.includes('relatório') || desc.includes('relatorio') || category === '6';
          });

          const candidates = relatorios.length > 0 ? relatorios : docs;

          // Pega o mais recente (primeiro da lista se já vier ordenado ou ordena por data)
          const latest = candidates[0];

          const date = latest.dataEntrega || latest.date || latest.data || latest.createdDate || null;
          const link = latest.link || latest.url || (latest.id ? `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${latest.id}` : null);

          if (date || link) {
            return {
              dataUltimoRelatorio: date ? String(date).trim() : null,
              linkRelatorio: link ? String(link).trim() : null
            };
          }
        }
      } catch (e) {
        console.warn('Erro ao fazer parse do data-page JSON:', e);
      }
    }

    // Fallback Cheerio: busca direta nas linhas da tabela de documentos se data-page não for encontrado
    const tableRow = $('div.documents.card table tbody tr').first();
    if (tableRow.length > 0) {
      const dateText = tableRow.find('td').eq(0).text().trim() || tableRow.find('.date').text().trim();
      const linkHref = tableRow.find('a[href*="Documento"], a[href*="pdf"], a[title*="Download"]').attr('href');
      if (dateText || linkHref) {
        return {
          dataUltimoRelatorio: dateText || null,
          linkRelatorio: linkHref ? (linkHref.startsWith('http') ? linkHref : `https://statusinvest.com.br${linkHref}`) : null
        };
      }
    }

    return null;
  } catch (err) {
    console.warn(`[Axios Scrape Report Failed for ${url}]:`, (err as Error).message);
    return null;
  }
}

/**
 * Fallback com Puppeteer simulando seleção no combobox Categories (value="6")
 */
async function scrapeWithPuppeteer(url: string): Promise<ReportData> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_HEADERS['User-Agent']);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Tenta selecionar a categoria "Relatórios" (value="6") se o select existir
    try {
      const selectSelector = 'select[name*="Categories"], select[data-formselect]';
      await page.waitForSelector(selectSelector, { timeout: 3000 });
      await page.select(selectSelector, '6');
      await page.evaluate(() => {
        const sel = document.querySelector('select[name*="Categories"], select[data-formselect]') as HTMLSelectElement;
        if (sel) {
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await new Promise(res => setTimeout(res, 2000));
    } catch {
      // Se não encontrar o select, prossegue com o conteúdo da página
    }

    const result = await page.evaluate(() => {
      // Tenta ler data-page
      const card = document.querySelector('div.documents.card[data-page], [data-page]');
      if (card) {
        const rawJson = card.getAttribute('data-page');
        if (rawJson) {
          try {
            const docs = JSON.parse(rawJson);
            if (Array.isArray(docs) && docs.length > 0) {
              const relatorios = docs.filter((item: any) => {
                const desc = (item.description || item.type || item.tipo || item.title || '').toLowerCase();
                return desc.includes('relatório') || desc.includes('relatorio');
              });
              const target = relatorios.length > 0 ? relatorios[0] : docs[0];
              return {
                dataUltimoRelatorio: target.dataEntrega || target.date || null,
                linkRelatorio: target.link || target.url || (target.id ? `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${target.id}` : null)
              };
            }
          } catch {}
        }
      }

      // Procura primeiro link de documento na página
      const linkEl = document.querySelector('a[href*="exibirDocumento"], a[href*="downloadDocument"], a[href*="pdf"]') as HTMLAnchorElement;
      const dateEl = document.querySelector('.documents .date, .documents td') as HTMLElement;

      return {
        dataUltimoRelatorio: dateEl ? dateEl.textContent?.trim() || null : null,
        linkRelatorio: linkEl ? linkEl.href : null
      };
    });

    return result;
  } catch (err) {
    console.error(`[Puppeteer Scrape Report Failed for ${url}]:`, (err as Error).message);
    return { dataUltimoRelatorio: null, linkRelatorio: null };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Função principal para scraping do último relatório
 */
export async function scrapeReport(url: string): Promise<ReportData> {
  const axiosResult = await scrapeWithAxios(url);
  if (axiosResult && (axiosResult.dataUltimoRelatorio || axiosResult.linkRelatorio)) {
    return axiosResult;
  }
  return await scrapeWithPuppeteer(url);
}
