import { getSession } from "@/lib/session";
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

const UPLOAD_DIRS = {
  property: "properties",
  profile: "users/profiles",
  roommate: "users/roommates",
};

type UploadType = keyof typeof UPLOAD_DIRS;

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

    // Validate type
    if (!Object.keys(UPLOAD_DIRS).includes(type)) {
      logger.warn("Invalid upload type", { userId: session.user.id, type });
      return NextResponse.json(
        { error: "Invalid upload type. Allowed: property, profile, roommate" },
        { status: 400 }
      );
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
    
    // Determine storage directory
    const subDir = UPLOAD_DIRS[type as UploadType];
    const uploadDir = path.join(process.cwd(), "public/uploads", subDir);
    
    // Ensure directory exists
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (err) {
        logger.error("Failed to create upload directory", { error: String(err) });
        return NextResponse.json({ error: "Server storage error" }, { status: 500 });
    }

    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    // Construct URL with subdirectories
    // Note: Windows uses backslashes, but URLs must use forward slashes
    const fileUrl = `/uploads/${subDir}/${filename}`.replace(/\\/g, "/");

    logger.info("File uploaded successfully", { 
      userId: session.user.id, 
      filename, 
      type,
      size: file.size 
    });

    // NOTE: We no longer automatically update the user profile here.
    // The client is responsible for associating the returned URL with the correct entity (User or Listing).

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
