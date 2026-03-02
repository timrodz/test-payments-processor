"use client";

import { useQuery } from "@tanstack/react-query";
import { readTripByIdApiV1TripsTripIdGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import { TripFormFeature } from "@/features/trips/trip-form-feature";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";
import { Loader2Icon } from "lucide-react";

export default function EditTripPage() {
  const { user } = useAuth();
  const params = useParams();
  const tripId = params.trip_id?.toString() ?? "";

  if (user && !user.is_superuser) {
    redirect("/");
  }

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery({
    ...readTripByIdApiV1TripsTripIdGetOptions({
      path: { trip_id: tripId },
    }),
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold text-destructive">
          Error loading trip
        </h2>
        <p className="text-muted-foreground">
          Trip not found or an error occurred.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Edit Trip</h2>
        <p className="text-muted-foreground">
          Update the details for {trip.title}.
        </p>
      </div>
      <TripFormFeature trip={trip} />
    </div>
  );
}
