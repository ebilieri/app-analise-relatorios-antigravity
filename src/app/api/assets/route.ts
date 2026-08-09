import { NextResponse } from 'next/server';
import { getAssets } from '@/backend/services/dataService';

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
