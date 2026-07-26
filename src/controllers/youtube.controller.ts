import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { youtubeVideoSchema } from "@/validators/common.validator";
import { extractYoutubeVideoId, buildThumbnailUrl } from "@/services/youtube.service";
import prisma from "@/config/prisma";

export const getVideos = asyncHandler(async (_req: Request, res: Response) => {
  const videos = await prisma.youtubeVideo.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  res.status(200).json({ success: true, data: videos });
});

// Admin pastes only the URL — videoId and thumbnail are derived automatically.
export const addVideo = asyncHandler(async (req: Request, res: Response) => {
  const { title, youtubeUrl } = youtubeVideoSchema.parse(req.body);
  const videoId = extractYoutubeVideoId(youtubeUrl);
  const thumbnailUrl = buildThumbnailUrl(videoId);

  const position = await prisma.youtubeVideo.count();

  const video = await prisma.youtubeVideo.create({
    data: { title, youtubeUrl, videoId, thumbnailUrl, position },
  });

  res.status(201).json({ success: true, message: "Video added", data: video });
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  await prisma.youtubeVideo.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: "Video deleted" });
});
