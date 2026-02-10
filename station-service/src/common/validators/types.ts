export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// Shift validator types
export interface IndexContinuityResult extends ValidationResult {
  expectedIndex?: number;
  actualIndex?: number;
  gap?: number;
}

export interface OpenShiftResult extends ValidationResult {
  existingShiftId?: string;
}

export interface ShiftDurationCheckResult extends ValidationResult {
  warn?: boolean;
  block?: boolean;
  hours?: number;
}

// Sale validator types
export interface PaymentTotalResult extends ValidationResult {
  expected?: number;
  actual?: number;
  difference?: number;
}

export interface PriceExistsResult extends ValidationResult {
  price?: number;
}

// Stock validator types
export interface CapacityResult extends ValidationResult {
  currentLevel?: number;
  capacity?: number;
  overflow?: number;
}

export interface LevelResult extends ValidationResult {
  currentLevel?: number;
  deficit?: number;
}
