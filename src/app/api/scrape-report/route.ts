import { NextRequest, NextResponse } from 'next/server';
import { scrapeReport } from '@/backend/services/reportScraper';
import { updateSingleAsset } from '@/backend/services/dataService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { papel, linkCotacao, link } = body;
    const targetLink = linkCotacao || link;

    if (!papel || !targetLink) {
      return NextResponse.json(
        { success: false, error: 'Papel e Link Cotação são obrigatórios' },
        { status: 400 }
      );
    }

    const reportData = await scrapeReport(targetLink);

    const updatedAsset = updateSingleAsset(papel, {
      'Data Ultimo Relatorio': reportData.dataUltimoRelatorio,
      'Link Relatorio': reportData.linkRelatorio
    });

    return NextResponse.json({
      success: true,
      reportData,
      data: updatedAsset
    });
  } catch (error) {
    console.error('Erro na API /api/scrape-report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
