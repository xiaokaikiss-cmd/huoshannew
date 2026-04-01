import { NextRequest, NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const asset = await assetService.getLocalAsset(id);
    
    if (!asset) {
      return NextResponse.json(
        { error: '素材不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: asset,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('查询素材失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}
