"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/auth-context";
import { readMyRegistrationsApiV1RegistrationsMeGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import { RegistrationPublic } from "@/lib/client/types.gen";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, MapPinIcon, SchoolIcon, UserIcon } from "lucide-react";
import Link from "next/link";

interface RegistrationCardProps {
  registration: RegistrationPublic;
}

function RegistrationCard({ registration: reg }: RegistrationCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  {reg.trip?.title || "Unknown Trip"}
                  <Badge
                    variant={
                      reg.status === "confirmed"
                        ? "default"
                        : reg.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {reg.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {reg.trip?.location || "N/A"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{reg.student_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Trip Date:</span>
                <span className="font-medium">
                  {reg.trip?.date
                    ? new Date(reg.trip.date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </div>
        <div className="p-4 flex items-center justify-center md:border-l w-40">
          {reg.status === "pending" && (
            <Button asChild variant="default" size="sm">
              <Link href={`/trips/${reg.trip_id}/payment/${reg.id}`}>
                Complete Payment
              </Link>
            </Button>
          )}
          {reg.status === "confirmed" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/trips/${reg.trip_id}`}>View Trip</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function RegistrationList({
  registrations,
}: {
  registrations: RegistrationPublic[];
}) {
  if (registrations.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardHeader>
          <CardTitle>No registrations found</CardTitle>
          <CardDescription>{`You haven't registered any students for upcoming trips yet.`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/trips">Browse Available Trips</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {registrations.map((reg) => (
        <RegistrationCard key={reg.id} registration={reg} />
      ))}
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="grid gap-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
        </Card>
      ))}
    </div>
  );
}

export function ParentHomeFeature() {
  const { user } = useAuth();

  const {
    data: registrationsData,
    isLoading,
    error,
  } = useQuery({
    ...readMyRegistrationsApiV1RegistrationsMeGetOptions(),
    enabled: !!user && !user.is_superuser,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold text-destructive">
          Error loading dashboard
        </h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const registrations = registrationsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.full_name || user?.email}
        </h2>
        <p className="text-muted-foreground">
          Manage your student registrations and upcoming school trips.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <SchoolIcon className="size-5" />
          My Registrations
        </h3>
        <RegistrationList registrations={registrations} />
      </div>
    </div>
  );
}
