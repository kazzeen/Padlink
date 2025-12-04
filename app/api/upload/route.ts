import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
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
    const extension = MIME_TYPE_MAP[file.type] || "bin";
    const filename = `${uuidv4()}.${extension}`;
    
    // Store locally in public/uploads
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Ensure directory exists
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (err) {
        logger.error("Failed to create upload directory", { error: String(err) });
        return NextResponse.json({ error: "Server storage error" }, { status: 500 });
    }

    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    const fileUrl = `/uploads/${filename}`;

    // Update user profile with new avatar URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        avatar: fileUrl,
        image: fileUrl // Update standard NextAuth image field too
      },
    });

    logger.info("File uploaded successfully", { userId: session.user.id, filename, size: file.size });

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Upload error:", { error: errorMessage });
    return NextResponse.json(
      { error: `Failed to upload file: ${errorMessage}` },
      { status: 500 }
    );
  }
}
