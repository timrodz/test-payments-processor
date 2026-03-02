"use client";

import { useQuery } from "@tanstack/react-query";
import { readTripsApiV1TripsGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-context";
import { TripPublic } from "@/lib/client/types.gen";

interface TripCardProps {
  trip: TripPublic;
  isSuperuser: boolean;
}

function TripCard({ trip, isSuperuser }: TripCardProps) {
  const isFull =
    !!trip.registration_count &&
    !!trip.max_students &&
    trip.registration_count >= trip.max_students;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap font-mono">
            ${Number(trip.cost).toFixed(2)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPinIcon className="size-3" />
          {trip.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {trip.description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span>{new Date(trip.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            <span className={isFull ? "text-destructive" : ""}>
              {`${trip.registration_count ?? 0} / ${trip.max_students} students registered`}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {isSuperuser ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/trips/${trip.id}/edit`}>Edit Details</Link>
          </Button>
        ) : isFull ? (
          <Button disabled variant="outline" className="w-full">
            Full - No Spots Left
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/trips/${trip.id}`}>View Details & Register</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function TripList({
  trips,
  isSuperuser,
}: {
  trips: TripPublic[];
  isSuperuser: boolean;
}) {
  if (trips.length === 0) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold">No trips available</h2>
        <p className="text-muted-foreground">
          Check back later for upcoming field trips.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} isSuperuser={isSuperuser} />
      ))}
    </div>
  );
}

function TripSkeletonList({ count }: { count: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-24 bg-muted" />
          <CardContent className="h-32" />
        </Card>
      ))}
    </div>
  );
}

export default function TripsPage() {
  const { user } = useAuth();
  const {
    data: tripsData,
    isLoading,
    error,
  } = useQuery({
    ...readTripsApiV1TripsGetOptions(),
  });
  console.log("tripss", tripsData);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Available Trips</h2>
        </div>
        <TripSkeletonList count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold text-destructive">
          Error loading trips
        </h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const trips = tripsData?.data || [];
  const isSuperuser = !!user?.is_superuser;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Available Trips</h2>
        {isSuperuser && (
          <Button asChild>
            <Link href="/trips/new">
              <PlusIcon className="mr-2 size-4" />
              Create Trip
            </Link>
          </Button>
        )}
      </div>

      <TripList trips={trips} isSuperuser={isSuperuser} />
    </div>
  );
}
