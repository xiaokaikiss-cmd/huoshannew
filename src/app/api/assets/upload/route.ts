import { NextRequest, NextResponse } from 'next/server';
import { assetService } from '@/services/asset-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, assetType = 'Image', apiKey } = body;

    if (!url || !name) {
      return NextResponse.json(
        { error: 'url 和 name 参数必填' },
        { status: 400 }
      );
    }

    // 验证素材类型
    const validTypes = ['Image', 'Video', 'Audio'];
    if (!validTypes.includes(assetType)) {
      return NextResponse.json(
        { error: 'assetType 必须是 Image、Video 或 Audio' },
        { status: 400 }
      );
    }

    // 验证 API Key
    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 API Key' },
        { status: 400 }
      );
    }

    // 上传到火山引擎（使用用户提供的 API Key）
    let assetId: string;
    if (assetType === 'Image') {
      assetId = await assetService.uploadImage(url, name, apiKey);
    } else {
      assetId = await assetService.uploadMedia(url, name, assetType, apiKey);
    }

    // 创建本地记录
    const localAsset = await assetService.createLocalAsset(assetId, name, url, assetType);

    return NextResponse.json(
      {
        success: true,
        data: localAsset,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'CDN-Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('上传素材失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    );
  }
}
