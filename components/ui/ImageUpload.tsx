"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import GlassButton from "@/components/ui/glass/GlassButton";

interface ImageUploadProps {
  currentImage?: string | null;
  onUploadComplete: (url: string) => void;
}

export default function ImageUpload({ currentImage, onUploadComplete }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload JPG, PNG, GIF, or WEBP");
      return;
    }

    setError("");
    setUploading(true);

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Check dimensions
    const img = new window.Image();
    img.src = objectUrl;
    img.onload = async () => {
      if (img.width < 100 || img.height < 100) {
        setError("Image must be at least 100x100 pixels");
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        onUploadComplete(data.url);
        setPreview(data.url); // Update with server URL
      } catch (err: any) {
        setError(err.message);
        // Revert preview on error
        setPreview(currentImage || null);
      } finally {
        setUploading(false);
      }
    };
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg group">
        {preview ? (
          <Image
            src={preview}
            alt="Profile Preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center text-4xl">
            👤
          </div>
        )}
        
        <div 
            onClick={triggerFileInput}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
            <span className="text-white text-sm font-medium">Change</span>
        </div>
      </div>

      <div className="text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <GlassButton 
            type="button" 
            onClick={triggerFileInput} 
            variant="secondary" 
            size="sm"
            disabled={uploading}
        >
            {uploading ? "Uploading..." : "Upload New Photo"}
        </GlassButton>
        
        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}
        <p className="text-[var(--glass-text-muted)] text-xs mt-2">
            Max 5MB. JPG, PNG, GIF.
        </p>
      </div>
    </div>
  );
}
