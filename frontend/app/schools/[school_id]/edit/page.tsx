"use client";

import { useQuery } from "@tanstack/react-query";
import { readSchoolByIdApiV1SchoolsSchoolIdGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import { SchoolFormFeature } from "@/features/schools/school-form-feature";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";
import { Loader2Icon } from "lucide-react";

export default function EditSchoolPage() {
  const { user } = useAuth();
  const params = useParams();
  const schoolId = params.school_id?.toString() ?? "";

  if (user && !user.is_superuser) {
    redirect("/");
  }

  const {
    data: school,
    isLoading,
    error,
  } = useQuery({
    ...readSchoolByIdApiV1SchoolsSchoolIdGetOptions({
      path: { school_id: schoolId },
    }),
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold text-destructive">
          Error loading school
        </h2>
        <p className="text-muted-foreground">
          School not found or an error occurred.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Edit School</h2>
        <p className="text-muted-foreground">
          Update the details of {school.name}.
        </p>
      </div>
      <SchoolFormFeature school={school} />
    </div>
  );
}
