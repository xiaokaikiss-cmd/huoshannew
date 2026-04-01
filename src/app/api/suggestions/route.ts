import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '建议内容不能为空' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('suggestions')
      .insert([{ content: content.trim() }])
      .select()
      .single();

    if (error) {
      console.error('插入建议失败:', error);
      return NextResponse.json(
        { success: false, error: '提交失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('提交建议出错:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
