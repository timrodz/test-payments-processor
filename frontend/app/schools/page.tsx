"use client";

import { useQuery } from "@tanstack/react-query";
import { readSchoolsApiV1SchoolsGetOptions } from "@/lib/client/@tanstack/react-query.gen";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, SchoolIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";
import { SchoolPublic } from "@/lib/client/types.gen";

interface SchoolCardProps {
  school: SchoolPublic;
}

function SchoolCard({ school }: SchoolCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{school.name}</CardTitle>
          <SchoolIcon className="size-5 text-muted-foreground" />
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPinIcon className="size-3" />
          {school.address}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm"></div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/schools/${school.id}/edit`}>Edit Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function SchoolList({ schools }: { schools: SchoolPublic[] }) {
  if (schools.length === 0) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold">No schools found</h2>
        <p className="text-muted-foreground">
          Get started by adding your first school.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schools.map((school) => (
        <SchoolCard key={school.id} school={school} />
      ))}
    </div>
  );
}

function SchoolSkeletonList({ count }: { count: number }) {
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

export default function SchoolsPage() {
  const { user } = useAuth();

  if (user && !user.is_superuser) {
    redirect("/");
  }

  const {
    data: schoolsData,
    isLoading,
    error,
  } = useQuery({
    ...readSchoolsApiV1SchoolsGetOptions(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Schools</h2>
        </div>
        <SchoolSkeletonList count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h2 className="text-2xl font-bold text-destructive">
          Error loading schools
        </h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const schools = schoolsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Schools</h2>
        <Button asChild>
          <Link href="/schools/new">
            <PlusIcon className="mr-2 size-4" />
            Add School
          </Link>
        </Button>
      </div>

      <SchoolList schools={schools} />
    </div>
  );
}
