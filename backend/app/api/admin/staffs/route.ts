import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { AdminListStaffsRes } from "@/app/types/api";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const staffs = db.listStaff();

  const response: AdminListStaffsRes = {
    statusMessage: "Staff accounts retrieved",
    staffs,
  };

  return jsonSuccess(response);
}
