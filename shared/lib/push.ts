import webpush from "web-push";
import prisma from "../db/prisma";
import { Prisma, Role } from "@prisma/client";
import pushSubscriptionRepository from "@/features/push-subscriptions/push-subscription.repository";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(
  userId: string | null,
  roles: Role[] | null,
  payload: { title: string; body: string; url?: string },
) {
  const subscriptionsOrConditions: Prisma.PushSubscriptionWhereInput = {};

  if (userId) {
    subscriptionsOrConditions.userId = userId;
  }

  if (roles && roles.length > 0) {
    subscriptionsOrConditions.user = {
      role: {
        in: roles,
      },
    };
  }

  const subscriptions = await pushSubscriptionRepository.getMany(
    {
      ...subscriptionsOrConditions,
    },
    prisma,
  );

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          {
            urgency: "high",
            TTL: 60,
          },
        );
      } catch (err: any) {
        // 410 Gone / 404 = the subscription is dead (user revoked permission,
        // cleared browser data, etc). Clean it up so you stop retrying it.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pushSubscriptionRepository.delete(sub.id, prisma);
        } else {
          console.error("Push failed:", err);
        }
      }
    }),
  );
}
