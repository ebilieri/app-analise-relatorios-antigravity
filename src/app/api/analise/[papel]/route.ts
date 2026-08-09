import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAssets } from '@/backend/services/dataService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ papel: string }> }
) {
  try {
    const resolvedParams = await params;
    const papel = resolvedParams.papel.toUpperCase();
    const assets = getAssets();
    const asset = assets.find(a => a.Papel.toUpperCase() === papel);

    if (!asset) {
      return NextResponse.json(
        { success: false, error: `Ativo "${papel}" não encontrado.` },
        { status: 404 }
      );
    }

    const promptPath = path.join(process.cwd(), 'prompt-analista.md');
    if (!fs.existsSync(promptPath)) {
      return NextResponse.json(
        { success: false, error: 'Arquivo prompt-analista.md não encontrado.' },
        { status: 500 }
      );
    }

    let prompt = fs.readFileSync(promptPath, 'utf-8');

    prompt = prompt.replace(
      /\[INSIRA O NOME OU TICKER DO ATIVO AQUI\]/g,
      asset.Papel
    );

    prompt = prompt.replace(
      /\[Link do pdf no repositorio local\]/g,
      asset.caminhoRelatorioLocal || ''
    );

    return NextResponse.json({ success: true, data: { prompt, papel: asset.Papel } });
  } catch (error) {
    console.error('Erro na API /api/analise:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
