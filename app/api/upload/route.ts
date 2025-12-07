import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const MIME_TYPE_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      logger.warn("Upload attempt without session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "profile"; // Default to profile for backward compatibility

    if (!file) {
      logger.warn("Upload attempt without file", { userId: session.user.id });
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = Object.keys(MIME_TYPE_MAP);
    if (!validTypes.includes(file.type)) {
      logger.warn("Invalid file type uploaded", { userId: session.user.id, type: file.type });
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, GIF, WEBP" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      logger.warn("File too large", { userId: session.user.id, size: file.size });
      return NextResponse.json(
        { error: "File too large. Max size is 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    logger.info("File processed successfully (base64)", { 
      userId: session.user.id, 
      type,
      size: file.size 
    });

    return NextResponse.json({ url: dataUrl }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Upload error:", { error: errorMessage });
    return NextResponse.json(
      { error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    );
  }
}
