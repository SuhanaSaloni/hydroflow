export type DispatchTier = 'HIGH' | 'MEDIUM' | 'REGULAR';

export interface LatLng {
  lat: number;
  lon: number;
}

export interface HouseholdProfile extends LatLng {
  id: string;
  name: string;
  occupants: number;
  tankCapacityLitres: number;
  currentLevelLitres: number;
  address: string;
  floor: string;
  landmark: string;
  lastBookingAt?: string;
  bookingsLast30Days: number;
  hoursWithoutWater: number;
  criticalNeed: boolean;
  criticalNeedReason?: string;
}

export interface DriverProfile {
  name: string;
  phone: string;
  safetyRating: number;
  tripsToday: number;
  photoEmoji: string;
}

export interface Borewell {
  id: string;
  name: string;
  location: string;
  tdsPpm: number;
  ph: number;
  verified: boolean;
  yieldLph: number;
  lastTestedAt: string;
}

export interface TankerVehicle {
  id: string;
  plate: string;
  capacityLitres: number;
  loadedLitres: number;
  status: 'AVAILABLE' | 'ON_ROUTE' | 'SERVICING';
  driver: DriverProfile;
  sourceBorewell: Pick<Borewell, 'id' | 'name'>;
}

export interface WaterPassport {
  householdId: string;
  borewell: Borewell;
  driver: DriverProfile;
  vehicle: {
    plate: string;
    capacityLitres: number;
    lastSafetyInspection: string;
  };
  lastTdsPpm: number;
  labCertified: boolean;
  pipelineRefill: boolean;
}

export interface PriorityRequest {
  householdId: string;
  householdName: string;
  address: string;
  requestedLitres: number;
  score: number;
  tier: DispatchTier;
  hoursWithoutWater: number;
  criticalNeed: boolean;
  recentBookings30d: number;
  linePosition: number;
}

export interface DeliveryStop extends LatLng {
  index: number;
  householdId: string;
  householdName: string;
  address: string;
  floor: string;
  landmark: string;
  litres: number;
  remainingAfterStop: number;
  etaMinutes: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  otp: string;
  phone: string;
}

export interface DeliveryRun {
  id: string;
  loadId: string;
  tankerId: string;
  plate: string;
  driverName: string;
  capacityLitres: number;
  totalLitresLoaded: number;
  clusterCentre: LatLng;
  stops: DeliveryStop[];
  totalDistanceKm: number;
  radiusKm: number;
  status: 'PLANNED' | 'ON_ROUTE' | 'COMPLETED';
  sourceBorewell: string;
}

export interface SupplyPool extends LatLng {
  id: string;
  name: string;
  zone: string;
  membersCount: number;
  targetMembers: number;
  committedLitres: number;
  targetLitres: number;
  costPerLitre: number;
  standardCostPerLitre: number;
  savingsPerLitre: number;
  refillEta: string;
  distanceKm: number;
  joined: boolean;
}

export interface DeliverySlot {
  date: string;
  window: string;
}

export interface BookingPreview {
  request: PriorityRequest;
  slots: DeliverySlot[];
  poolActive: boolean;
  pricePerLitre: number;
  standardPricePerLitre: number;
  surgeFactor: number;
  creditScored: boolean;
}

export interface WaterLevelForecast {
  currentLitres: number;
  capacityLitres: number;
  occupants: number;
  heatFactor: number;
  dailyDepletionLitres: number;
  daysUntilEmpty: number;
  warningAtLitres: number;
  health: 'GOOD' | 'WATCH' | 'CRITICAL';
}

export type ProofStatus = 'PENDING' | 'VERIFIED' | 'MISMATCH';

export interface ProofOfDelivery {
  stopIndex: number;
  deliveredLitres: number;
  status: ProofStatus;
  submittedAt?: string;
}