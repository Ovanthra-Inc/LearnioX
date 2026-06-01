"use client";

import { useState } from "react";
import { CreditCard, Plus, Check, Search, Eye, AlertCircle, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  status: "active" | "draft" | "archived";
  features: string[];
  subscriberCount: number;
}

export default function StudioMembershipsPage() {
  // Mock Membership Plans
  const [plans, setPlans] = useState<MembershipPlan[]>([
    {
      id: "plan-1",
      name: "Core Pass",
      price: 499,
      billingPeriod: "monthly",
      status: "active",
      features: [
        "Access to all foundation courses",
        "Community Slack channel access",
        "Monthly live group Q&A",
        "Standard completion certificates",
      ],
      subscriberCount: 89,
    },
    {
      id: "plan-2",
      name: "Studio Pro",
      price: 1499,
      billingPeriod: "monthly",
      status: "active",
      features: [
        "Access to all premium & advanced courses",
        "Weekly live portfolio reviews & workshops",
        "Priority instructor doubt resolution (under 24h)",
        "Direct feedback on assignments",
        "Downloadable exercise assets & source code",
      ],
      subscriberCount: 53,
    },
  ]);

  // Mock Subscribers List
  const [subscribers] = useState([
    {
      id: "sub-1",
      name: "Arjun Patel",
      email: "arjun@example.com",
      planName: "Studio Pro",
      price: 1499,
      status: "active",
      startedAt: "2024-03-01",
      renewsAt: "2024-06-01",
      paymentMethod: "UPI",
    },
    {
      id: "sub-2",
      name: "Sarah J.",
      email: "sarah.j@example.com",
      planName: "Core Pass",
      price: 499,
      status: "active",
      startedAt: "2024-01-15",
      renewsAt: "2024-06-15",
      paymentMethod: "Card (xxxx 9012)",
    },
    {
      id: "sub-3",
      name: "Mike T.",
      email: "mike@example.com",
      planName: "Studio Pro",
      price: 1499,
      status: "active",
      startedAt: "2024-04-10",
      renewsAt: "2024-06-10",
      paymentMethod: "UPI",
    },
    {
      id: "sub-4",
      name: "Elena Rostova",
      email: "elena@example.com",
      planName: "Core Pass",
      price: 499,
      status: "cancelled",
      startedAt: "2023-12-05",
      renewsAt: "2024-05-05",
      paymentMethod: "Card (xxxx 1122)",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // New Plan form state
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 299,
    billingPeriod: "monthly" as "monthly" | "yearly",
    featuresText: "",
  });

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name) return;

    const added: MembershipPlan = {
      id: `plan-${Date.now()}`,
      name: newPlan.name,
      price: Number(newPlan.price),
      billingPeriod: newPlan.billingPeriod,
      status: "active",
      features: newPlan.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      subscriberCount: 0,
    };

    setPlans([...plans, added]);
    setShowAddModal(false);
    setNewPlan({ name: "", price: 299, billingPeriod: "monthly", featuresText: "" });
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setPlans(plans.map((p) => (p.id === editingPlan.id ? editingPlan : p)));
    setEditingPlan(null);
  };

  const handleToggleStatus = (id: string) => {
    setPlans(
      plans.map((p) => {
        if (p.id === id) {
          const nextStatusMap: Record<MembershipPlan["status"], MembershipPlan["status"]> = {
            active: "archived",
            archived: "active",
            draft: "active",
          };
          return { ...p, status: nextStatusMap[p.status] };
        }
        return p;
      })
    );
  };

  // Math totals
  const totalSubscribers = plans.reduce((acc, curr) => acc + curr.subscriberCount, 0);
  const mrr = plans.reduce((acc, curr) => acc + curr.price * curr.subscriberCount, 0);

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-foreground">Membership Plans</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            Build and manage monthly passes or subscription models for your institution.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background font-bold text-label-md uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Pricing Plan
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Active Subscribers</p>
          <p className="text-headline-lg font-bold mt-2">{totalSubscribers}</p>
        </div>
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-label-sm text-muted-foreground uppercase">Monthly Recurring Revenue</p>
          <p className="text-headline-lg font-bold mt-2">{formatCurrency(mrr)}</p>
        </div>
        <div className="p-6">
          <p className="text-label-sm text-muted-foreground uppercase">Active Passes</p>
          <p className="text-headline-lg font-bold mt-2">
            {plans.filter((p) => p.status === "active").length}
          </p>
        </div>
      </div>

      {/* Plan Card Grid */}
      <div className="space-y-4">
        <h3 className="text-headline-sm font-bold">Active Subscriptions Passes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-border p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-headline-sm font-bold">{plan.name}</h4>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 text-label-xs uppercase font-bold tracking-wider
                        ${
                          plan.status === "active"
                            ? "bg-foreground text-background"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-headline-md font-extrabold">{formatCurrency(plan.price)}</p>
                    <p className="text-label-sm text-muted-foreground uppercase">/{plan.billingPeriod}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-label-sm font-bold uppercase mb-2 text-foreground">Included Benefits</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-body-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div className="text-body-sm text-muted-foreground">
                  <strong className="text-foreground">{plan.subscriberCount}</strong> subscribers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="border border-border p-2 hover:border-foreground hover:bg-surface-container transition-colors text-foreground"
                    title="Edit Features"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className="border border-border px-3 py-2 text-label-sm uppercase tracking-wider font-bold hover:border-foreground hover:bg-surface-container transition-colors"
                  >
                    {plan.status === "active" ? "Archive" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers Table Section */}
      <div className="border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-sm font-bold">Subscribers Ledger</h3>
            <p className="text-label-sm text-muted-foreground uppercase">Manage subscriber accounts</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search subscribers..."
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
                <th className="p-3 text-label-xs uppercase font-bold">Subscriber</th>
                <th className="p-3 text-label-xs uppercase font-bold">Plan</th>
                <th className="p-3 text-label-xs uppercase font-bold">Billing</th>
                <th className="p-3 text-label-xs uppercase font-bold">Joined</th>
                <th className="p-3 text-label-xs uppercase font-bold">Next Renewal</th>
                <th className="p-3 text-label-xs uppercase font-bold">Status</th>
                <th className="p-3 text-label-xs uppercase font-bold">Method</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-body-sm text-muted-foreground">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border hover:bg-surface-container transition-colors text-body-sm"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{sub.name}</div>
                      <div className="text-label-xs text-muted-foreground uppercase">{sub.email}</div>
                    </td>
                    <td className="p-3 font-medium">
                      {sub.planName}
                      <span className="text-label-xs text-muted-foreground ml-2">
                        ({formatCurrency(sub.price)})
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground uppercase">monthly</td>
                    <td className="p-3 text-muted-foreground">{formatDate(sub.startedAt)}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(sub.renewsAt)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-label-xs font-bold uppercase tracking-wider
                          ${
                            sub.status === "active"
                              ? "bg-foreground text-background"
                              : "bg-muted-foreground/20 text-muted-foreground line-through"
                          }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-label-xs uppercase">{sub.paymentMethod}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-foreground p-6 max-w-md w-full space-y-6 animate-fade-in rounded-none">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-headline-sm font-bold text-foreground">Create Plan</h3>
                <p className="text-label-sm text-muted-foreground uppercase">Configure pricing details</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-body-lg text-muted-foreground hover:text-foreground transition-colors font-mono font-bold"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass VIP"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                  />
                </div>
                <div>
                  <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={newPlan.billingPeriod}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, billingPeriod: e.target.value as "monthly" | "yearly" })
                    }
                    className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Plan Features (one per line)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  value={newPlan.featuresText}
                  onChange={(e) => setNewPlan({ ...newPlan, featuresText: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-foreground text-background hover:opacity-85 text-label-md uppercase tracking-wider font-bold transition-opacity"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-foreground p-6 max-w-md w-full space-y-6 animate-fade-in rounded-none">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-headline-sm font-bold text-foreground">Edit Plan</h3>
                <p className="text-label-sm text-muted-foreground uppercase">Modify plan properties</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-body-lg text-muted-foreground hover:text-foreground transition-colors font-mono font-bold"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                  />
                </div>
                <div>
                  <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={editingPlan.billingPeriod}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        billingPeriod: e.target.value as "monthly" | "yearly",
                      })
                    }
                    className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-sm uppercase font-bold text-foreground block mb-1">
                  Plan Features (one per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className="w-full p-2.5 bg-background border border-border text-body-sm outline-none focus:border-foreground rounded-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 py-2.5 border border-border hover:border-foreground text-label-md uppercase tracking-wider font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-foreground text-background hover:opacity-85 text-label-md uppercase tracking-wider font-bold transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
