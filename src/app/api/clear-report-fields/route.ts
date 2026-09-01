import { NextResponse } from 'next/server';
import { clearReportFieldsForEligibleAssets } from '@/backend/services/dataService';

export async function POST() {
  try {
    const updatedAssets = clearReportFieldsForEligibleAssets();
    return NextResponse.json({ success: true, data: updatedAssets });
  } catch (error) {
    console.error('Erro na API /api/clear-report-fields:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
