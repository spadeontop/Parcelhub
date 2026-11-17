"use client";

import React, { useState, useEffect, useRef } from "react";
import { StaffOrderDetail, OrderStatus } from "@/app/types/v1/api";
import {
  CloseIcon,
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UploadIcon,
  TruckIcon,
} from "./Icons";
import { compressImageFile } from "./imageUtils";

interface StaffOrderDetailsModalProps {
  order: StaffOrderDetail;
  token: string;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: StaffOrderDetail) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export function StaffOrderDetailsModal({
  order,
  token,
  onClose,
  onOrderUpdated,
  onToast,
}: StaffOrderDetailsModalProps) {
  const [activeTabSection, setActiveTabSection] = useState<"action" | "details" | "timeline">(
    "action"
  );

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState<boolean>(false);

  // --- Step: PAYMENT_REQUIRED states ---
  const defaultCash = order.amountToPay > 0 ? String(order.amountToPay) : "100";
  const [cashReceivedInput, setCashReceivedInput] = useState<string>(defaultCash);
  const [cashConfirmed, setCashConfirmed] = useState<boolean>(false);

  const cashNum = parseFloat(cashReceivedInput) || 0;
  const changeAmount = Math.max(0, cashNum - order.amountToPay);
  const isCashSufficient = cashNum >= order.amountToPay;

  // --- Step: AWAITING_PARCEL states ---
  const [courierPaidConfirmed, setCourierPaidConfirmed] = useState<boolean>(false);
  const [parcelPhotoData, setParcelPhotoData] = useState<{
    dataUrl: string;
    sizeKb: number;
  } | null>(null);
  const [photoConfirmed, setPhotoConfirmed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Step: READY_TO_CLAIM states ---
  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(
    order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0)
  );

  useEffect(() => {
    setRemainingSecs(order.claimRemainingSeconds ?? (order.isClaimActive ? 300 : 0));
  }, [order.claimRemainingSeconds, order.isClaimActive]);

  useEffect(() => {
    if (!order.isClaimActive || remainingSecs <= 0) return;
    const interval = setInterval(() => {
      setRemainingSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.isClaimActive, remainingSecs]);

  // Refetch full order details after state transition
  const refreshOrder = async () => {
    try {
      const res = await fetch(`/api/v1/staff/orders/${encodeURIComponent(order.orderId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data) {
        onOrderUpdated(data);
      }
    } catch {
      // Ignore background refresh failure
    }
  };

  // 1. Activate / Cash collection handler
  const handleActivateOrder = async () => {
    if (!isCashSufficient || !cashConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(order.orderId)}/activate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amountReceived: cashNum }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to activate order");
      }
      onToast(
        `Payment collected! Change: ₱${data.change ?? changeAmount}`,
        "success"
      );
      await refreshOrder();
    } catch (err: any) {
      onToast(err.message || "Failed to activate order", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Pay Courier handler
  const handlePayCourier = async () => {
    if (!courierPaidConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(order.orderId)}/make-claimable/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to record courier payout");
      }
      onToast("Courier payout recorded successfully", "success");
      await refreshOrder();
    } catch (err: any) {
      onToast(err.message || "Courier payout failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. File selection & compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.8);
      setParcelPhotoData({
        dataUrl: compressed.dataUrl,
        sizeKb: compressed.sizeKb,
      });
      onToast(`Photo prepared (${compressed.sizeKb} KB)`, "info");
    } catch (err: any) {
      onToast(err.message || "Error processing image", "error");
    }
  };

  // 4. Attach photo and make claimable
  const handleAttachPhoto = async () => {
    if (!parcelPhotoData || !photoConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(order.orderId)}/make-claimable/attach-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl: parcelPhotoData.dataUrl }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to attach proof photo");
      }
      onToast("Photo attached! Order is now ready to claim", "success");
      await refreshOrder();
    } catch (err: any) {
      onToast(err.message || "Photo attachment failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Claim release handler
  const handleClaimOrder = async () => {
    if (!claimConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(order.orderId)}/claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to release order");
      }
      onToast("Parcel claimed successfully!", "success");
      await refreshOrder();
    } catch (err: any) {
      onToast(err.message || "Failed to release order", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. View attached photo
  const handleLoadPhoto = async () => {
    setIsLoadingPhoto(true);
    try {
      const res = await fetch(
        `/api/v1/staff/orders/${encodeURIComponent(order.orderId)}/photo?type=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (res.ok && (data.proofImageUrl || data.imageUrl)) {
        setPhotoViewUrl(data.proofImageUrl || data.imageUrl);
      } else {
        onToast("No parcel photo available for this order", "info");
      }
    } catch {
      onToast("Failed to fetch parcel photo", "error");
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-400">
                {order.orderId}
              </span>
              {order.ticketCode && (
                <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {order.ticketCode}
                </span>
              )}
            </div>
            <p className="text-[14px] font-bold text-white mt-0.5">
              {order.customer || "Order Information"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTabSection("action")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              activeTabSection === "action"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Operational Action
          </button>
          <button
            onClick={() => setActiveTabSection("details")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              activeTabSection === "details"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTabSection("timeline")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              activeTabSection === "timeline"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            History Timeline
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SECTION 1: OPERATIONAL ACTIONS */}
          {activeTabSection === "action" && (
            <div>
              {/* STATUS: PAYMENT_REQUIRED */}
              {order.status === "PAYMENT_REQUIRED" && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Deposit Cash Payment
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Customer must deposit payment to activate parcel handling.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Order Fee:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ₱{Number(order.amountToPay).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Amount Received From Customer
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                          ₱
                        </span>
                        <input
                          type="number"
                          value={cashReceivedInput}
                          onChange={(e) => setCashReceivedInput(e.target.value)}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                      <span className="font-semibold text-slate-600">Change Due:</span>
                      <span
                        className={`font-bold text-base ${
                          isCashSufficient ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        ₱{changeAmount.toLocaleString()}
                      </span>
                    </div>

                    {!isCashSufficient && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        Insufficient cash. Received amount must equal or exceed ₱
                        {order.amountToPay}.
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cashConfirmed}
                      onChange={(e) => setCashConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      I confirm I have received ₱{cashNum.toLocaleString()} cash from the
                      customer and tendered ₱{changeAmount.toLocaleString()} change.
                    </span>
                  </label>

                  <button
                    onClick={handleActivateOrder}
                    disabled={!isCashSufficient || !cashConfirmed || isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? "Processing..." : "Collect Payment & Activate"}
                  </button>
                </div>
              )}

              {/* STATUS: AWAITING_PARCEL */}
              {order.status === "AWAITING_PARCEL" && (
                <div className="space-y-4">
                  {/* Step 1: Courier Payment */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Step 1: Courier Payout
                      </span>
                      {order.courierPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckIcon size={12} /> Paid
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>

                    {order.courierPaid ? (
                      <p className="text-xs text-slate-600">
                        Courier payment of ₱{Number(order.amountToPay).toLocaleString()} was
                        disbursed
                        {order.courierPaidByName ? ` by ${order.courierPaidByName}` : ""}.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Courier has arrived at hub. Disburse ₱
                          {Number(order.amountToPay).toLocaleString()} from hub cash reserves.
                        </p>
                        <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={courierPaidConfirmed}
                            onChange={(e) => setCourierPaidConfirmed(e.target.checked)}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-xs text-slate-700">
                            I confirm ₱{order.amountToPay} has been handed to the courier.
                          </span>
                        </label>
                        <button
                          onClick={handlePayCourier}
                          disabled={!courierPaidConfirmed || isSubmitting}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg transition"
                        >
                          {isSubmitting ? "Recording..." : "Record Courier Payout"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Step 2: Parcel Proof Photo */}
                  <div
                    className={`border rounded-xl p-4 space-y-3 transition ${
                      order.courierPaid
                        ? "border-slate-200 bg-slate-50"
                        : "border-slate-100 bg-slate-100/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Step 2: Attach Parcel Photo
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Max 200KB</span>
                    </div>

                    {!order.courierPaid ? (
                      <p className="text-xs text-slate-400 italic">
                        Complete Step 1 (Courier Payout) first before attaching photo.
                      </p>
                    ) : (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {parcelPhotoData ? (
                          <div className="space-y-2">
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={parcelPhotoData.dataUrl}
                                alt="Parcel preview"
                                className="max-h-full object-contain"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Compressed: {parcelPhotoData.sizeKb} KB</span>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-600 font-semibold hover:underline"
                              >
                                Change Photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition bg-white"
                          >
                            <UploadIcon size={24} className="mb-1 text-slate-400" />
                            <span className="text-xs font-bold">Choose Parcel Photo</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              JPEG, PNG, or WebP (auto-compressed)
                            </span>
                          </button>
                        )}

                        <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={photoConfirmed}
                            onChange={(e) => setPhotoConfirmed(e.target.checked)}
                            disabled={!parcelPhotoData}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-xs text-slate-700">
                            I verify the package arrived undamaged and the waybill is legible.
                          </span>
                        </label>

                        <button
                          onClick={handleAttachPhoto}
                          disabled={!parcelPhotoData || !photoConfirmed || isSubmitting}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg transition"
                        >
                          {isSubmitting ? "Uploading..." : "Save Photo & Mark Ready"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STATUS: READY_TO_CLAIM */}
              {order.status === "READY_TO_CLAIM" && (
                <div className="space-y-4">
                  {order.isClaimActive && remainingSecs > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ClockIcon size={16} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Customer Claim Pass Active
                        </span>
                      </div>
                      <p className="text-2xl font-black text-emerald-700 font-mono">
                        {Math.floor(remainingSecs / 60)}:
                        {String(remainingSecs % 60).padStart(2, "0")}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Customer has unlocked their pass. You may safely hand over the package.
                      </p>
                    </div>
                  ) : order.isClaimActive && remainingSecs <= 0 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
                      <p className="text-xs font-bold text-rose-800">
                        Claim Pass Window Expired
                      </p>
                      <p className="text-xs text-rose-700 mt-0.5">
                        The 5-minute retrieval window expired. Ask the customer to re-activate
                        their claim pass in the mobile app.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      <p className="text-xs font-bold text-amber-800">
                        Awaiting Customer Claim Pass
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Parcel is safely stored in hub. When customer arrives, instruct them to
                        tap <strong>Claim Parcel</strong> in their ParcelHub mobile app.
                      </p>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={claimConfirmed}
                      onChange={(e) => setClaimConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      I confirm customer identity, verified the parcel, and handed the package
                      to the customer.
                    </span>
                  </label>

                  <button
                    onClick={handleClaimOrder}
                    disabled={!claimConfirmed || isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition shadow-sm"
                  >
                    {isSubmitting ? "Completing..." : "Complete Parcel Handover"}
                  </button>
                </div>
              )}

              {/* STATUS: CLAIMED */}
              {order.status === "CLAIMED" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <CheckCircleIcon size={32} className="text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-900">
                      Parcel Successfully Claimed
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      This order was fully processed and handed over to the customer.
                    </p>
                  </div>

                  <button
                    onClick={handleLoadPhoto}
                    disabled={isLoadingPhoto}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {isLoadingPhoto ? "Loading photo..." : "View Waybill & Proof Photo"}
                  </button>
                </div>
              )}

              {/* STATUS: PENDING_INITIALIZATION / CANCELLED */}
              {(order.status === "PENDING_INITIALIZATION" ||
                order.status === "CANCELLED") && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-700">Status: {order.status}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.statusMessage || "No immediate action required by staff."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: OVERVIEW DETAILS */}
          {activeTabSection === "details" && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-800">{order.orderId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ticket Code:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {order.ticketCode || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-800">{order.customer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Waybill Tracking:</span>
                  <span className="font-mono text-slate-800">
                    {order.trackingId || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Order Fee:</span>
                  <span className="font-bold text-slate-900">
                    ₱{Number(order.amountToPay).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Amount Received:</span>
                  <span className="text-slate-800">
                    {order.amountReceived !== null && order.amountReceived !== undefined
                      ? `₱${Number(order.amountReceived).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Change Tendered:</span>
                  <span className="text-slate-800">
                    {order.change !== null && order.change !== undefined
                      ? `₱${Number(order.change).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
              </div>

              {order.courierPaid && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-800">
                  <p className="font-bold">Courier Disbursement Details</p>
                  <p className="text-[11px] mt-0.5">
                    Paid by {order.courierPaidByName || "Staff"} on{" "}
                    {order.courierPaidAt
                      ? new Date(order.courierPaidAt).toLocaleString()
                      : "Completed"}
                  </p>
                </div>
              )}

              <button
                onClick={handleLoadPhoto}
                disabled={isLoadingPhoto}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                {isLoadingPhoto ? "Fetching photo..." : "View Attached Photos"}
              </button>
            </div>
          )}

          {/* SECTION 3: HISTORY TIMELINE */}
          {activeTabSection === "timeline" && (
            <div className="space-y-3">
              {order.statusTimeline && order.statusTimeline.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {order.statusTimeline.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                      <p className="font-bold text-slate-800">{item.status}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  No historical entries recorded.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Photo Viewer Modal */}
      {photoViewUrl && (
        <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-black rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPhotoViewUrl(null)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-xs transition"
            >
              <CloseIcon size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoViewUrl}
              alt="Parcel Proof"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
