import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import {
  AdminDeleteStaffReq,
  AdminDeleteStaffRes,
  AdminUpdateStaffReq,
  AdminUpdateStaffRes,
  StaffId,
} from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const staff = await db.getStaffById(id as StaffId);
  if (!staff) {
    return jsonError("Staff member not found", 404, "Not Found");
  }

  try {
    const body = (await request.json()) as AdminUpdateStaffReq;
    if (!body.staff) {
      return jsonError("Staff payload is required", 400);
    }

    await db.updateStaff(id as StaffId, {
      firstName: body.staff.firstName,
      lastName: body.staff.lastName,
      middleInitial: body.staff.middleInitial,
      phoneNumber: body.staff.phoneNumber,
      email: body.staff.email,
      passwordHash: body.staff.password,
    });

    const response: AdminUpdateStaffRes = {
      statusMessage: "Staff profile updated",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const staff = await db.getStaffById(id as StaffId);
  if (!staff) {
    return jsonError("Staff member not found", 404, "Not Found");
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AdminDeleteStaffReq;
    await db.deleteStaff(id as StaffId);

    const response: AdminDeleteStaffRes = {
      statusMessage: "Staff account deleted successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request", 400);
  }
}
