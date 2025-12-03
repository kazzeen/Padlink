import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { level, message, context, timestamp } = body;

    // In a real production app, you would send this to a service like Sentry, Datadog, or write to a file/DB.
    // For now, we'll log to the server console with a structured format.
    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      level: level || "info",
      userId: session?.user?.id || "anonymous",
      message,
      context,
    };

    console.log(`[CLIENT_LOG]`, JSON.stringify(logEntry));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process log entry:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
