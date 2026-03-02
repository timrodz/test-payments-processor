"use client";

import { useQuery } from "@tanstack/react-query";
import { readTripByIdApiV1TripsTripIdGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ChevronLeftIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-context";

export default function TripDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const tripId = params.trip_id?.toString() ?? "";

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery({
    ...readTripByIdApiV1TripsTripIdGetOptions({
      path: { trip_id: tripId },
    }),
  });

  const isFull =
    trip &&
    !!trip.registration_count &&
    !!trip.max_students &&
    trip.registration_count >= trip.max_students;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-8 w-24 animate-pulse bg-muted rounded" />
        <Card className="animate-pulse">
          <CardHeader className="h-24 bg-muted" />
          <CardContent className="h-64" />
        </Card>
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
          The trip you are looking for does not exist or could not be loaded.
        </p>
        <Button asChild variant="outline">
          <Link href="/trips">Back to Trips</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/trips">
            <ChevronLeftIcon className="mr-1 size-4" />
            Back to Trips
          </Link>
        </Button>

        {user?.is_superuser && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/trips/${tripId}/edit`}>
              <PencilIcon className="mr-2 size-4" />
              Edit Trip
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{trip.title}</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="size-4" />
            <span>{trip.location}</span>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono">
          ${Number(trip.cost).toFixed(2)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Trip Date</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {new Date(trip.date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Availability</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <UsersIcon className="size-5 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {trip.registration_count ?? 0} / {trip.max_students} Students
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {trip.description}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 pt-4">
        {isFull ? (
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" className="w-full sm:w-auto px-8" disabled>
              Register Student
            </Button>
            <p className="text-sm font-medium text-destructive">
              This trip has reached its maximum capacity.
            </p>
          </div>
        ) : (
          <Button size="lg" className="w-full sm:w-auto px-8" asChild>
            <Link href={`/trips/${tripId}/register`}>Register Student</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
