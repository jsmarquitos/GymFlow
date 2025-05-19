import { ProfileClient } from "@/components/profile/ProfileClient";

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Member Profile</h1>
      <ProfileClient />
    </div>
  );
}
