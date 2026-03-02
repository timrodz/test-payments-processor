"use client";

import { SchoolFormFeature } from "@/features/schools/school-form-feature";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";

export default function NewSchoolPage() {
  const { user } = useAuth();

  if (user && !user.is_superuser) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Add New School</h2>
        <p className="text-muted-foreground">
          Enter the details of the school you want to add to the system.
        </p>
      </div>
      <SchoolFormFeature />
    </div>
  );
}
