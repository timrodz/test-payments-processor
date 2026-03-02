"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  readTripByIdApiV1TripsTripIdGetOptions,
  createRegistrationApiV1RegistrationsPostMutation,
} from "@/lib/client/@tanstack/react-query.gen";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/providers/auth-context";

export default function RegisterPage() {
  const params = useParams();
  const tripId = params.trip_id?.toString() ?? "";
  const router = useRouter();
  const { user } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState(user?.full_name || "");
  const [parentEmail, setParentEmail] = useState(user?.email || "");

  const { data: trip, isLoading: isTripLoading } = useQuery({
    ...readTripByIdApiV1TripsTripIdGetOptions({
      path: { trip_id: tripId },
    }),
  });

  const registrationMutation = useMutation(
    createRegistrationApiV1RegistrationsPostMutation(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const registration = await registrationMutation.mutateAsync({
        body: {
          trip_id: tripId,
          student_name: studentName,
          parent_name: parentName,
          parent_email: parentEmail,
        },
      });

      router.push(`/trips/${tripId}/payment/${registration.id}`);
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  if (isTripLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const isFull =
    !!trip.registration_count &&
    !!trip.max_students &&
    trip.registration_count >= trip.max_students;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/trips/${tripId}`}>
          <ChevronLeftIcon className="mr-1 size-4" />
          Back to Trip Details
        </Link>
      </Button>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Trip Registration</h2>
        <p className="text-muted-foreground">
          Registering for:{" "}
          <span className="font-medium text-foreground">{trip.title}</span>
        </p>
      </div>

      {isFull && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold text-center">
            This trip is at full capacity. We cannot accept any more
            registrations at this time.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Enter the details of the student participating in the trip.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Full Name</Label>
              <Input
                id="studentName"
                placeholder="John Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                disabled={isFull}
              />
            </div>
          </CardContent>
          <CardHeader className="pt-0">
            <CardTitle>Parent/Guardian Contact</CardTitle>
            <CardDescription>{`We'll use this information for confirmation and emergency contact.`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Full Name</Label>
              <Input
                id="parentName"
                placeholder="Jane Doe"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
                disabled={isFull}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Email Address</Label>
              <Input
                id="parentEmail"
                type="email"
                placeholder="jane@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
                disabled={isFull}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registrationMutation.isPending || isFull}
            >
              {registrationMutation.isPending && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              Continue to Payment
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to the trip terms and conditions.
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
