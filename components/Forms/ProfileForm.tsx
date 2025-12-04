"use client";

import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/lib/schemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";
import ImageUpload from "@/components/ui/ImageUpload";

export default function ProfileForm() {
  const { data: session } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const lastValidationErrors = useRef<FieldErrors<ProfileFormData> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
    setError,
  } = useForm<ProfileFormData>({
    resolver: async (data, context, options) => {
      // Debug logging wrapper for the resolver
      console.log("Form Data being validated:", data);
      const result = await zodResolver(profileSchema)(data, context, options);
      console.log("Resolver Result:", result);
      
      if (Object.keys(result.errors).length > 0) {
        lastValidationErrors.current = result.errors;
      } else {
        lastValidationErrors.current = null;
      }
      
      return result;
    },
    defaultValues: {
      name: session?.user?.name || "",
      bio: "",
      age: undefined,
      avatar: "",
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
    setValue("avatar", url, { shouldDirty: true, shouldValidate: true });
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
                if (!data.preferences.preferredCities) {
                    citiesStr = "";
                } else {
                    const parsed = JSON.parse(data.preferences.preferredCities);
                    if (Array.isArray(parsed)) citiesStr = parsed.join(", ");
                    else citiesStr = String(parsed || "");
                }
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
            avatar: data.avatar || "",
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
    // Only re-run if user ID changes, not on every session object reference change
  }, [session?.user?.id, reset]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    
    if (redirectCountdown === 0) {
      // Use window.location.href for a full page reload to update session state in parent components
      window.location.href = "/dashboard";
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage("");
    console.log("Starting profile submission...", data);

    try {
      // Transform array to comma-separated string if needed for internal logic,
      // but actually the backend expects an array for preferredCities now?
      // Let's double check the API route. 
      // API route schema: preferredCities: z.array(z.string())
      // So we send the array directly.

      // Ensure preferredCities is an array of strings (not empty strings)
      const citiesArray = data.preferences.preferredCities
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const payload = {
        ...data,
        preferences: {
            ...data.preferences,
            preferredCities: citiesArray, 
        }
      };

      console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Profile updated successfully:", responseData);
        setMessage("Profile updated successfully!");
        setRedirectCountdown(3); // Start countdown
        // We will handle the reload/redirect in the useEffect for countdown
      } else {
        const errData = await response.json();
        console.error("API Error:", errData);
        setMessage(`Error: ${errData.error || "Failed to update profile"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setMessage("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: FieldErrors<ProfileFormData>) => {
    let effectiveErrors = errors;
    
    // Fallback to captured errors if RHF errors are empty but we captured some in resolver
    if (Object.keys(errors).length === 0 && lastValidationErrors.current && Object.keys(lastValidationErrors.current).length > 0) {
        console.warn("RHF errors empty, using captured errors from resolver");
        effectiveErrors = lastValidationErrors.current;
        
        // Manually set errors on the form to ensure UI updates
        (Object.keys(lastValidationErrors.current) as Array<keyof ProfileFormData>).forEach((key) => {
            const err = lastValidationErrors.current![key];
            // Handle nested errors (e.g. preferences.preferredCities)
            if (key === 'preferences' && err) {
                 Object.keys(err).forEach(subKey => {
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     if ((err as any)[subKey]) {
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         setError(`preferences.${subKey}` as any, (err as any)[subKey]);
                     }
                 });
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setError(key as any, err!);
            }
        });
    }

    console.error("Validation Errors (Raw):", effectiveErrors);
    
    // Log values for fields with errors to help debugging
    if (effectiveErrors.avatar) {
        console.error("Avatar Validation Error:", {
            message: effectiveErrors.avatar.message,
            type: effectiveErrors.avatar.type,
            value: getValues("avatar"),
            error: effectiveErrors.avatar
        });
    }
    
    // Helper to safely extract error messages recursively
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSafeErrors = (errs: any): any => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = {};
      Object.keys(errs).forEach((key) => {
        const value = errs[key];
        if (value && typeof value === "object") {
          if ("message" in value && typeof value.message === "string") {
            // It's a field error
            result[key] = value.message;
          } else if (key !== "ref") {
            // It's likely a nested group (e.g. preferences)
            const nested = getSafeErrors(value);
            if (Object.keys(nested).length > 0) {
              result[key] = nested;
            }
          }
        }
      });
      return result;
    };

    const safeErrors = getSafeErrors(effectiveErrors);
    console.error("Validation Errors (Safe):", safeErrors);
    
    setMessage("Please correct the errors in the form.");
  };

  if (isFetching) return <div className="text-[var(--glass-text)] text-center text-lg">Loading profile...</div>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
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
            <label htmlFor="bio" className="block text-sm font-medium text-[var(--glass-text)] opacity-90 mb-2 ml-1">
              Bio
            </label>
            <textarea
              id="bio"
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
