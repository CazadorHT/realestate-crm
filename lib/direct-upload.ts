/**
 * 🚀 Direct-to-Storage Upload Utility
 * Uploads files directly from the browser to Supabase Storage using Signed Upload URLs.
 * 
 * Benefits:
 * - 0 Vercel Serverless CPU time
 * - 0 Vercel Fast Origin Data Transfer
 * - Bypasses Vercel payload limits
 */

export interface DirectUploadOptions {
  file: File | Blob;
  fileName?: string;
  bucket: "property-images" | "documents" | "service-images" | "avatars";
  folder?: string;
  onProgress?: (percent: number) => void;
}

export interface DirectUploadResult {
  success: boolean;
  path: string;
  publicUrl: string;
}

export async function uploadDirectToStorage({
  file,
  fileName,
  bucket,
  folder = "general",
  onProgress,
}: DirectUploadOptions): Promise<DirectUploadResult> {
  const resolvedFileName = fileName || (file instanceof File ? file.name : `file_${Date.now()}.bin`);

  // 1. Request Signed Upload URL from our lightweight Vercel API (<10ms, few bytes)
  const res = await fetch("/api/upload/direct-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: resolvedFileName,
      bucket,
      folder,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to get signed upload URL");
  }

  const { signedUrl, path, publicUrl } = data;

  // 2. Upload file directly from browser to Supabase Storage via PUT
  if (onProgress && typeof XMLHttpRequest !== "undefined") {
    // XMLHttpRequest for upload progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage direct upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during direct storage upload"));
      xhr.send(file);
    });
  } else {
    // Standard Fetch PUT
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Storage direct upload failed with status ${uploadRes.status}`);
    }
  }

  return {
    success: true,
    path,
    publicUrl,
  };
}
