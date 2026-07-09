"use client";

import { useEffect, useState } from "react";

type Status = "pending" | "confirmed" | "cancelled";

interface Appointment {
  id: string;
  customerName: string;
  service: string;
  dateTime: string;
  status: Status;
}

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-teal/15 text-teal",
  cancelled: "bg-red-50 text-red-600",
};

const FILTERS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentManager({ siteId }: { siteId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await fetch(`/api/appointments?siteId=${siteId}`);
        if (!res.ok) throw new Error("Failed to load appointments");
        const data = await res.json();
        setAppointments(data.appointments ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [siteId]);

  async function updateStatus(id: string, status: Status) {
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update appointment.");
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update appointment.");
    }
  }

  const counts = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="text-sm text-ink-soft">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      {error && (
        <div className="rounded-xl border border-brick/20 bg-brick/10 px-4 py-2 text-sm text-brick">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["total", "pending", "confirmed", "cancelled"] as const).map((key) => (
          <div key={key} className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
            <p className="text-2xl font-bold text-ink">{counts[key]}</p>
            <p className="text-xs text-ink-soft capitalize">{key}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-ink text-paper"
                : "bg-ink/5 text-ink hover:bg-ink/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">No appointments found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt) => (
            <div
              key={appt.id}
              className="flex flex-col gap-2 rounded-xl border border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{appt.customerName}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[appt.status]}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {appt.service} &middot; {new Date(appt.dateTime).toLocaleString()}
                </p>
              </div>
              {appt.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(appt.id, "confirmed")}
                    className="rounded-lg bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition-colors hover:bg-teal/20"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(appt.id, "cancelled")}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
