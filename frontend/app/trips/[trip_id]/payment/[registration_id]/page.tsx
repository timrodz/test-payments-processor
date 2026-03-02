"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  readTripByIdApiV1TripsTripIdGetOptions,
  readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions,
  submitPaymentApiV1PaymentsPostMutation,
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
import {
  ChevronLeftIcon,
  Loader2Icon,
  CreditCardIcon,
  LockIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function PaymentPage() {
  const params = useParams();
  const tripId = params.trip_id?.toString() ?? "";
  const registrationId = params.registration_id?.toString() ?? "";
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const { data: trip, isLoading: isTripLoading } = useQuery({
    ...readTripByIdApiV1TripsTripIdGetOptions({
      path: { trip_id: tripId },
    }),
  });

  const { data: registration, isLoading: isRegistrationLoading } = useQuery({
    ...readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions({
      path: { registration_id: registrationId },
    }),
  });

  const paymentMutation = useMutation(submitPaymentApiV1PaymentsPostMutation());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For a given input '11/12', evaluates to ['11/12', '11', '12']
    const monthYearRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    const match = expiryDate.match(monthYearRegex);

    if (!match || !Array.isArray(match) || match.length !== 3) {
      toast.error("Invalid expiry date format. Use MM/YY.");
      return;
    }

    const month = parseInt(match[1] ?? "");
    const year = 2000 + parseInt(match[2] ?? "");
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      toast.error("Your card has expired.");
      return;
    }

    if (!/^(4|5[1-5]|2(22[1-9]|2[3-9]|[3-6]|7[0-1]|720))/.test(cardNumber)) {
      toast.error("Only Visa and Mastercard are supported.");
      return;
    }

    try {
      const payment = await paymentMutation.mutateAsync({
        body: {
          registration_id: registrationId,
          card_number: cardNumber,
          expiry_date: expiryDate,
          cvv: cvv,
        },
      });

      if (payment.status === "success") {
        toast.success("Payment successful!");
        router.push(`/trips/${tripId}/confirmation/${payment.id}`);
      } else {
        toast.error(`Payment failed: ${payment.error_message}`);
      }
    } catch (error) {
      console.error("Payment failed", error);
      toast.error("Payment failed. Please check your card details.");
    }
  };

  if (isTripLoading || isRegistrationLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2Icon className="animate-spin" />
      </div>
    );
  }

  if (!trip || !registration) {
    return <div>Data not found</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/trips/${tripId}/register`}>
          <ChevronLeftIcon className="mr-1 size-4" />
          Back to Registration
        </Link>
      </Button>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Trip Payment</h2>
        <p className="text-muted-foreground">
          Confirm and pay for{" "}
          <span className="font-medium text-foreground">
            {`${registration.student_name}'s`}
          </span>{" "}
          registration.
        </p>
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm">
            <span>Trip: {trip.title}</span>
            <span className="font-bold">${Number(trip.cost).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Enter your credit card information below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))
                }
                required
                minLength={16}
                maxLength={16}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (MM/YY)</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  pattern="^(0[1-9]|1[0-2])\/[0-9]{2}$"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  required
                  minLength={3}
                  maxLength={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <Loader2Icon className="mr-2 size-5 animate-spin" />
              ) : (
                <LockIcon className="mr-2 size-5" />
              )}
              Pay ${Number(trip.cost).toFixed(2)}
            </Button>
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <LockIcon className="size-3" />
              Your payment is secure and encrypted.
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
