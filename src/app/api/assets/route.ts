import { NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function GET() {
  try {
    const assets = await assetService.getLocalAssets();

    return NextResponse.json(
      {
        success: true,
        data: assets,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('查询素材列表失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}
