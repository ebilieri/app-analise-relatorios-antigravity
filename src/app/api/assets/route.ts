import { NextResponse } from 'next/server';
import { getAssets, addAsset, updateSingleAsset, deleteAsset } from '@/backend/services/dataService';
import { Asset } from '@/backend/types';

export async function GET() {
  try {
    const assets = getAssets();
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    console.error('Erro na API /api/assets:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Tipo, Categoria, Papel, Relatorios, linkRelatorio, linkDownloadPDF, 'Link Relatorio': linkRelatorioAlt, 'Link Download PDF': linkDownloadPDFAlt } = body;

    if (!Tipo || !Categoria || !Papel || !Relatorios) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: Tipo, Categoria, Papel, Relatorios.' },
        { status: 400 }
      );
    }

    const asset = addAsset({
      Tipo,
      Categoria,
      Papel,
      Relatorios,
      linkRelatorio: linkRelatorio || linkRelatorioAlt || null,
      linkDownloadPDF: linkDownloadPDF || linkDownloadPDFAlt || null
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar ativo:', error);
    const message = (error as Error).message;
    const status = message.includes('já existe') ? 409 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { Papel, Tipo, Categoria, Relatorios, linkRelatorio, 'Link Relatorio': linkRelatorioAlt } = body;

    if (!Papel) {
      return NextResponse.json(
        { success: false, error: 'O campo Papel é obrigatório para edição.' },
        { status: 400 }
      );
    }

    const finalLinkRelatorio = linkRelatorio !== undefined ? linkRelatorio : linkRelatorioAlt;
    const linkCotacao = Categoria && Papel
      ? `https://statusinvest.com.br/${Categoria.toLowerCase().replace(/\s+/g, '')}/${Papel.trim().toLowerCase()}`
      : undefined;

    const updates: Partial<Asset> = {
      Tipo,
      Categoria,
      Relatorios,
      'Link Cotacao': linkCotacao,
      'Link Relatorio': finalLinkRelatorio ? String(finalLinkRelatorio).trim() : null,
      // Limpa os campos que não estão presentes na tela de edição:
      'Valor Atual': null,
      'Minima 52 Semanas': null,
      'Maxima 52 Semanas': null,
      'Data Ultimo Relatorio': null,
      'Link Download PDF': null,
      baixado: false,
      caminhoRelatorioLocal: null
    };

    const updated = updateSingleAsset(Papel, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Ativo "${Papel}" não encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar ativo:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const papel = searchParams.get('papel');

    if (!papel) {
      return NextResponse.json(
        { success: false, error: 'O parâmetro papel é obrigatório para exclusão.' },
        { status: 400 }
      );
    }

    const deleted = deleteAsset(papel);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Ativo "${papel}" não encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Ativo "${papel}" excluído com sucesso.` });
  } catch (error) {
    console.error('Erro ao excluir ativo:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
