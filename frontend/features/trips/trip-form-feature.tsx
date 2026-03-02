"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createTripApiV1TripsPostMutation,
  deleteTripApiV1TripsTripIdDeleteMutation,
  readSchoolsApiV1SchoolsGetOptions,
  readTripsApiV1TripsGetQueryKey,
  updateTripApiV1TripsTripIdPatchMutation,
} from "@/lib/client/@tanstack/react-query.gen";
import { TripCreate, TripPublic } from "@/lib/client/types.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface TripFormProps {
  trip?: TripPublic;
}

export function TripFormFeature({ trip }: TripFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!trip;

  const { data: schoolsData } = useQuery({
    ...readSchoolsApiV1SchoolsGetOptions(),
  });

  const schools = schoolsData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripCreate>({
    defaultValues: trip
      ? {
          ...trip,
          // Format date for datetime-local input
          date: new Date(trip.date).toISOString().slice(0, 16),
          cost: Number(trip.cost),
        }
      : {
          title: "",
          description: "",
          location: "",
          date: "",
          cost: 0,
          max_students: 30,
          school_id: "",
        },
  });

  // Register school_id field manually since Select doesn't use register directly
  useEffect(() => {
    register("school_id", { required: "Please select a school" });
  }, [register]);

  const selectedSchoolId = watch("school_id");

  const createMutation = useMutation({
    ...createTripApiV1TripsPostMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readTripsApiV1TripsGetQueryKey(),
      });
      toast.success("Trip created successfully");
      router.push("/trips");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create trip");
    },
  });

  const updateMutation = useMutation({
    ...updateTripApiV1TripsTripIdPatchMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readTripsApiV1TripsGetQueryKey(),
      });
      toast.success("Trip updated successfully");
      router.push("/trips");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update trip");
    },
  });

  const deleteMutation = useMutation({
    ...deleteTripApiV1TripsTripIdDeleteMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readTripsApiV1TripsGetQueryKey(),
      });
      toast.success("Trip deleted successfully");
      router.push("/trips");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete trip");
    },
  });

  const onSubmit = (data: TripCreate) => {
    // Convert date string to ISO string for backend
    const formattedData = {
      ...data,
      date: new Date(data.date).toISOString(),
      cost: Number(data.cost),
    };

    if (isEditing) {
      updateMutation.mutate({
        path: { trip_id: trip.id },
        body: formattedData,
      });
    } else {
      createMutation.mutate({
        body: formattedData,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="school_id">School</Label>
          <Select
            disabled={isEditing || isPending}
            onValueChange={(value) => setValue("school_id", value)}
            value={selectedSchoolId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.school_id && (
            <p className="text-sm text-destructive">
              {errors.school_id.message}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-muted-foreground">
              School cannot be changed after creation.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Trip Title</Label>
          <Input
            id="title"
            placeholder="E.g. Science Museum Visit"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the trip..."
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="E.g. 123 Museum St, London"
            {...register("location", { required: "Location is required" })}
          />
          {errors.location && (
            <p className="text-sm text-destructive">
              {errors.location.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register("date", { required: "Date is required" })}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              {...register("cost", {
                required: "Cost is required",
                min: { value: 0, message: "Cost cannot be negative" },
              })}
            />
            {errors.cost && (
              <p className="text-sm text-destructive">{errors.cost.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_students">Maximum Students</Label>
          <Input
            id="max_students"
            type="number"
            {...register("max_students", {
              required: "Maximum students is required",
              min: { value: 1, message: "Must have at least 1 student" },
            })}
          />
          {errors.max_students && (
            <p className="text-sm text-destructive">
              {errors.max_students.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-6">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update Trip" : "Create Trip"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/trips")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>

        {isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={isPending}>
                <Trash2Icon className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  trip and all associated registrations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteMutation.mutate({ path: { trip_id: trip.id } })
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Trip
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
