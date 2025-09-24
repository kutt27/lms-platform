"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  bio?: string;
  website?: string;
  image?: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refetch: fetchProfile };
}
