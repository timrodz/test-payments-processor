"use client";

import { TripFormFeature } from "@/features/trips/trip-form-feature";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";

export default function NewTripPage() {
  const { user } = useAuth();

  if (user && !user.is_superuser) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Create New Trip</h2>
        <p className="text-muted-foreground">
          Fill in the details for the upcoming field trip.
        </p>
      </div>
      <TripFormFeature />
    </div>
  );
}
