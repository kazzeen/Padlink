import ProfileForm from "@/components/Forms/ProfileForm";
import WalletAccounts from "@/components/Profile/WalletAccounts";

export const metadata = {
  title: "Profile - PadLink",
  description: "Manage your profile and preferences",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--glass-text)] drop-shadow-md">Your Profile</h1>
        <p className="mt-2 text-[var(--glass-text-muted)]">
          Update your personal information and roommate preferences to find better matches.
        </p>
      </div>
      
      <ProfileForm />

      <WalletAccounts />
    </div>
  );
}
