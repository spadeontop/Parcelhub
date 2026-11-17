"use client";

import React, { useState, useEffect } from "react";
import { OrderStatus, StaffOrderSummary } from "@/app/types/v1/api";
import { ClockIcon, ChevronRightIcon } from "./Icons";

interface StaffOrderCardProps {
  order: StaffOrderSummary;
  onSelect: (order: StaffOrderSummary) => void;
}

export function StaffOrderCard({ order, onSelect }: StaffOrderCardProps) {
  const isClaimActive = Boolean(
    order.isClaimActive || (order.claimRemainingSeconds && order.claimRemainingSeconds > 0)
  );

  const [remainingSecs, setRemainingSecs] = useState<number>(
    order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0)
  );

  useEffect(() => {
    setRemainingSecs(order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0));
  }, [order.claimRemainingSeconds, order.isClaimActive]);

  // Live countdown timer for active claim pass
  useEffect(() => {
    if (!isClaimActive || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClaimActive, remainingSecs]);

  const formattedDate = (() => {
    const raw = order.timestamp || order.createdAt;
    if (!raw) return "Recently";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "READY_TO_CLAIM":
        return {
          label: "Ready to Claim",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "AWAITING_PARCEL":
        return {
          label: order.courierPaid ? "Courier Paid" : "Awaiting Parcel",
          classes: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "PAYMENT_REQUIRED":
        return {
          label: "Payment Required",
          classes: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "CLAIMED":
        return {
          label: "Claimed",
          classes: "bg-slate-100 text-slate-700 border-slate-300",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          classes: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          label: status,
          classes: "bg-slate-50 text-slate-600 border-slate-200",
        };
    }
  };

  const badge = getStatusBadge(order.status);
  const displayId = order.id || order.trackingId || "ORD-UNKNOWN";

  return (
    <div
      onClick={() => onSelect(order)}
      className="group w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-blue-400 hover:shadow-md transition-all duration-150 cursor-pointer text-left select-none"
    >
      {/* Top Row: Order ID + Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[12px] font-bold text-blue-600 tracking-tight font-mono">
          {displayId}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.classes}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Middle Row: Customer Name & Price / Countdown Timer */}
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-slate-800 truncate">
            {order.customer || "Walk-in Customer"}
          </p>
          {order.trackingId && (
            <p className="text-[11px] text-slate-500 font-mono truncate">
              Waybill: {order.trackingId}
            </p>
          )}
        </div>

        {/* Price or Active Claim Timer */}
        <div className="shrink-0 text-right">
          {isClaimActive && remainingSecs > 0 ? (
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <ClockIcon size={12} className="text-emerald-600" />
              <span>
                {Math.floor(remainingSecs / 60)}:
                {String(remainingSecs % 60).padStart(2, "0")}
              </span>
            </div>
          ) : isClaimActive && remainingSecs <= 0 ? (
            <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              Expired
            </span>
          ) : (
            <span className="text-[14px] font-bold text-slate-900">
              ₱{Number(order.amountToPay || 0).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Ticket Code & Formatted Date */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {order.ticketCode && (
            <span className="bg-slate-100 text-slate-700 font-mono font-medium px-1.5 py-0.5 rounded text-[10px]">
              {order.ticketCode}
            </span>
          )}
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition-colors">
          <span className="text-[11px] font-medium mr-0.5 hidden sm:inline">Details</span>
          <ChevronRightIcon size={14} />
        </div>
      </div>
    </div>
  );
}
