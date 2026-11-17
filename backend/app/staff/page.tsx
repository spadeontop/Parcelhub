"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StaffOrderSummary,
  StaffOrderDetail,
  OrderStatus,
  StaffLoginRes,
} from "@/app/types/v1/api";
import {
  ParcelHubLogo,
  SearchIcon,
  CloseIcon,
  RefreshIcon,
  LogOutIcon,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  PackageIcon,
  CheckCircleIcon,
} from "./components/Icons";
import { StaffOrderCard } from "./components/StaffOrderCard";
import { StaffOrderDetailsModal } from "./components/StaffOrderDetailsModal";

type StaffTab = "all" | "ready" | "active" | "unpaid" | "claimed";

const TAB_STATUS_MAP: Record<StaffTab, OrderStatus | null> = {
  all: null,
  ready: "READY_TO_CLAIM",
  active: "AWAITING_PARCEL",
  unpaid: "PAYMENT_REQUIRED",
  claimed: "CLAIMED",
};

export default function StaffTerminalPage() {
  // -------------------------------------------------------------
  // Authentication & Session State
  // -------------------------------------------------------------
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Login form states
  const [loginUsername, setLoginUsername] = useState<string>("staff");
  const [loginPassword, setLoginPassword] = useState<string>("string");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Terminal Orders & Filter State
  // -------------------------------------------------------------
  const [orders, setOrders] = useState<StaffOrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<StaffTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Selected Order
  const [selectedOrder, setSelectedOrder] = useState<StaffOrderDetail | null>(null);
  const [isLoadingOrderModal, setIsLoadingOrderModal] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 3500);
    },
    []
  );

  // Restore stored token on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("parcelhub_staff_token");
      const storedUser = localStorage.getItem("parcelhub_staff_user");
      if (storedToken) {
        setToken(storedToken);
        setUsername(storedUser || "staff");
      }
    } catch {
      // localStorage may fail in private mode
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // -------------------------------------------------------------
  // Fetch Orders from live API (/api/v1/staff/orders)
  // -------------------------------------------------------------
  const fetchOrders = useCallback(async (explicitToken?: string) => {
    const activeJwt = explicitToken || token;
    if (!activeJwt) return;

    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/v1/staff/orders?limit=100", {
        headers: {
          Authorization: `Bearer ${activeJwt}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem("parcelhub_staff_token");
          showToast("Session expired. Please log in again.", "error");
          return;
        }
        throw new Error(data?.message || data?.error || "Failed to load orders");
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      showToast(err.message || "Failed to fetch orders", "error");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [token, showToast]);

  // Fetch orders when token changes
  useEffect(() => {
    if (token) {
      fetchOrders(token);
    }
  }, [token, fetchOrders]);

  // -------------------------------------------------------------
  // Login Handler (/api/v1/staff/login)
  // -------------------------------------------------------------
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim() || isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/v1/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data: StaffLoginRes = await res.json();

      if (!res.ok) {
        const errorMsg = (data as any)?.message || (data as any)?.error || "Invalid credentials";
        throw new Error(errorMsg);
      }

      const authToken = data.authToken;
      setToken(authToken);
      setUsername(loginUsername.trim());

      try {
        localStorage.setItem("parcelhub_staff_token", authToken);
        localStorage.setItem("parcelhub_staff_user", loginUsername.trim());
      } catch {
        // ignore
      }

      showToast("Signed in successfully", "success");
    } catch (err: any) {
      setLoginError(err.message || "Login failed. Please check credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------------------
  // Logout Handler
  // -------------------------------------------------------------
  const handleLogout = () => {
    setToken(null);
    setUsername("");
    setSelectedOrder(null);
    try {
      localStorage.removeItem("parcelhub_staff_token");
      localStorage.removeItem("parcelhub_staff_user");
    } catch {
      // ignore
    }
    showToast("Signed out", "info");
  };

  // -------------------------------------------------------------
  // Select Order & Load Full Details
  // -------------------------------------------------------------
  const handleSelectOrder = async (orderSummary: StaffOrderSummary) => {
    if (!token) return;
    setIsLoadingOrderModal(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(orderSummary.id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data: StaffOrderDetail = await res.json();
      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load order details");
      }
      setSelectedOrder(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load order details", "error");
    } finally {
      setIsLoadingOrderModal(false);
    }
  };

  // -------------------------------------------------------------
  // Filtered Orders & Badge Counts
  // -------------------------------------------------------------
  const badgeCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      ready: 0,
      active: 0,
      unpaid: 0,
      claimed: 0,
    };
    for (const o of orders) {
      if (o.status === "READY_TO_CLAIM") counts.ready++;
      else if (o.status === "AWAITING_PARCEL") counts.active++;
      else if (o.status === "PAYMENT_REQUIRED") counts.unpaid++;
      else if (o.status === "CLAIMED") counts.claimed++;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      const targetStatus = TAB_STATUS_MAP[activeTab];
      if (targetStatus && o.status !== targetStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = o.id.toLowerCase().includes(q);
        const trackingMatch = o.trackingId?.toLowerCase().includes(q) ?? false;
        const ticketMatch = o.ticketCode?.toLowerCase().includes(q) ?? false;
        const customerMatch = o.customer.toLowerCase().includes(q);
        return idMatch || trackingMatch || ticketMatch || customerMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  if (isInitializing) {
    return (
      <div className="w-full max-w-md bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ParcelHubLogo size={48} className="animate-pulse" />
          <p className="text-xs font-semibold text-slate-400">Loading ParcelHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative border-x border-slate-200/80">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-70 w-[90%] max-w-sm animate-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : toast.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            {toast.type === "success" && <CheckCircleIcon size={16} />}
            {toast.type === "error" && <AlertCircleIcon size={16} />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded-md transition"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW A: LOGIN SCREEN                                      */}
      {/* ========================================================= */}
      {!token ? (
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Top Brand Header */}
          <div className="px-6 pt-12 pb-10 flex flex-col items-center text-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs mb-3 border border-white/10">
              <ParcelHubLogo size={56} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ParcelHub</h1>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">
              Staff Portal Terminal
            </p>
          </div>

          {/* White Bottom Sheet */}
          <div className="flex-1 bg-white rounded-t-[36px] px-6 pt-8 pb-10 flex flex-col shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Staff Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your staff credentials to access parcel intake, courier settlements, and claim handovers.
              </p>
            </div>

            {/* Error Notification */}
            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircleIcon size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Staff Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. staff"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <LockIcon size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
              >
                {isLoggingIn ? "Signing In..." : "Sign In to Terminal"}
              </button>
            </form>

            {/* Demo Credential Shortcut Helper */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Seed Account Quick-Fill
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername("staff");
                    setLoginPassword("string");
                    setLoginError(null);
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono text-xs rounded-lg transition font-semibold"
                >
                  staff / string (Default)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW B: STAFF TERMINAL SCREEN                             */
        /* ========================================================= */
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Top Header: Dark Slate */}
          <header className="bg-slate-900 text-white px-5 pt-4 pb-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <ParcelHubLogo size={36} />
              <div>
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                  ParcelHub
                </h1>
                <p className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                  Lily&apos;s Catering Hub
                </p>
              </div>
            </div>

            {/* Profile & Logout pill */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200 max-w-[80px] truncate">
                  {username || "Staff"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                aria-label="Sign out"
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-200/80 shrink-0">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400">
                <SearchIcon size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracking, ticket code, or customer..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tab Filter Pills */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 select-none">
            {(
              [
                { key: "all", label: "All", count: badgeCounts.all },
                { key: "ready", label: "Ready", count: badgeCounts.ready },
                { key: "active", label: "Awaiting", count: badgeCounts.active },
                { key: "unpaid", label: "Unpaid", count: badgeCounts.unpaid },
                { key: "claimed", label: "Claimed", count: badgeCounts.claimed },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List Header: Title + Refresh Button */}
          <div className="px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
            <span className="uppercase tracking-wider text-[11px] font-bold text-slate-600">
              {activeTab === "all" ? "All Orders" : activeTab.toUpperCase()} (
              {filteredOrders.length})
            </span>
            <button
              onClick={() => fetchOrders()}
              disabled={isLoadingOrders}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold transition disabled:opacity-50"
            >
              <RefreshIcon size={14} className={isLoadingOrders ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Scrollable Orders List */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
            {isLoadingOrders && orders.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshIcon size={24} className="animate-spin text-blue-600" />
                <p className="text-xs font-semibold">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 px-6 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                <PackageIcon size={36} className="text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No orders found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery
                    ? "No orders match your search query."
                    : "No orders available in this filter."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <StaffOrderCard
                  key={order.id}
                  order={order}
                  onSelect={handleSelectOrder}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ORDER DETAILS MODAL / DRAWER                              */}
      {/* ========================================================= */}
      {selectedOrder && token && (
        <StaffOrderDetailsModal
          order={selectedOrder}
          token={token}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={(updated) => {
            setSelectedOrder(updated);
            // also update summary in list
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updated.orderId
                  ? {
                      ...o,
                      status: updated.status,
                      statusMessage: updated.statusMessage,
                      amountReceived: updated.amountReceived ?? o.amountReceived ?? 0,
                      change: updated.change ?? o.change,
                      courierPaid: updated.courierPaid,
                      courierPaidByName: updated.courierPaidByName,
                      courierPaidAt: updated.courierPaidAt,
                      isClaimActive: updated.isClaimActive,
                      claimRemainingSeconds: updated.claimRemainingSeconds,
                      statusTimeline: updated.statusTimeline,
                    }
                  : o
              )
            );
          }}
          onToast={showToast}
        />
      )}

      {/* Background loading spinner for modal opening */}
      {isLoadingOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
            <RefreshIcon size={18} className="animate-spin text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Loading order...</span>
          </div>
        </div>
      )}
    </div>
  );
}
