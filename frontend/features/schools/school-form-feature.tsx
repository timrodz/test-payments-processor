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
import { Textarea } from "@/components/ui/textarea";
import {
  createSchoolApiV1SchoolsPostMutation,
  deleteSchoolApiV1SchoolsSchoolIdDeleteMutation,
  readSchoolsApiV1SchoolsGetQueryKey,
  updateSchoolApiV1SchoolsSchoolIdPatchMutation,
} from "@/lib/client/@tanstack/react-query.gen";
import { SchoolCreate, SchoolPublic } from "@/lib/client/types.gen";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface SchoolFormProps {
  school?: SchoolPublic;
}

export function SchoolFormFeature({ school }: SchoolFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!school;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolCreate>({
    defaultValues: school || {
      name: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    ...createSchoolApiV1SchoolsPostMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readSchoolsApiV1SchoolsGetQueryKey(),
      });
      toast.success("School created successfully");
      router.push("/schools");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create school");
    },
  });

  const updateMutation = useMutation({
    ...updateSchoolApiV1SchoolsSchoolIdPatchMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readSchoolsApiV1SchoolsGetQueryKey(),
      });
      toast.success("School updated successfully");
      router.push("/schools");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update school");
    },
  });

  const deleteMutation = useMutation({
    ...deleteSchoolApiV1SchoolsSchoolIdDeleteMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: readSchoolsApiV1SchoolsGetQueryKey(),
      });
      toast.success("School deleted successfully");
      router.push("/schools");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete school");
    },
  });

  const onSubmit = (data: SchoolCreate) => {
    if (isEditing) {
      updateMutation.mutate({
        path: { school_id: school.id },
        body: data,
      });
    } else {
      createMutation.mutate({
        body: data,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">School Name</Label>
          <Input
            id="name"
            placeholder="E.g. Oakridge Academy"
            {...register("name", { required: "School name is required" })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="123 Education Way, Springfield"
            {...register("address", { required: "Address is required" })}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-6">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Update School" : "Create School"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/schools")}
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
                  school and all its associated trips.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteMutation.mutate({ path: { school_id: school.id } })
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete School
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
