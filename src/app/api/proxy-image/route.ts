import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for card images to allow html2canvas to capture them.
 * Usage: /api/proxy-image?url=https://cards.lorcast.io/...
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Only allow lorcast.io images
  if (!url.startsWith("https://cards.lorcast.io/")) {
    return new NextResponse("Invalid image URL", { status: 403 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/avif";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
