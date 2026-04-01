import { getSupabaseClient } from '@/storage/database/supabase-client';

const VOLCANO_API_BASE = 'https://asset.wetoken.lingxixai.com/api/asset';

interface AssetUploadResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
  };
  Result: {
    Id: string;
  };
}

interface AssetQueryResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
  };
  Result: {
    Id: string;
    Name: string;
    URL: string;
    AssetType: string;
    GroupId: string;
    Status: 'Active' | 'Processing' | 'Failed';
    CreateTime: string;
    UpdateTime: string;
    ProjectName: string;
  };
}

export interface Asset {
  id: string;
  asset_id: string;
  name: string;
  url: string;
  asset_type: 'Image' | 'Video' | 'Audio';
  status: 'Active' | 'Processing' | 'Failed';
  created_at: string;
  updated_at: string;
}

export class AssetService {
  /**
   * 上传图片素材到邪修
   */
  async uploadImage(url: string, name: string, apiKey?: string): Promise<string> {
    // 使用用户提供的 API Key，如果没有则使用环境变量（向后兼容）
    const token = apiKey || process.env.WETOKEN_API_KEY;

    if (!token) {
      throw new Error('API Key 未配置');
    }

    const response = await fetch(`${VOLCANO_API_BASE}/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传图片失败: ${errorText}`);
    }

    const data: AssetUploadResponse = await response.json();
    return data.Result.Id;
  }

  /**
   * 上传多媒体素材到邪修
   */
  async uploadMedia(url: string, name: string, assetType: 'Image' | 'Video' | 'Audio', apiKey?: string): Promise<string> {
    // 使用用户提供的 API Key，如果没有则使用环境变量（向后兼容）
    const token = apiKey || process.env.WETOKEN_API_KEY;

    if (!token) {
      throw new Error('API Key 未配置');
    }

    const response = await fetch(`${VOLCANO_API_BASE}/createMedia`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, name, assetType }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传多媒体失败: ${errorText}`);
    }

    const data: AssetUploadResponse = await response.json();
    return data.Result.Id;
  }

  /**
   * 创建本地素材记录
   */
  async createLocalAsset(
    assetId: string,
    name: string,
    url: string,
    assetType: 'Image' | 'Video' | 'Audio'
  ): Promise<Asset> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('assets')
      .insert({
        asset_id: assetId,
        name,
        url,
        asset_type: assetType,
        status: 'Processing',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建本地记录失败: ${error.message}`);
    }

    return data as Asset;
  }

  /**
   * 获取本地素材列表
   */
  async getLocalAssets(): Promise<Asset[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询本地记录失败: ${error.message}`);
    }

    return data as Asset[];
  }

  /**
   * 获取单个本地素材
   */
  async getLocalAsset(id: string): Promise<Asset | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('assets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`查询本地记录失败: ${error.message}`);
    }

    return data as Asset | null;
  }

  /**
   * 更新本地素材状态
   */
  async updateLocalAssetStatus(id: string, status: Asset['status']): Promise<Asset> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('assets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新状态失败: ${error.message}`);
    }

    return data as Asset;
  }

  /**
   * 同步素材状态（从火山引擎查询并更新本地）
   */
  async syncAssetStatus(id: string, apiKey?: string): Promise<Asset> {
    const localAsset = await this.getLocalAsset(id);
    if (!localAsset) {
      throw new Error('素材不存在');
    }

    const remoteAsset = await this.queryAssetStatus(localAsset.asset_id, apiKey);
    return await this.updateLocalAssetStatus(id, remoteAsset.Status);
  }

  /**
   * 查询邪修素材状态
   */
  async queryAssetStatus(assetId: string, apiKey?: string): Promise<AssetQueryResponse['Result']> {
    // 使用用户提供的 API Key，如果没有则使用环境变量（向后兼容）
    const token = apiKey || process.env.WETOKEN_API_KEY;

    if (!token) {
      throw new Error('API Key 未配置');
    }

    const response = await fetch(`${VOLCANO_API_BASE}/get?id=${assetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`查询素材状态失败: ${errorText}`);
    }

    const data: AssetQueryResponse = await response.json();
    return data.Result;
  }

  /**
   * 批量同步处理中的素材
   */
  async syncProcessingAssets(apiKey?: string): Promise<void> {
    const client = getSupabaseClient();
    const { data: processingAssets, error } = await client
      .from('assets')
      .select('*')
      .eq('status', 'Processing');

    if (error) {
      throw new Error(`查询处理中素材失败: ${error.message}`);
    }

    if (!processingAssets || processingAssets.length === 0) {
      return;
    }

    // 逐个查询状态（接口不支持高并发）
    for (const asset of processingAssets) {
      try {
        const remoteAsset = await this.queryAssetStatus(asset.asset_id, apiKey);
        if (remoteAsset.Status !== 'Processing') {
          await this.updateLocalAssetStatus(asset.id, remoteAsset.Status);
        }
        // 延迟 500ms 避免并发限制
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`同步素材 ${asset.id} 失败:`, error);
      }
    }
  }

  /**
   * 删除本地素材记录
   */
  async deleteLocalAsset(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除素材失败: ${error.message}`);
    }
  }
}

export const assetService = new AssetService();
