"use client";

import { useState } from "react";
import { Tag, Plus, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: "active" | "expired" | "disabled";
}

export default function StudioCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "cp-1",
      code: "DESIGN50",
      discountType: "percentage",
      discountValue: 50,
      maxUses: 100,
      usedCount: 78,
      expiresAt: "2026-08-30",
      status: "active",
    },
    {
      id: "cp-2",
      code: "LAUNCH20",
      discountType: "percentage",
      discountValue: 20,
      maxUses: 200,
      usedCount: 142,
      expiresAt: "2026-06-15",
      status: "active",
    },
    {
      id: "cp-3",
      code: "FLAT1000",
      discountType: "flat",
      discountValue: 1000,
      maxUses: 50,
      usedCount: 50,
      expiresAt: "2026-05-15",
      status: "expired",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "flat",
    discountValue: 10,
    maxUses: 100,
    expiresAt: "",
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;

    const added: Coupon = {
      id: `cp-${Date.now()}`,
      code: newCoupon.code.toUpperCase().trim(),
      discountType: newCoupon.discountType,
      discountValue: Number(newCoupon.discountValue),
      maxUses: Number(newCoupon.maxUses),
      usedCount: 0,
      expiresAt: newCoupon.expiresAt || "2026-12-31",
      status: "active",
    };

    setCoupons([added, ...coupons]);
    setShowAddForm(false);
    setNewCoupon({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      maxUses: 100,
      expiresAt: "",
    });
  };

  const handleToggleStatus = (id: string) => {
    setCoupons(
      coupons.map((c) => {
        if (c.id === id) {
          const nextStatusMap: Record<Coupon["status"], Coupon["status"]> = {
            active: "disabled",
            disabled: "active",
            expired: "expired",
          };
          return { ...c, status: nextStatusMap[c.status] };
        }
        return c;
      })
    );
  };

  const handleDelete = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Discount Coupons</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Generate promotional discount codes to incentivize new learners.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form Sidebar */}
        <div className="border border-border p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-headline-sm font-bold">New Coupon Code</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Configure discount limits</p>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER50"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Type
                </label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discountType: e.target.value as any })
                  }
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (INR)</option>
                </select>
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={newCoupon.expiresAt}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-85 transition-opacity"
            >
              Generate Coupon
            </button>
          </form>
        </div>

        {/* Coupons Directory List */}
        <div className="lg:col-span-2 border border-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-headline-sm font-bold">Coupons Ledger</h3>
              <p className="text-label-sm text-muted-foreground uppercase">Track conversion campaigns</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground bg-surface-container">
                  <th className="p-3 text-label-xs uppercase font-bold">Code</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Discount</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Redemptions</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Expires At</th>
                  <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                  <th className="p-3 text-label-xs uppercase font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-body-sm text-muted-foreground">
                      No coupon campaigns found.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr
                      key={coupon.id}
                      className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                    >
                      <td className="p-3 font-mono font-bold text-foreground">{coupon.code}</td>
                      <td className="p-3 text-foreground font-medium">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% Off`
                          : `${formatCurrency(coupon.discountValue)} Off`}
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted-foreground/20 h-1 rounded-none overflow-hidden">
                            <div
                              className="bg-foreground h-full"
                              style={{ width: `${(coupon.usedCount / coupon.maxUses) * 100}%` }}
                            />
                          </div>
                          <span>
                            {coupon.usedCount} / {coupon.maxUses}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(coupon.expiresAt)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                            ${
                              coupon.status === "active"
                                ? "bg-foreground text-background"
                                : coupon.status === "disabled"
                                ? "bg-muted-foreground/20 text-muted-foreground"
                                : "bg-red-500/10 text-red-500"
                            }`}
                        >
                          {coupon.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-3">
                        <button
                          onClick={() => handleToggleStatus(coupon.id)}
                          className="text-label-xs uppercase tracking-wider text-foreground hover:underline font-bold transition-all"
                          disabled={coupon.status === "expired"}
                        >
                          {coupon.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-label-xs uppercase tracking-wider text-muted-foreground hover:text-foreground font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
