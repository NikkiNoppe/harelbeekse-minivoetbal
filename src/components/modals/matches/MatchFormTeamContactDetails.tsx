import React from "react";
import { Mail, Phone, User } from "lucide-react";
import type { MatchTeamContactRow } from "@/services/match/matchTeamsContactSessionFetch";

export function hasMatchTeamContact(contact: MatchTeamContactRow | null | undefined): boolean {
  return !!(contact?.contact_person || contact?.contact_phone || contact?.contact_email);
}

interface MatchFormTeamContactDetailsProps {
  contact: MatchTeamContactRow | null | undefined;
  className?: string;
}

export function MatchFormTeamContactDetails({
  contact,
  className,
}: MatchFormTeamContactDetailsProps) {
  if (!hasMatchTeamContact(contact)) {
    return (
      <p className="text-center text-xs text-muted-foreground">Contactgegevens niet beschikbaar</p>
    );
  }

  return (
    <div className={`space-y-2 rounded-md border border-primary/15 bg-background/90 p-2.5 text-sm ${className ?? ""}`}>
      {contact?.contact_person && (
        <p className="flex items-center justify-center gap-1.5 text-center text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">{contact.contact_person}</span>
        </p>
      )}
      <div className="flex flex-col items-center gap-1">
        {contact?.contact_phone && (
          <a
            href={`tel:${contact.contact_phone}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-primary underline-offset-4 hover:underline"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {contact.contact_phone}
          </a>
        )}
        {contact?.contact_email && (
          <a
            href={`mailto:${contact.contact_email}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 break-all text-center text-primary underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {contact.contact_email}
          </a>
        )}
      </div>
    </div>
  );
}
