"use client";

import { useQuery } from "@tanstack/react-query";
import {
  readTripByIdApiV1TripsTripIdGetOptions,
  readPaymentByIdApiV1PaymentsPaymentIdGetOptions,
  readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions,
} from "@/lib/client/@tanstack/react-query.gen";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2Icon,
  Loader2Icon,
  PrinterIcon,
  HomeIcon,
} from "lucide-react";
import Link from "next/link";

export default function ConfirmationPage() {
  const params = useParams();
  const tripId = params.trip_id?.toString() ?? "";
  const paymentId = params.payment_id?.toString() ?? "";

  const { data: payment, isLoading: isPaymentLoading } = useQuery({
    ...readPaymentByIdApiV1PaymentsPaymentIdGetOptions({
      path: { payment_id: paymentId },
    }),
  });

  const registrationId = payment?.registration_id.toString() ?? "";

  const { data: registration, isLoading: isRegistrationLoading } = useQuery({
    ...readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions({
      path: { registration_id: registrationId },
    }),
    enabled: !!registrationId,
  });

  const { data: trip, isLoading: isTripLoading } = useQuery({
    ...readTripByIdApiV1TripsTripIdGetOptions({
      path: { trip_id: tripId },
    }),
  });

  if (isPaymentLoading || isRegistrationLoading || isTripLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (!payment || !registration || !trip) {
    return <div>Data not found</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center justify-center gap-4 text-center py-6">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
          <CheckCircle2Icon className="size-16 text-green-600 dark:text-green-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground text-lg">
            Registration confirmed for{" "}
            <span className="font-semibold text-foreground">
              {registration.student_name}
            </span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>
            A confirmation email has been sent to {registration.parent_email}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Trip</span>
            <span className="font-medium text-right">{trip.title}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-right">
              {new Date(trip.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium text-right">{trip.location}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Student Name</span>
            <span className="font-medium text-right">
              {registration.student_name}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-medium text-right font-mono">
              ${Number(payment.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              Transaction ID
            </span>
            <span className="text-sm font-mono text-right">
              {payment.transaction_id || "N/A"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.print()}
          >
            <PrinterIcon className="mr-2 size-4" />
            Print Receipt
          </Button>
          <Button asChild className="w-full">
            <Link href="/">
              <HomeIcon className="mr-2 size-4" />
              Back to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {`If you have any questions, please contact the school office.`}
      </p>
    </div>
  );
}
