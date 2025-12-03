import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public/uploads", filename);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";

    if (extension === ".jpg" || extension === ".jpeg") contentType = "image/jpeg";
    if (extension === ".png") contentType = "image/png";
    if (extension === ".gif") contentType = "image/gif";
    if (extension === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
