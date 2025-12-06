"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema, ListingFormData } from "@/lib/schemas";
import GlassCard from "@/components/ui/glass/GlassCard";
import GlassButton from "@/components/ui/glass/GlassButton";
import GlassInput from "@/components/ui/glass/GlassInput";
import { Listing } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Step = "BASIC" | "SPECS" | "AMENITIES" | "LOCATION" | "DETAILS" | "IMAGES";

interface EditListingClientProps {
  listing: Listing;
}

const AMENITIES_LIST = [
  "Wifi", "Parking", "Laundry", "Air Conditioning", "Heating", 
  "Dishwasher", "Balcony", "Gym", "Pool", "Elevator", 
  "Wheelchair Access", "Pets Allowed", "Furnished", "Utilities Included"
];

export default function EditListingClient({ listing }: EditListingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("BASIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(listing.images || []);
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
      title: listing.title,
      description: listing.description || "",
      propertyType: listing.propertyType || "",
      roomType: listing.roomType as "private" | "shared",
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft || undefined,
      maxOccupants: listing.maxOccupants || undefined,
      rentAmount: listing.rentAmount,
      moveInDate: new Date(listing.moveInDate).toISOString().split('T')[0],
      leaseTerm: listing.leaseTerm,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode,
      amenities: listing.amenities || [],
      images: listing.images || [],
    },
  });

  const selectedAmenities = watch("amenities") || [];

  const nextStep = async (next: Step) => {
    let fieldsToValidate: (keyof ListingFormData)[] = [];

    if (step === "BASIC") fieldsToValidate = ["title", "description", "propertyType", "roomType"];
    if (step === "SPECS") fieldsToValidate = ["bedrooms", "bathrooms", "sqft", "maxOccupants"];
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
    if (!confirm("Are you sure you want to save these changes?")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData.error) || "Failed to save listing");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Save listing error:", error);
      alert("Failed to save listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Step[] = ["BASIC", "SPECS", "AMENITIES", "LOCATION", "DETAILS", "IMAGES"];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--glass-text)]">Edit Listing</h1>
        <GlassButton variant="secondary" onClick={() => router.back()}>Cancel</GlassButton>
      </div>

      <GlassCard className="p-8">
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
                    <p>Click or drag to upload photos</p>
                    <p className="text-xs mt-1">Supports JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image src={img} alt="Listing" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = images.filter((_, idx) => idx !== i);
                        setImages(newImages);
                        setValue("images", newImages);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setStep("DETAILS")} className="flex-1">
                  Back
                </GlassButton>
                <GlassButton type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </GlassButton>
              </div>
            </div>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
