// VIDEO GENERATION DISABLED
// To re-enable:
//   1. Set video_generation_enabled = "true" in Settings
//   2. Uncomment the code below
//
// import fs from "fs";
// import path from "path";
// import type { Promotion } from "@prisma/client";
// import { bundle } from "@remotion/bundler";
// import { renderMedia, selectComposition } from "@remotion/renderer";
//
// import { generateImage } from "../../lib/image-gen";
// import type { Caption } from "./audio";
//
// // ---------------------------------------------------------------------------
// // Background image generator (unified via lib/image-gen)
// // ---------------------------------------------------------------------------
//
// /**
//  * Generates a photorealistic background image for the video.
//  * Returns the image as a base64 data URL, or undefined if it fails.
//  */
// async function generateBackgroundImage(
//   hook: string,
//   reveal: string,
//   userId: string,
// ): Promise<string | undefined> {
//   try {
//     const prompt = `Create a stunning, cinematic, photorealistic image for a short-form social video.
//
// Topic: "${hook}" — ${reveal}
//
// Visual requirements:
// - Photorealistic scene that visually represents the topic above
// - Show a real environment, people, or subject directly relevant to the topic
// - Cinematic lighting, professional quality, vivid and dramatic
// - 9:16 vertical aspect ratio (portrait, for social video)
// - No text, no UI elements, no overlays — pure visual scene only`;
//
//     const buffer = await generateImage({ prompt, userId });
//     return `data:image/png;base64,${buffer.toString("base64")}`;
//   } catch {
//     // Background image is optional — don't fail the whole render
//     return undefined;
//   }
// }
//
// // ---------------------------------------------------------------------------
// // Core renderer
// // ---------------------------------------------------------------------------
//
// export async function renderVideo(params: {
//   script: { hook: string; points: string[]; reveal: string; cta: string };
//   promotion: { name: string; url: string };
//   outputPath: string;
//   backgroundImageDataUrl?: string;
//   userId?: string;
// }): Promise<string> {
//   const { script, promotion, outputPath } = params;
//
//   // 1. Generate a photorealistic background image based on the post topic (hook),
//   //    unless a pre-built data URL was provided by the caller.
//   const backgroundImageDataUrl =
//     params.backgroundImageDataUrl ??
//     (await generateBackgroundImage(
//       script.hook,
//       script.reveal,
//       params.userId ?? "",
//     ));
//
//   // 2. Bundle the Remotion template entry point
//   const entryPoint = path.join(
//     process.cwd(),
//     "worker/templates/video/index.tsx",
//   );
//   const bundled = await bundle({ entryPoint });
//
//   // 3. Build input props matching ShortFormVideoProps
//   const inputProps = {
//     backgroundImageDataUrl,
//   };
//
//   // 4. Select the composition from the bundle
//   const composition = await selectComposition({
//     serveUrl: bundled,
//     id: "ShortFormVideo",
//     inputProps,
//   });
//
//   // 5. Ensure output directory exists
//   const outputDir = path.dirname(outputPath);
//   fs.mkdirSync(outputDir, { recursive: true });
//
//   // 6. Render to MP4
//   await renderMedia({
//     composition,
//     serveUrl: bundled,
//     codec: "h264",
//     outputLocation: outputPath,
//     inputProps,
//   });
//
//   return outputPath;
// }
//
// // ---------------------------------------------------------------------------
// // Convenience wrapper for the daily engine
// // ---------------------------------------------------------------------------
//
// export async function renderVideoForPromotion(params: {
//   promotion: Promotion;
//   videoScript: string; // JSON string from generate.ts
//   date: string;
// }): Promise<string> {
//   const { promotion, videoScript, date } = params;
//
//   // Parse the JSON script produced by the VIDEO_SYSTEM prompt in generate.ts
//   const script = JSON.parse(videoScript) as {
//     hook: string;
//     points: string[];
//     reveal: string;
//     cta: string;
//   };
//
//   // Resolve output path and ensure the directory exists
//   const outputDir = path.resolve("./media/videos");
//   fs.mkdirSync(outputDir, { recursive: true });
//   const outputPath = path.join(outputDir, `${date}.mp4`);
//
//   return renderVideo({
//     script,
//     promotion: { name: promotion.name, url: promotion.url },
//     outputPath,
//   });
// }
//
// // ---------------------------------------------------------------------------
// // CaptionedSlideshow renderer
// // ---------------------------------------------------------------------------
//
// export async function renderCaptionedVideo(params: {
//   images: string[];
//   audioDataUrl: string;
//   captions: Caption[];
//   durationSeconds: number;
//   outputPath: string;
// }): Promise<string> {
//   const { images, audioDataUrl, captions, durationSeconds, outputPath } =
//     params;
//   const durationInFrames = Math.ceil(durationSeconds * 30);
//
//   const entryPoint = path.join(
//     process.cwd(),
//     "worker/templates/video/index.tsx",
//   );
//   const bundled = await bundle({ entryPoint });
//
//   const inputProps = { images, audioDataUrl, captions, durationInFrames };
//
//   const composition = await selectComposition({
//     serveUrl: bundled,
//     id: "CaptionedSlideshow",
//     inputProps,
//   });
//
//   fs.mkdirSync(path.dirname(outputPath), { recursive: true });
//
//   await renderMedia({
//     composition,
//     serveUrl: bundled,
//     codec: "h264",
//     outputLocation: outputPath,
//     inputProps,
//   });
//
//   return outputPath;
// }

// Stub export to prevent breaking existing imports
export async function renderVideoForPromotion(_: unknown): Promise<string> {
  throw new Error("Video generation is disabled. Enable via Settings.");
}
