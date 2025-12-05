type LogLevel = "info" | "warn" | "error";

export const logger = {
  log: async (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      switch (level) {
        case "info":
          console.info(message, context || "");
          break;
        case "warn":
          console.warn(message, context || "");
          break;
        case "error":
          console.error(message, context || "");
          break;
        default:
          console.log(message, context || "");
      }
    }

    try {
      if (process.env.NODE_ENV === "test") {
        return;
      }
      const base = typeof window === "undefined" ? (process.env.APP_BASE_URL || "http://localhost:3000") : "";
      await fetch(`${base}/api/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Failed to send log to server:", err);
    }
  },

  info: (message: string, context?: Record<string, unknown>) => logger.log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => logger.log("error", message, context),
};
