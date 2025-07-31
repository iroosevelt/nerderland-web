"use client";

import ProfileCard from "@/components/cards/ProfileCard";

interface Subscriber {
  id: number;
  username: string | null;
  avatar_url: string | null;
  subscribed_at: Date;
  formatted_subscribed_at: string;
}

interface SubscribersListProps {
  subscribers: Subscriber[];
}

export function SubscribersList({ subscribers }: SubscribersListProps) {
  return (
    <div className="space-y-4">
      {subscribers.map((subscriber) => (
        <ProfileCard
          key={subscriber.id}
          user={{
            id: subscriber.id,
            username: subscriber.username || "Unknown",
            level: 1, // Default level
            nerdy_points: 0, // Default points
          }}
          subscribedAt={subscriber.formatted_subscribed_at}
          showSubscriptionDate={true}
        />
      ))}
    </div>
  );
}