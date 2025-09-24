"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSignOut() {
  const router = useRouter();

  const handleSignOut = async function signOut() {
    try {
      console.log("Starting logout...");
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log("Logout successful, redirecting...");
            router.push("/");
            toast.success("Signed out successfully");
          },
          onError: (error) => {
            console.error("Logout error:", error);
          },
        },
      });
      console.log("Logout completed");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return handleSignOut;
}
