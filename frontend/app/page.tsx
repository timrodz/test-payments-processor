"use client";

import { useAuth } from "@/providers/auth-context";
import { ParentHomeFeature } from "@/features/home/parent-home-feature";
import { SuperuserHomeFeature } from "@/features/home/superuser-home-feature";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="space-y-4 pt-8">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-32 w-full bg-muted rounded" />
          <div className="h-32 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (user?.is_superuser) {
    return <SuperuserHomeFeature />;
  }

  return <ParentHomeFeature />;
}
