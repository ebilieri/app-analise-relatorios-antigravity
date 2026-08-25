import { NextResponse } from 'next/server';
import { getAssets, addAsset } from '@/backend/services/dataService';

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
    const { Tipo, Categoria, Papel, Relatorios, linkRelatorio, 'Link Relatorio': linkRelatorioAlt } = body;

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
      linkRelatorio: linkRelatorio || linkRelatorioAlt || null
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
