import { Role } from "@prisma/client";

const PERMISSIONS = {
  CAN_VIEW_LOCATION: [
    "HOTEL_MANAGER",
    "SUPERVISOR",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "ACCOUNTANT",
    "ADMIN",
  ] as Role[],
  MANAGE_LOCATION: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  MANAGE_CATEGORY: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  CAN_VIEW_ITEM: [
    "HOTEL_MANAGER",
    "SUPERVISOR",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "ACCOUNTANT",
    "ADMIN",
  ] as Role[],
  MANAGE_ITEM: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  CAN_VIEW_STOCK: [
    "HOTEL_MANAGER",
    "SUPERVISOR",
    "HOUSEKEEPING",
    "FRONT_DESK",
    "ACCOUNTANT",
    "ADMIN",
  ] as Role[],
  MANAGE_STOCK: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  MANAGE_STOCK_MOVEMENT: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  MANAGER_LAUNDRY: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  ACCESS_MANAGER_DASHBOARD: "HOTEL_MANAGER" as Role,
  PRINT_REPORT: ["HOTEL_MANAGER", "ACCOUNTANT"] as Role[],
  STOCK_REQUEST_CREATE: ["HOUSEKEEPING", "FRONT_DESK"] as Role[],
  STOCK_REQUEST_UPDATE_REVIEW_GET_DELETE: [
    "HOTEL_MANAGER",
    "SUPERVISOR",
    "FRONT_DESK",
    "HOUSEKEEPING",
  ] as Role[],
  DELETE_ALL_STOCK_REQUESTS: ["HOTEL_MANAGER", "SUPERVISOR"] as Role[],
  DELETE_OWN_STOCK_REQUESTS: ["HOUSEKEEPING", "FRONT_DESK"] as Role[],
};

export const canViewLocation = (role: Role) => {
  return PERMISSIONS.CAN_VIEW_LOCATION.includes(role);
};

export const canManageLocation = (role: Role) => {
  return PERMISSIONS.MANAGE_LOCATION.includes(role);
};

export const canManageCategory = (role: Role) => {
  return PERMISSIONS.MANAGE_CATEGORY.includes(role);
};

export const canViewItem = (role: Role) => {
  return PERMISSIONS.CAN_VIEW_ITEM.includes(role);
};
export const canManageItem = (role: Role) => {
  return PERMISSIONS.MANAGE_ITEM.includes(role);
};

export const canViewStock = (role: Role) => {
  return PERMISSIONS.CAN_VIEW_STOCK.includes(role);
};

export const canManageStock = (role: Role) => {
  return PERMISSIONS.MANAGE_STOCK.includes(role);
};

export const canManageStockMovement = (role: Role) => {
  return PERMISSIONS.MANAGE_STOCK_MOVEMENT.includes(role);
};

export const canDeleteLocation = (role: Role) => {
  return role === "HOTEL_MANAGER";
};

export const canDeleteCategory = (role: Role) => {
  return role === "HOTEL_MANAGER";
};

export const canDeleteItem = (role: Role) => {
  return role === "HOTEL_MANAGER";
};

export const canDeleteStock = (role: Role) => {
  return role === "HOTEL_MANAGER";
};

export const canDeleteStockMovement = (role: Role) => {
  return role === "HOTEL_MANAGER";
};

export const canAccessManagerDashboard = (role: Role) => {
  return role === PERMISSIONS.ACCESS_MANAGER_DASHBOARD;
};

export const canManageLaundry = (role: Role) => {
  return PERMISSIONS.MANAGER_LAUNDRY.includes(role);
};

export const canPrintReport = (role: Role) => {
  return PERMISSIONS.PRINT_REPORT.includes(role);
};

export const canCreateStockRequest = (role: Role) => {
  return PERMISSIONS.STOCK_REQUEST_CREATE.includes(role);
};

export const canUpdateReviewGetDeleteStockRequest = (role: Role) => {
  return PERMISSIONS.STOCK_REQUEST_UPDATE_REVIEW_GET_DELETE.includes(role);
};

export const canDeleteAllStockRequest = (role: Role) => {
  return PERMISSIONS.DELETE_ALL_STOCK_REQUESTS.includes(role);
};

export const canDeleteOwnStockRequest = (role: Role) => {
  return PERMISSIONS.DELETE_OWN_STOCK_REQUESTS.includes(role);
};
