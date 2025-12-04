"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, ListingFormData } from "@/lib/schemas";
import { useDebounce } from "@/lib/hooks/useDebounce";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";
import Image from "next/image";

type Step = "BASIC" | "SPECS" | "AMENITIES" | "LOCATION" | "DETAILS" | "IMAGES";

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AMENITIES_LIST = [
  "Wifi", "Parking", "Laundry", "Air Conditioning", "Heating", 
  "Dishwasher", "Balcony", "Gym", "Pool", "Elevator", 
  "Wheelchair Access", "Pets Allowed", "Furnished", "Utilities Included"
];

export default function AddListingModal({ isOpen, onClose, onSuccess }: AddListingModalProps) {
  const [step, setStep] = useState<Step>("BASIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      roomType: "private",
      amenities: [],
      images: [],
      moveInDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 1000);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("listing_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        Object.entries(parsed).forEach(([key, value]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(key as keyof ListingFormData, value as any);
        });
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, [setValue]);

  // Save draft on change
  useEffect(() => {
    // Only save if we have some data and it's not just the defaults (heuristically)
    // Or just save everything.
    if (Object.keys(debouncedValues).length > 0) {
      localStorage.setItem("listing_draft", JSON.stringify(debouncedValues));
    }
  }, [debouncedValues]);

  const selectedAmenities = watch("amenities") || [];

  const nextStep = async (next: Step) => {
    let fieldsToValidate: (keyof ListingFormData)[] = [];

    if (step === "BASIC") fieldsToValidate = ["title", "description", "propertyType", "roomType"];
    if (step === "SPECS") fieldsToValidate = ["bedrooms", "bathrooms", "sqft", "maxOccupants"];
    // AMENITIES doesn't need validation (optional)
    if (step === "LOCATION") fieldsToValidate = ["address", "city", "state", "zipCode"];
    if (step === "DETAILS") fieldsToValidate = ["rentAmount", "moveInDate", "leaseTerm"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(next);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities;
    if (current.includes(amenity)) {
      setValue("amenities", current.filter(a => a !== amenity));
    } else {
      setValue("amenities", [...current, amenity]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "property");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const newImages = [...images, data.url];
      setImages(newImages);
      setValue("images", newImages);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData.error) || "Failed to create listing");
      }

      localStorage.removeItem("listing_draft");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Create listing error:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps: Step[] = ["BASIC", "SPECS", "AMENITIES", "LOCATION", "DETAILS", "IMAGES"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--glass-text)]">List Your Place</h2>
          <button onClick={onClose} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]">
            ✕
          </button>
        </div>

        <div className="mb-8 flex justify-between items-center px-4 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className={`flex flex-col items-center gap-1 min-w-[60px] ${
              steps.indexOf(step) >= i ? "opacity-100" : "opacity-40"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                 steps.indexOf(step) >= i 
                 ? "bg-blue-600 text-white" 
                 : "bg-gray-700 text-gray-400"
              }`}>
                {i + 1}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">{s}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === "BASIC" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <GlassInput {...register("title")} placeholder="Cozy room in downtown apartment" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  {...register("description")}
                  className="w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                  placeholder="Tell us about the place..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select {...register("propertyType")} className="glass-input w-full p-3 rounded-xl bg-white/5 border border-[var(--glass-border)] text-[var(--glass-text)]">
                    <option value="">Select Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                  </select>
                  {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Room Type</label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" value="private" {...register("roomType")} className="sr-only peer" />
                      <div className="p-3 rounded-xl border border-[var(--glass-border)] text-center peer-checked:bg-blue-600 peer-checked:text-white transition-all">
                        Private
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" value="shared" {...register("roomType")} className="sr-only peer" />
                      <div className="p-3 rounded-xl border border-[var(--glass-border)] text-center peer-checked:bg-blue-600 peer-checked:text-white transition-all">
                        Shared
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <GlassButton type="button" onClick={() => nextStep("SPECS")} className="w-full mt-4">
                Next: Specifications
              </GlassButton>
            </div>
          )}

          {step === "SPECS" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <GlassInput type="number" {...register("bedrooms", { valueAsNumber: true })} />
                  {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <GlassInput type="number" {...register("bathrooms", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Square Footage</label>
                  <GlassInput type="number" {...register("sqft", { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Occupants</label>
                  <GlassInput type="number" {...register("maxOccupants", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("BASIC")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="button" onClick={() => nextStep("AMENITIES")} className="flex-1">
                  Next: Amenities
                </GlassButton>
              </div>
            </div>
          )}

          {step === "AMENITIES" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-semibold mb-4">What does this place offer?</h3>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES_LIST.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--glass-border)] cursor-pointer hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="w-5 h-5 rounded border-[var(--glass-border)] bg-transparent text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("SPECS")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="button" onClick={() => nextStep("LOCATION")} className="flex-1">
                  Next: Location
                </GlassButton>
              </div>
            </div>
          )}

          {step === "LOCATION" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-end">
                <GlassButton 
                  type="button" 
                  size="sm" 
                  variant="secondary"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async () => {
                         // In a real app, use Google Maps Geocoding API here
                         // For now, we'll simulate a detected location
                         setValue("city", "New York");
                         setValue("state", "NY");
                         setValue("zipCode", "10001");
                         // Trigger validation for these fields
                         trigger(["city", "state", "zipCode"]);
                      }, () => {
                        alert("Could not detect location. Please enter manually.");
                      });
                    }
                  }}
                >
                  📍 Detect My Location
                </GlassButton>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <GlassInput {...register("address")} placeholder="123 Main St" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <GlassInput {...register("city")} />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <GlassInput {...register("state")} />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Zip Code</label>
                <GlassInput {...register("zipCode")} />
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
              </div>

              {/* Map Placeholder */}
              <div className="mt-4 h-48 rounded-xl bg-gray-800 flex items-center justify-center border border-[var(--glass-border)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=New+York&zoom=13&size=600x300&sensor=false&key=YOUR_API_KEY_HERE')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all" />
                <div className="z-10 text-center">
                  <p className="text-lg font-semibold">📍 Map Location</p>
                  <p className="text-xs text-[var(--glass-text-muted)]">Pinpoint exact location (Coming Soon)</p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("AMENITIES")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="button" onClick={() => nextStep("DETAILS")} className="flex-1">
                  Next: Details
                </GlassButton>
              </div>
            </div>
          )}

          {step === "DETAILS" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
               <div>
                <label className="block text-sm font-medium mb-1">Monthly Rent ($)</label>
                <GlassInput type="number" {...register("rentAmount", { valueAsNumber: true })} />
                {errors.rentAmount && <p className="text-red-500 text-xs mt-1">{errors.rentAmount.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Availability (Move-in Date)</label>
                  <GlassInput type="date" {...register("moveInDate")} />
                  {errors.moveInDate && <p className="text-red-500 text-xs mt-1">{errors.moveInDate.message}</p>}
                  <p className="text-[10px] text-[var(--glass-text-muted)] mt-1">Date the room becomes available</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lease Term (Months)</label>
                  <GlassInput type="number" {...register("leaseTerm", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("LOCATION")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="button" onClick={() => nextStep("IMAGES")} className="flex-1">
                  Next: Images
                </GlassButton>
              </div>
            </div>
          )}

          {step === "IMAGES" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 text-center hover:bg-white/5 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {uploading ? (
                  <div className="animate-pulse text-[var(--glass-text-muted)]">Uploading...</div>
                ) : (
                  <div className="text-[var(--glass-text-muted)]">
                    <p className="text-2xl mb-2">📸</p>
                    <p>Click to upload images</p>
                    <p className="text-xs mt-1 opacity-60">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <Image src={url} alt={`Listing ${idx + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = images.filter((_, i) => i !== idx);
                          setImages(newImages);
                          setValue("images", newImages);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("DETAILS")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="submit" isLoading={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 border-none">
                  Publish Listing
                </GlassButton>
              </div>
            </div>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
