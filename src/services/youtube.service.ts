import { ApiError } from "@/utils/ApiError";

/**
 * Extracts the YouTube video ID from any common URL format:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 */
export function extractYoutubeVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  throw ApiError.badRequest("Could not extract a video ID from the provided YouTube URL");
}

export function buildThumbnailUrl(videoId: string): string {
  // maxresdefault is highest quality; falls back gracefully in <img> if unavailable since
  // YouTube always guarantees hqdefault.
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
