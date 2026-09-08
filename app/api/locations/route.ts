import locationService from "@/features/locations/location.service";
import {
  LocationCUDApiResponse,
  LocationGetManyApiResponse,
} from "@/features/locations/location.types";
import prisma from "@/shared/db/prisma";
import { badRequest } from "@/shared/lib/error-handlers";
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
  locationCreateSchema,
  locationGetManySchema,
} from "@/shared/lib/zods/location.zod";

export async function GET(req: Request) {
  try {
    const session = await sessionValidation();

    if (!canViewLocation(session.role))
      throw badRequest("You're not allowed to access this feature");

    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const params = locationGetManySchema.parse(rawParams);

    const result = await locationService.getMany(session, params, prisma);

    const response: LocationGetManyApiResponse = {
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

export async function POST(req: Request) {
  try {
    const session = await sessionValidation();

    if (!canManageLocation(session.role))
      throw badRequest("You're not allowed to access this feature");

    const body = await req.json();
    const data = locationCreateSchema.parse(body);

    const result = await locationService.create(session, data, prisma);

    const response: LocationCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 201,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    printConsoleError(error, "POST", req.url);
    return handleError(error);
  }
}
