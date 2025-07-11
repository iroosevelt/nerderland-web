// src/components/nerd-card.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type NerdCardProps = {
  name: string;
  bio: string;
  avatarUrl: string;
};

export function NerdCard({ name, bio }: NerdCardProps) {
  return (
    <Card className="w-full max-w-sm bg-background border border-white/10 hover:shadow-lg transition">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{bio}</p>
        <Button variant="outline">View Profile</Button>
      </CardContent>
    </Card>
  );
}
