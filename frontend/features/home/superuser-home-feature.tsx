"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinIcon, PlusIcon, SchoolIcon } from "lucide-react";
import Link from "next/link";

export function SuperuserHomeFeature() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage schools, trips, and system-wide configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader>
            <div className="bg-primary/10 w-fit p-2 rounded-lg mb-2">
              <MapPinIcon className="size-6 text-primary" />
            </div>
            <CardTitle>Manage Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create, update, or remove field trips across all schools.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/trips">View Trips</Link>
              </Button>
              <Button asChild variant="outline" size="icon">
                <Link href="/trips/new">
                  <PlusIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader>
            <div className="bg-primary/10 w-fit p-2 rounded-lg mb-2">
              <SchoolIcon className="size-6 text-primary" />
            </div>
            <CardTitle>Manage Schools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Register new schools and manage their contact details.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/schools">View Schools</Link>
              </Button>
              <Button asChild variant="outline" size="icon">
                <Link href="/schools/new">
                  <PlusIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
