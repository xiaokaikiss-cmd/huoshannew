import { NextRequest, NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { apiKey } = body;

    // 验证 API Key
    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 API Key' },
        { status: 400 }
      );
    }

    const asset = await assetService.syncAssetStatus(id, apiKey);

    return NextResponse.json(
      {
        success: true,
        data: asset,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'CDN-Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('同步素材状态失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '同步失败' },
      { status: 500 }
    );
  }
}
