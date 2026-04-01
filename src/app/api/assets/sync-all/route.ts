import { NextRequest, NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    // 验证 API Key
    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 API Key' },
        { status: 400 }
      );
    }

    // 传递 API Key 给同步服务
    await assetService.syncProcessingAssets(apiKey);

    return NextResponse.json(
      {
        success: true,
        message: '同步完成',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'CDN-Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('批量同步失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '同步失败' },
      { status: 500 }
    );
  }
}
