// `npm run cleanup` — deletes rows that only exist to expire:
//   - sessions past their expiry
//   - OTP codes past their expiry
//   - webhook-event dedup records older than 90 days (Razorpay retries span
//     days at most; 90 is generous)
// Run manually, or from cron on a VPS:  17 4 * * * cd /srv/apnasite && npm run cleanup
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();
const webhookCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

const [sessions, otps, webhookEvents] = await Promise.all([
  prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  prisma.otpCode.deleteMany({ where: { expiresAt: { lt: now } } }),
  prisma.webhookEvent.deleteMany({ where: { createdAt: { lt: webhookCutoff } } }),
]);

console.log(
  `cleanup: ${sessions.count} expired sessions, ${otps.count} expired OTP codes, ${webhookEvents.count} old webhook events`
);
await prisma.$disconnect();
