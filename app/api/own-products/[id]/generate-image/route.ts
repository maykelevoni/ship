import { auth } from "@/auth";

import { db } from "@/lib/db";
import { generateImage } from "@/lib/image-gen";
import { getSetting } from "@/lib/settings";

export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const userId = req.auth.user.id;
  const { id } = params;

  try {
    // Fetch the OwnProduct by id + userId
    const product = await db.ownProduct.findFirst({
      where: { id, userId },
    });

    if (!product) {
      return new Response("Product not found", { status: 404 });
    }

    // Get gemini_api_key from settings
    const apiKey = await getSetting("gemini_api_key", userId);
    if (!apiKey) {
      return new Response(
        "Gemini API key not configured. Please add it in Settings.",
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = `Product cover image for "${product.title}". ${product.description}. Clean, professional, digital product style. Square 1:1 aspect ratio. High quality, minimalist design suitable for an e-commerce or digital product listing.`;

    // Call Gemini image API
    const imageBuffer = await generateImage({ prompt, userId });

    // Convert to data URL
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    // Update product with imageUrl
    const updatedProduct = await db.ownProduct.update({
      where: { id },
      data: { imageUrl: dataUrl },
    });

    return Response.json({ imageUrl: dataUrl, product: updatedProduct });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return new Response(
      `Failed to generate image: ${error.message || "Unknown error"}`,
      { status: 500 }
    );
  }
});
