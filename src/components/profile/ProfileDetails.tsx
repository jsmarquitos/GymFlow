"use client";

import Image from "next/image";
import type { MemberProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Award, CalendarCheck2 } from "lucide-react";

interface ProfileDetailsProps {
  profile: MemberProfile;
}

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
            <Image
              src={profile.profilePictureUrl || "https://placehold.co/100x100.png"}
              alt={profile.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint={profile.profilePictureHint || "retrato persona"}
            />
          </div>
          <div>
            <CardTitle className="text-2xl text-primary">{profile.name}</CardTitle>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center">
          <User className="mr-3 h-5 w-5 text-accent" />
          <span className="font-medium">Nombre:</span>
          <span className="ml-2 text-muted-foreground">{profile.name}</span>
        </div>
        <div className="flex items-center">
          <Mail className="mr-3 h-5 w-5 text-accent" />
          <span className="font-medium">Correo:</span>
          <span className="ml-2 text-muted-foreground">{profile.email}</span>
        </div>
        <div className="flex items-center">
          <Award className="mr-3 h-5 w-5 text-accent" />
          <span className="font-medium">Membresía:</span>
          <span className="ml-2 text-muted-foreground">{profile.membershipType}</span>
        </div>
        <div className="flex items-center">
          <CalendarCheck2 className="mr-3 h-5 w-5 text-accent" />
          <span className="font-medium">Se unió:</span>
          <span className="ml-2 text-muted-foreground">{profile.joinDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
