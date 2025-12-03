"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";
import ImageUpload from "@/components/ui/ImageUpload";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  age: z.number().min(18).max(120).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  preferences: z.object({
    minBudget: z.number().min(0),
    maxBudget: z.number().min(0),
    preferredCities: z.string().min(2, "Please enter at least one city"), // We'll parse this comma-separated string
    commutDistance: z.number().min(0),
    sleepSchedule: z.enum(["early_bird", "night_owl", "flexible"]),
    cleanlinesLevel: z.number().min(1).max(5),
    socialPreference: z.enum(["introvert", "extrovert", "ambivert"]),
    smokingStatus: z.enum(["non_smoker", "smoker", "okay_with_smoker"]),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues, // Add getValues
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      preferences: {
        minBudget: 0,
        maxBudget: 2000,
        preferredCities: "",
        commutDistance: 10,
        sleepSchedule: "flexible",
        cleanlinesLevel: 3,
        socialPreference: "ambivert",
        smokingStatus: "non_smoker",
      },
    },
  });

  const handleImageUpload = (url: string) => {
    reset((formValues) => ({
      ...formValues,
      avatar: url,
    }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          
          let formattedPreferences = undefined;
          if (data.preferences) {
             // Parse cities if it's a JSON string, otherwise leave as is (though it should be a string in DB)
            let citiesStr = "";
            try {
                const parsed = JSON.parse(data.preferences.preferredCities);
                if (Array.isArray(parsed)) citiesStr = parsed.join(", ");
                else citiesStr = String(parsed);
            } catch {
                citiesStr = data.preferences.preferredCities || "";
            }

            formattedPreferences = {
              ...data.preferences,
              preferredCities: citiesStr,
            };
          }

          reset({
            name: data.name || "",
            age: data.age,
            bio: data.bio,
            preferences: formattedPreferences || {
                minBudget: 0,
                maxBudget: 2000,
                preferredCities: "",
                commutDistance: 10,
                sleepSchedule: "flexible",
                cleanlinesLevel: 3,
                socialPreference: "ambivert",
                smokingStatus: "non_smoker",
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setIsFetching(false);
      }
    };

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, reset]);

  useEffect(() => {
    // Prefetch dashboard for faster transition
    router.prefetch("/dashboard");

    let timer: NodeJS.Timeout;
    if (redirectCountdown !== null && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0) {
      router.push("/dashboard");
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage("");
    try {
      // Process cities string into array
      const citiesArray = data.preferences.preferredCities
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const payload = {
        ...data,
        preferences: {
            ...data.preferences,
            preferredCities: citiesArray, // Send as array, API will stringify
        }
      };

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setRedirectCountdown(3); // Start countdown
      } else {
        const errData = await response.json();
        const errorMsg = errData.error || "Failed to update profile";
        setMessage(errorMsg);
        logger.error("Profile update failed", { error: errorMsg, validationDetails: errData.details });
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      logger.error("Profile update exception", { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="text-[var(--glass-text)] text-center text-lg">Loading profile...</div>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 max-w-2xl mx-auto"
    >
      <GlassCard className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--glass-text)] mb-6">Basic Info</h2>
        
        <div className="flex justify-center mb-6">
           <ImageUpload 
             currentImage={getValues("avatar") || session?.user?.image || null}
             onUploadComplete={handleImageUpload}
           />
           {/* Hidden input to register avatar field */}
           <input type="hidden" {...register("avatar")} />
        </div>

        <div className="space-y-4">
          <GlassInput
            label="Full Name"
            {...register("name")}
            placeholder="Your name"
            error={errors.name?.message}
          />

          <GlassInput
            label="Age"
            {...register("age", { valueAsNumber: true })}
            type="number"
            placeholder="Your age"
            error={errors.age?.message}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">
              Bio
            </label>
            <textarea
              {...register("bio")}
              className="glass-input w-full px-4 py-3 rounded-xl transition-all duration-200 placeholder-gray-500 dark:placeholder-white/40 focus:border-gray-400 dark:focus:border-white/60 focus:outline-none focus:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              placeholder="Tell us about yourself"
              rows={4}
            />
            {errors.bio && (
              <p className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1 animate-pulse">{errors.bio.message}</p>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--glass-text)] mb-6">Preferences</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassInput
                label="Min Budget ($)"
                {...register("preferences.minBudget", { valueAsNumber: true })}
                type="number"
            />
            <GlassInput
                label="Max Budget ($)"
                {...register("preferences.maxBudget", { valueAsNumber: true })}
                type="number"
            />
        </div>

        <GlassInput
            label="Preferred Cities (comma separated)"
            {...register("preferences.preferredCities")}
            placeholder="New York, Boston, Austin"
            error={errors.preferences?.preferredCities?.message}
        />

        <GlassInput
            label="Commute Distance (miles)"
            {...register("preferences.commutDistance", { valueAsNumber: true })}
            type="number"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">Sleep Schedule</label>
                <select
                    {...register("preferences.sleepSchedule")}
                    className="glass-input w-full px-4 py-3 rounded-xl text-[var(--glass-text)]"
                >
                    <option value="early_bird" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Early Bird</option>
                    <option value="night_owl" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Night Owl</option>
                    <option value="flexible" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Flexible</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">Social Preference</label>
                <select
                    {...register("preferences.socialPreference")}
                    className="glass-input w-full px-4 py-3 rounded-xl text-[var(--glass-text)]"
                >
                    <option value="introvert" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Introvert</option>
                    <option value="extrovert" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Extrovert</option>
                    <option value="ambivert" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Ambivert</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">Cleanliness Level (1-5)</label>
                <input
                    {...register("preferences.cleanlinesLevel", { valueAsNumber: true })}
                    type="range"
                    min="1"
                    max="5"
                    className="w-full accent-blue-600 dark:accent-white"
                />
                <div className="flex justify-between text-xs text-[var(--glass-text)] opacity-70">
                    <span>Messy</span>
                    <span>Clean</span>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">Smoking</label>
                <select
                    {...register("preferences.smokingStatus")}
                    className="glass-input w-full px-4 py-3 rounded-xl text-[var(--glass-text)]"
                >
                    <option value="non_smoker" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Non-smoker</option>
                    <option value="smoker" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Smoker</option>
                    <option value="okay_with_smoker" className="bg-white dark:bg-[#0a192f] text-black dark:text-white">Okay with smoker</option>
                </select>
            </div>
        </div>
      </GlassCard>

      {message && (
        <GlassCard
          className={`p-4 rounded-xl ${
            message.includes("successfully")
              ? "bg-green-500/20 border-green-400/30 text-green-800 dark:text-green-100"
              : "bg-red-500/20 border-red-400/30 text-red-800 dark:text-red-100"
          }`}
        >
          {message}
          {redirectCountdown !== null && (
             <div className="mt-2 font-semibold text-[var(--glass-text)]">
                Redirecting to dashboard in {redirectCountdown}...
             </div>
          )}
           {/* Manual fallback link if redirect fails or user wants to go immediately */}
          {message.includes("successfully") && (
             <div className="mt-2">
                <Link href="/dashboard" className="text-blue-600 dark:text-white underline hover:text-blue-800 dark:hover:text-white/80">
                    Go to Dashboard now
                </Link>
             </div>
          )}
        </GlassCard>
      )}

      <GlassButton
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? "Saving..." : "Save Profile"}
      </GlassButton>
    </form>
  );
}
