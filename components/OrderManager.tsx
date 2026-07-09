"use client";

import { useEffect, useState } from "react";

type Status = "pending" | "confirmed" | "delivered" | "cancelled";

interface Order {
  id: string;
  customerName: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: Status;
  createdAt: string;
}

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-teal/15 text-teal",
  cancelled: "bg-red-50 text-red-600",
};

const FILTERS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatINR(amount: number): string {
  return "\u20B9" + amount.toLocaleString("en-IN");
}

export default function OrderManager({ siteId }: { siteId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`/api/orders?siteId=${siteId}`);
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data.orders ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [siteId]);

  async function updateStatus(id: string, status: Status) {
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update order.");
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order.");
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="text-sm text-ink-soft">Loading orders...</p>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{orders.length}</p>
          <p className="text-xs text-ink-soft">Total Orders</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{formatINR(totalRevenue)}</p>
          <p className="text-xs text-ink-soft">Total Revenue</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{pendingCount}</p>
          <p className="text-xs text-ink-soft">Pending</p>
        </div>
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
        <p className="text-sm text-ink-soft">No orders found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-2 rounded-xl border border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{order.customerName}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatINR(order.total)} &middot; {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              {order.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "confirmed")}
                    className="rounded-lg bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition-colors hover:bg-teal/20"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {order.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => updateStatus(order.id, "delivered")}
                  className="rounded-lg bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition-colors hover:bg-teal/20"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
