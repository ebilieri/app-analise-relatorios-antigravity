import { NextRequest, NextResponse } from 'next/server';
import { scrapeQuote } from '@/backend/services/quoteScraper';
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

    const quoteData = await scrapeQuote(targetLink);

    const updatedAsset = updateSingleAsset(papel, {
      'Valor Atual': quoteData.valorAtual,
      'Minima 52 Semanas': quoteData.minima52Semanas,
      'Maxima 52 Semanas': quoteData.maxima52Semanas
    });

    return NextResponse.json({
      success: true,
      quoteData,
      data: updatedAsset
    });
  } catch (error) {
    console.error('Erro na API /api/scrape-quote:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
