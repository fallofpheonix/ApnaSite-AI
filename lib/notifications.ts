import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const BRAND = "ApnaSite AI";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#FBF1DE;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBF1DE;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="420" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;background-color:#FFFBF2;border:1px solid #E5D9C3;border-radius:16px;">
<tr><td style="padding:32px;font-family:Georgia,'Times New Roman',serif;">
<p style="margin:0 0 24px;font-size:22px;font-style:italic;color:#1E5C58;">${BRAND}</p>
${content}
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#5A4A3A;">
${BRAND} — websites for small shops
</p>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:bold;color:#2B211A;">${text}</p>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#5A4A3A;line-height:1.6;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<p style="margin:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#5A4A3A;"><strong>${label}:</strong> ${value}</p>`;
}

async function logNotification(
  params: {
    siteId?: string | null;
    type: string;
    recipient: string;
    subject?: string;
    body: string;
    status: string;
  }
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        siteId: params.siteId ?? null,
        type: params.type,
        channel: "email",
        recipient: params.recipient,
        subject: params.subject ?? null,
        body: params.body,
        status: params.status,
      },
    });
  } catch {
    // Logging failure must never block the caller
  }
}

export async function sendWelcomeNotification(
  userId: string,
  email: string
): Promise<void> {
  const subject = `Welcome to ${BRAND}!`;
  const html = emailWrapper(
    heading("Welcome to ApnaSite AI!") +
      body(
        "We're thrilled to have you on board. With ApnaSite AI, you can create a professional website for your business in minutes — no coding needed."
      ) +
      body(
        "Here's how to get started: describe your business, pick a theme, and let AI build your site. You can customize everything before publishing."
      ) +
      body("If you ever need help, just reach out — we're always here for you.")
  );

  try {
    await sendEmail(email, subject, html);
    await logNotification({
      type: "welcome",
      recipient: email,
      subject,
      body: "Welcome email sent",
      status: "sent",
    });
  } catch {
    await logNotification({
      type: "welcome",
      recipient: email,
      subject,
      body: "Failed to send welcome email",
      status: "failed",
    });
  }
}

export async function sendPublishNotification(
  userId: string,
  email: string,
  siteName: string,
  siteUrl: string
): Promise<void> {
  const subject = `"${siteName}" is live!`;
  const html = emailWrapper(
    heading("Your site is published!") +
      body(
        `Great news — <strong>${siteName}</strong> is now live and ready for customers.`
      ) +
      detail("Site URL", `<a href="${siteUrl}" style="color:#1E5C58;">${siteUrl}</a>`) +
      body(
        "Share the link with your customers, add it to your social media, and watch the visits roll in."
      ) +
      body(
        "You can always update your site from the dashboard — changes go live instantly."
      )
  );

  try {
    await sendEmail(email, subject, html);
    await logNotification({
      type: "publish",
      recipient: email,
      subject,
      body: `Published: ${siteName} → ${siteUrl}`,
      status: "sent",
    });
  } catch {
    await logNotification({
      type: "publish",
      recipient: email,
      subject,
      body: `Failed to send publish notification for ${siteName}`,
      status: "failed",
    });
  }
}

export async function sendBillingNotification(
  userId: string,
  email: string,
  event: "subscription_started" | "subscription_cancelled" | "payment_failed"
): Promise<void> {
  const messages: Record<
    string,
    { subject: string; heading: string; body: string }
  > = {
    subscription_started: {
      subject: "Your Pro subscription is active",
      heading: "Subscription Activated",
      body: "Your Pro plan is now active. You've unlocked custom domains, priority support, and all premium features. Thank you for upgrading!",
    },
    subscription_cancelled: {
      subject: "Your subscription has been cancelled",
      heading: "Subscription Cancelled",
      body: "Your Pro subscription has been cancelled. Your site will remain live until the end of your current billing period. You can resubscribe anytime from your dashboard.",
    },
    payment_failed: {
      subject: "Payment failed — action needed",
      heading: "Payment Failed",
      body: "We couldn't process your latest payment. Please update your payment method in your dashboard to avoid any interruption to your Pro features.",
    },
  };

  const config = messages[event];
  const html = emailWrapper(heading(config.heading) + body(config.body));

  try {
    await sendEmail(email, config.subject, html);
    await logNotification({
      type: "billing",
      recipient: email,
      subject: config.subject,
      body: `Billing event: ${event}`,
      status: "sent",
    });
  } catch {
    await logNotification({
      type: "billing",
      recipient: email,
      subject: config.subject,
      body: `Failed to send billing notification: ${event}`,
      status: "failed",
    });
  }
}

export async function sendAppointmentNotification(
  siteId: string,
  email: string,
  appointment: {
    service: string;
    date: string;
    time: string;
    customerName: string;
  }
): Promise<void> {
  const subject = `Appointment confirmed — ${appointment.service}`;
  const html = emailWrapper(
    heading("Appointment Confirmed") +
      body(`Hi ${appointment.customerName}, your appointment has been confirmed.`) +
      detail("Service", appointment.service) +
      detail("Date", appointment.date) +
      detail("Time", appointment.time) +
      body("If you need to reschedule or cancel, please contact us directly.")
  );

  try {
    await sendEmail(email, subject, html);
    await logNotification({
      siteId,
      type: "appointment",
      recipient: email,
      subject,
      body: `Appointment: ${appointment.service} on ${appointment.date} at ${appointment.time}`,
      status: "sent",
    });
  } catch {
    await logNotification({
      siteId,
      type: "appointment",
      recipient: email,
      subject,
      body: "Failed to send appointment notification",
      status: "failed",
    });
  }
}

export async function sendOrderNotification(
  siteId: string,
  email: string,
  orderId: string,
  total: number
): Promise<void> {
  const subject = `Order confirmed — #${orderId.slice(-8).toUpperCase()}`;
  const html = emailWrapper(
    heading("Order Confirmed!") +
      body("Thank you for your order! We've received it and are getting it ready.") +
      detail("Order ID", `#${orderId.slice(-8).toUpperCase()}`) +
      detail("Total", `₹${total.toFixed(2)}`) +
      body("We'll notify you when your order is on its way. For any questions, reach out to us directly.")
  );

  try {
    await sendEmail(email, subject, html);
    await logNotification({
      siteId,
      type: "order",
      recipient: email,
      subject,
      body: `Order ${orderId} confirmed — total ₹${total.toFixed(2)}`,
      status: "sent",
    });
  } catch {
    await logNotification({
      siteId,
      type: "order",
      recipient: email,
      subject,
      body: "Failed to send order notification",
      status: "failed",
    });
  }
}
