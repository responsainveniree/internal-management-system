import { ApiResponse } from "@/shared/lib/api-client";
import { userRepository } from "./user.repository";

export type User = Awaited<ReturnType<typeof userRepository.findUserByEmail>>;

export type UserGuestCreateApiResponse = ApiResponse<{
  userId: string;
  emailVerificationId: string;
}>;

export type UserStaffCreateApiResponse = ApiResponse<{
  userId: string;
}>;

export type UserVerifyEmailApiResponse = ApiResponse<{
  userId: string;
  success: boolean;
}>;

export type UserRequestEmailOtpApiResponse = ApiResponse<{
  emailOtpVerificationId: string | null;
}>;

export type UserRequestPasswordOtpApiResponse = ApiResponse<null>;

export type UserVerifyPasswordApiResponse = ApiResponse<{
  userId: string;
  success: boolean;
}>;

export type UserUpdateApiResponse = ApiResponse<{
  userId: string;
}>;
