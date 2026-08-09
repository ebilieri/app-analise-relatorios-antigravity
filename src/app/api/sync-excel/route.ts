import { NextResponse } from 'next/server';
import { syncWithExcel } from '@/backend/services/dataService';

export async function POST() {
  try {
    const assets = syncWithExcel();
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    console.error('Erro na API /api/sync-excel:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
