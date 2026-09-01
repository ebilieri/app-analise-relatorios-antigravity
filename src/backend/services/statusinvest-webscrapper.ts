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
 * Tenta extrair informações do último relatório via Axios analisando o HTML renderizado ou o atributo data-page
 */
async function scrapeWithAxios(url: string): Promise<ReportData | null> {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 12000
    });

    const $ = cheerio.load(response.data);

    // 1. Procura primeiro nos elementos DOM renderizados no container de documentos
    const domItems = $('#document-section .list > div, div.documents.card .list > div, div.documents .list > div');
    for (let i = 0; i < domItems.length; i++) {
      const el = $(domItems[i]);
      const text = el.text().trim();
      const lowerText = text.toLowerCase();

      const isReport = lowerText.includes('relatório') || lowerText.includes('relatorio');
      const isCancelled = lowerText.includes('cancelado');

      if (isReport && !isCancelled) {
        const link = el.find('a[href*="exibirDocumento"], a[href*="fnet"], a[href*="pdf"]').attr('href');
        const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
        const dateText = dateMatch ? dateMatch[0] : null;

        if (link || dateText) {
          return {
            dataUltimoRelatorio: dateText,
            linkRelatorio: link ? (link.startsWith('http') ? link : `https://statusinvest.com.br${link}`) : null
          };
        }
      }
    }

    // 2. Procura no atributo JSON data-page (filtrando ESTRITAMENTE relatórios)
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
            const statusName = String(item.statusName || item.status || '').toLowerCase();
            const isCancelled = statusName.includes('cancelado') || item.status === 2;
            const isReport = desc.includes('relatório') || desc.includes('relatorio') || category === '6';
            return isReport && !isCancelled;
          });

          if (relatorios.length > 0) {
            const latest = relatorios[0];
            const date = latest.dataEntrega || latest.date || latest.data || latest.createdDate || null;
            const link = latest.link || latest.url || (latest.id ? `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${latest.id}` : null);

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

    return null;
  } catch (err) {
    console.warn(`[Axios Scrape Report Failed for ${url}]:`, (err as Error).message);
    return null;
  }
}

/**
 * Fallback com Puppeteer simulando seleção no combobox Categories (value="6") e Types (value="26") do StatusInvest
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

    try {
      await page.waitForSelector('#document-section', { timeout: 10000 });
    } catch {}

    // Tenta selecionar Categoria "Relatórios" (value="6") e Tipo "Relatório Gerencial" (value="26")
    try {
      await page.evaluate(() => {
        const catSelect = document.querySelector('select[name="DocumentsFiiCategories"], select[data-formselect]') as HTMLSelectElement;
        if (catSelect) {
          catSelect.value = '6';
          catSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const liOptions = Array.from(document.querySelectorAll('.input-field .dropdown-content li span'));
        const relatorioLi = liOptions.find(el => el.textContent?.trim() === 'Relatórios');
        if (relatorioLi) {
          (relatorioLi.parentElement as HTMLElement)?.click();
        }
      });

      await new Promise(res => setTimeout(res, 2500));

      await page.evaluate(() => {
        const typeSelect = document.querySelector('select[name="DocumentsFiiTypes"]') as HTMLSelectElement;
        if (typeSelect) {
          typeSelect.value = '26';
          typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const typeOptions = Array.from(document.querySelectorAll('.input-field .dropdown-content li span'));
        const gerencialLi = typeOptions.find(el => el.textContent?.trim() === 'Relatório Gerencial');
        if (gerencialLi) {
          (gerencialLi.parentElement as HTMLElement)?.click();
        }
      });

      await new Promise(res => setTimeout(res, 2500));
    } catch (e) {
      console.warn('Erro ao selecionar dropdown em Puppeteer:', e);
    }

    const result = await page.evaluate(() => {
      // 1. Busca primeiro nos elementos DOM renderizados
      const listEls = Array.from(document.querySelectorAll('#document-section .list > div, div.documents.card .list > div'));
      for (const el of listEls) {
        const text = el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '';
        const lowerText = text.toLowerCase();
        const isReport = lowerText.includes('relatório') || lowerText.includes('relatorio');
        const isCancelled = lowerText.includes('cancelado');

        if (isReport && !isCancelled) {
          const linkEl = el.querySelector('a[href*="exibirDocumento"], a[href*="fnet"], a[href*="pdf"]') as HTMLAnchorElement;
          const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
          return {
            dataUltimoRelatorio: dateMatch ? dateMatch[0] : null,
            linkRelatorio: linkEl ? linkEl.href : null
          };
        }
      }

      // 2. Se não encontrou no DOM, busca no JSON data-page (apenas se for relatório)
      const card = document.querySelector('div.documents.card[data-page], [data-page]');
      if (card) {
        const rawJson = card.getAttribute('data-page');
        if (rawJson) {
          try {
            const docs = JSON.parse(rawJson);
            if (Array.isArray(docs) && docs.length > 0) {
              const relatorios = docs.filter((item: any) => {
                const desc = (item.description || item.type || item.tipo || item.title || '').toLowerCase();
                const statusName = String(item.statusName || item.status || '').toLowerCase();
                const isCancelled = statusName.includes('cancelado') || item.status === 2;
                return (desc.includes('relatório') || desc.includes('relatorio')) && !isCancelled;
              });
              if (relatorios.length > 0) {
                const target = relatorios[0];
                return {
                  dataUltimoRelatorio: target.dataEntrega || target.date || null,
                  linkRelatorio: target.link || target.url || (target.id ? `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${target.id}` : null)
                };
              }
            }
          } catch {}
        }
      }

      return {
        dataUltimoRelatorio: null,
        linkRelatorio: null
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
 * Função de web scraping do StatusInvest.
 * Executada SOMENTE quando a URL contiver 'statusinvest.com.br'.
 */
export async function scrapeStatusInvestReport(url: string): Promise<ReportData> {
  if (!url || !url.includes('statusinvest.com.br')) {
    console.log(`URL '${url}' não contém statusinvest.com.br. Scraping ignorado.`);
    return { dataUltimoRelatorio: null, linkRelatorio: null };
  }

  const axiosResult = await scrapeWithAxios(url);
  if (axiosResult && (axiosResult.dataUltimoRelatorio || axiosResult.linkRelatorio)) {
    return axiosResult;
  }
  return await scrapeWithPuppeteer(url);
}

