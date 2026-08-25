import { scrapeStatusInvestReport, ReportData } from './statusinvest-webscrapper';

export type { ReportData };

/**
 * Função principal para scraping de relatórios.
 * Chama o webscraper do StatusInvest apenas se a URL contiver 'statusinvest.com.br'.
 */
export async function scrapeReport(url: string): Promise<ReportData> {
  if (url && url.includes('statusinvest.com.br')) {
    return await scrapeStatusInvestReport(url);
  }

  console.log(`URL '${url}' não é do StatusInvest (não contém 'statusinvest.com.br'). Webscraper não executado.`);
  return { dataUltimoRelatorio: null, linkRelatorio: null };
}
