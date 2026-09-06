import StockRequestManagement from "@/features/stock-requests/components/StockRequestManagement";
import { locationRepository } from "@/features/locations/location.repository";
import prisma from "@/shared/db/prisma";

export default async function StockRequestsPage() {
  const locations = await locationRepository.getInitialData(prisma);

  return <StockRequestManagement locations={locations} />;
}
