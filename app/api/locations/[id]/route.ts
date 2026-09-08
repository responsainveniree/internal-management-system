import locationService from "@/features/locations/location.service";
import {
  LocationCUDApiResponse,
  LocationGetByIdApiResponse,
} from "@/features/locations/location.types";
import prisma from "@/shared/db/prisma";
import { badRequest, forbidden } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import {
  canManageLocation,
  canViewLocation,
} from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import {
  locationGetByIdSchema,
  locationUpdateSchema,
} from "@/shared/lib/zods/location.zod";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canViewLocation(session.role))
      throw badRequest("You're not allowed to access this feature");

    const { id: locationId } = await params;

    if (!locationId) throw badRequest("Location id is missing");

    // zod
    const { searchParams } = new URL(req.url);
    const rawParamsSchema = Object.fromEntries(searchParams.entries());
    const paramsSchema = locationGetByIdSchema.parse(rawParamsSchema);

    const result = await locationService.getById(
      session,
      locationId,
      paramsSchema,
      prisma,
    );

    const response: LocationGetByIdApiResponse = {
      message: result.message,
      data: result.data,
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "GET", req.url);
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageLocation(session.role))
      throw forbidden("You're not allowed to access this feature");

    const { id: locationId } = await params;

    if (!locationId) throw badRequest("Location id is missing");

    const result = await locationService.delete(session, locationId, prisma);

    const response: LocationCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "DELETE", req.url);
    return handleError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageLocation(session.role))
      throw badRequest("You're not allowed to access this feature");

    const { id: locationId } = await params;

    if (!locationId) throw badRequest("Location id is missing");

    const body = await req.json();
    const data = locationUpdateSchema.parse(body);

    const result = await locationService.update(
      session,
      locationId,
      data,
      prisma,
    );

    const response: LocationCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "PATCH", req.url);
    return handleError(error);
  }
}
