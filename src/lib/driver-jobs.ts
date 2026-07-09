import { haversineKm, vehicleCanFulfill, type VehicleFilter } from "@/lib/vehicle-types";
import type { DeliveryRow, DriverProfile } from "@/lib/types/marketplace";

/** Client-side filter mirroring server rules for assigned + open jobs. */
export function filterJobsForDriver(
  jobs: DeliveryRow[],
  driver: DriverProfile | null | undefined,
  vehicleFilter: VehicleFilter = "all",
): DeliveryRow[] {
  if (!driver) return [];

  return jobs.filter((j) => {
    if (j.status !== "requested" || j.driver_id) return false;

    const declined = ((j as DeliveryRow & { declined_driver_ids?: string[] }).declined_driver_ids ?? []);
    if (declined.includes(driver.id)) return false;

    const req = (j as DeliveryRow & { required_vehicle_type?: string }).required_vehicle_type;
    if (!vehicleCanFulfill(driver.vehicle_type, req)) return false;
    if (vehicleFilter !== "all" && !vehicleCanFulfill(driver.vehicle_type, vehicleFilter)) return false;

    const radius = Number((j as DeliveryRow & { search_radius_km?: number }).search_radius_km ?? 500);
    if (driver.current_lat != null && driver.current_lng != null) {
      const dist = haversineKm(
        { lat: j.pickup_lat, lng: j.pickup_lng },
        { lat: driver.current_lat, lng: driver.current_lng },
      );
      if (dist > radius) return false;
    }

    return true;
  });
}
