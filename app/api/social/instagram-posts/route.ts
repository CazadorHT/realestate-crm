import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/features/site-settings/actions";

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp?: string;
}

/**
 * GET /api/social/instagram-posts
 * Fetch recent Instagram/Facebook posts for the connected page.
 * Used in KeywordEditorDialog to let users link a keyword to a specific post.
 */
export async function GET(req: NextRequest) {
  try {
    const settings = await getSiteSettings();
    const token = settings?.meta_page_access_token;

    if (!token) {
      return NextResponse.json(
        { error: "ยังไม่ได้เชื่อมต่อ Meta Page กรุณาเชื่อมต่อก่อน" },
        { status: 401 }
      );
    }

    // Try Instagram Business Account first
    const igAccountRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=instagram_business_account&access_token=${token}`
    );
    const igAccountData = await igAccountRes.json();
    const igUserId = igAccountData?.instagram_business_account?.id;

    let posts: InstagramPost[] = [];

    if (igUserId) {
      // Fetch Instagram media posts
      const mediaRes = await fetch(
        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_url,thumbnail_url,permalink,media_type,timestamp&limit=20&access_token=${token}`
      );
      const mediaData = await mediaRes.json();

      if (mediaData?.data) {
        posts = (mediaData.data as any[]).map((item) => ({
          id: item.id,
          caption: item.caption?.slice(0, 100),
          media_url: item.media_url || item.thumbnail_url,
          thumbnail_url: item.thumbnail_url || item.media_url,
          permalink: item.permalink,
          media_type: item.media_type,
          timestamp: item.timestamp,
        }));
      }
    } else {
      // Fallback: Fetch Facebook Page posts
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/me/posts?fields=id,message,full_picture,permalink_url,created_time&limit=20&access_token=${token}`
      );
      const fbData = await fbRes.json();

      if (fbData?.data) {
        posts = (fbData.data as any[]).map((item) => ({
          id: item.id,
          caption: item.message?.slice(0, 100),
          media_url: item.full_picture,
          thumbnail_url: item.full_picture,
          permalink: item.permalink_url,
          media_type: "IMAGE" as const,
          timestamp: item.created_time,
        }));
      }
    }

    return NextResponse.json({ posts, igUserId: igUserId || null });
  } catch (err: any) {
    console.error("[API] /api/social/instagram-posts error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์" },
      { status: 500 }
    );
  }
}
