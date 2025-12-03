type LogLevel = "info" | "warn" | "error";

export const logger = {
  log: async (level: LogLevel, message: string, context?: Record<string, any>) => {
    // Always log to console in development
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
      await fetch("/api/log", {
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
      // Fallback to console if network logging fails
      console.error("Failed to send log to server:", err);
    }
  },

  info: (message: string, context?: Record<string, any>) => logger.log("info", message, context),
  warn: (message: string, context?: Record<string, any>) => logger.log("warn", message, context),
  error: (message: string, context?: Record<string, any>) => logger.log("error", message, context),
};
