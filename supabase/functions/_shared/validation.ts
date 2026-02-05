// Comprehensive input validation utilities for edge functions
// Uses Zod-like patterns for schema validation

// ============= Constants =============
export const VALIDATION_LIMITS = {
  // String lengths
  MESSAGE_MAX_LENGTH: 4000,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 30,
  LOCATION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
  FLIGHT_NUMBER_MAX_LENGTH: 20,
  VEHICLE_TYPE_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_MIN_LENGTH: 10,
  TOKEN_MAX_LENGTH: 500,
  
  // Array limits
  CONVERSATION_HISTORY_MAX_LENGTH: 100,
  PASSENGER_NAMES_MAX_LENGTH: 20,
  
  // Numeric ranges
  PASSENGERS_MIN: 1,
  PASSENGERS_MAX: 50,
  LUGGAGE_MIN: 0,
  LUGGAGE_MAX: 30,
  BABY_SEAT_MIN: 0,
  BABY_SEAT_MAX: 10,
  PRICE_MIN: 0,
  PRICE_MAX: 100000,
  DURATION_HOURS_MIN: 1,
  DURATION_HOURS_MAX: 24,
};

// ============= Regex Patterns =============
export const PATTERNS = {
  // Email: RFC 5322 simplified
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Phone: International format with optional + and country code
  PHONE: /^\+?[0-9\s\-()]{7,30}$/,
  
  // Date: YYYY-MM-DD format
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // Time: HH:MM or HH:MM:SS format
  TIME: /^\d{2}:\d{2}(:\d{2})?$/,
  
  // Flight number: 2-3 letters + 1-5 digits
  FLIGHT_NUMBER: /^[A-Z]{2,3}\s?\d{1,5}$/i,
  
  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Currency code: 3 uppercase letters
  CURRENCY: /^[A-Z]{3}$/,
  
  // Vehicle type: lowercase with hyphens
  VEHICLE_TYPE: /^[a-z0-9-]+$/,
};

// ============= Validation Result Type =============
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

// ============= String Validators =============
export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): ValidationResult<string> {
  const { required = true, minLength = 0, maxLength = 1000, pattern, patternMessage } = options;
  
  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { success: false, error: `${fieldName} is required`, field: fieldName };
    }
    return { success: true, data: '' };
  }
  
  // Type check
  if (typeof value !== 'string') {
    return { success: false, error: `${fieldName} must be a string`, field: fieldName };
  }
  
  // Trim and check length
  const trimmed = value.trim();
  
  if (required && trimmed.length === 0) {
    return { success: false, error: `${fieldName} is required`, field: fieldName };
  }
  
  if (trimmed.length < minLength) {
    return { success: false, error: `${fieldName} must be at least ${minLength} characters`, field: fieldName };
  }
  
  if (trimmed.length > maxLength) {
    return { success: false, error: `${fieldName} must be at most ${maxLength} characters`, field: fieldName };
  }
  
  // Pattern validation
  if (pattern && trimmed.length > 0 && !pattern.test(trimmed)) {
    return { success: false, error: patternMessage || `${fieldName} format is invalid`, field: fieldName };
  }
  
  return { success: true, data: trimmed };
}

// ============= Email Validator =============
export function validateEmail(value: unknown, required = true): ValidationResult<string> {
  const stringResult = validateString(value, 'Email', {
    required,
    maxLength: VALIDATION_LIMITS.EMAIL_MAX_LENGTH,
  });
  
  if (!stringResult.success) return stringResult;
  if (!required && !stringResult.data) return { success: true, data: '' };
  
  if (!PATTERNS.EMAIL.test(stringResult.data!)) {
    return { success: false, error: 'Invalid email format', field: 'email' };
  }
  
  return { success: true, data: stringResult.data!.toLowerCase() };
}

// ============= Phone Validator =============
export function validatePhone(value: unknown, required = true): ValidationResult<string> {
  const stringResult = validateString(value, 'Phone', {
    required,
    maxLength: VALIDATION_LIMITS.PHONE_MAX_LENGTH,
  });
  
  if (!stringResult.success) return stringResult;
  if (!required && !stringResult.data) return { success: true, data: '' };
  
  // Normalize phone number (remove spaces and special chars for validation)
  const normalized = stringResult.data!.replace(/[\s\-()]/g, '');
  
  if (!PATTERNS.PHONE.test(stringResult.data!)) {
    return { success: false, error: 'Invalid phone format. Use international format (e.g., +905551234567)', field: 'phone' };
  }
  
  return { success: true, data: stringResult.data! };
}

// ============= Number Validator =============
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult<number> {
  const { required = true, min = -Infinity, max = Infinity, integer = false } = options;
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    if (required) {
      return { success: false, error: `${fieldName} is required`, field: fieldName };
    }
    return { success: true, data: undefined as unknown as number };
  }
  
  // Parse number
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(num)) {
    return { success: false, error: `${fieldName} must be a valid number`, field: fieldName };
  }
  
  if (integer && !Number.isInteger(num)) {
    return { success: false, error: `${fieldName} must be an integer`, field: fieldName };
  }
  
  if (num < min) {
    return { success: false, error: `${fieldName} must be at least ${min}`, field: fieldName };
  }
  
  if (num > max) {
    return { success: false, error: `${fieldName} must be at most ${max}`, field: fieldName };
  }
  
  return { success: true, data: num };
}

// ============= Boolean Validator =============
export function validateBoolean(
  value: unknown,
  fieldName: string,
  required = false
): ValidationResult<boolean> {
  if (value === null || value === undefined) {
    if (required) {
      return { success: false, error: `${fieldName} is required`, field: fieldName };
    }
    return { success: true, data: false };
  }
  
  if (typeof value !== 'boolean') {
    return { success: false, error: `${fieldName} must be a boolean`, field: fieldName };
  }
  
  return { success: true, data: value };
}

// ============= UUID Validator =============
export function validateUUID(value: unknown, fieldName: string, required = true): ValidationResult<string> {
  const stringResult = validateString(value, fieldName, { required, maxLength: 36 });
  
  if (!stringResult.success) return stringResult;
  if (!required && !stringResult.data) return { success: true, data: '' };
  
  if (!PATTERNS.UUID.test(stringResult.data!)) {
    return { success: false, error: `${fieldName} must be a valid UUID`, field: fieldName };
  }
  
  return { success: true, data: stringResult.data! };
}

// ============= Date Validator =============
export function validateDate(value: unknown, fieldName: string, required = true): ValidationResult<string> {
  const stringResult = validateString(value, fieldName, { required, maxLength: 10 });
  
  if (!stringResult.success) return stringResult;
  if (!required && !stringResult.data) return { success: true, data: '' };
  
  if (!PATTERNS.DATE.test(stringResult.data!)) {
    return { success: false, error: `${fieldName} must be in YYYY-MM-DD format`, field: fieldName };
  }
  
  // Validate actual date
  const date = new Date(stringResult.data!);
  if (isNaN(date.getTime())) {
    return { success: false, error: `${fieldName} is not a valid date`, field: fieldName };
  }
  
  return { success: true, data: stringResult.data! };
}

// ============= Time Validator =============
export function validateTime(value: unknown, fieldName: string, required = true): ValidationResult<string> {
  const stringResult = validateString(value, fieldName, { required, maxLength: 8 });
  
  if (!stringResult.success) return stringResult;
  if (!required && !stringResult.data) return { success: true, data: '' };
  
  if (!PATTERNS.TIME.test(stringResult.data!)) {
    return { success: false, error: `${fieldName} must be in HH:MM format`, field: fieldName };
  }
  
  return { success: true, data: stringResult.data! };
}

// ============= Array Validator =============
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator: (item: unknown, index: number) => ValidationResult<T>,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationResult<T[]> {
  const { required = false, minLength = 0, maxLength = 100 } = options;
  
  if (value === null || value === undefined) {
    if (required) {
      return { success: false, error: `${fieldName} is required`, field: fieldName };
    }
    return { success: true, data: [] };
  }
  
  if (!Array.isArray(value)) {
    return { success: false, error: `${fieldName} must be an array`, field: fieldName };
  }
  
  if (value.length < minLength) {
    return { success: false, error: `${fieldName} must have at least ${minLength} items`, field: fieldName };
  }
  
  if (value.length > maxLength) {
    return { success: false, error: `${fieldName} must have at most ${maxLength} items`, field: fieldName };
  }
  
  const results: T[] = [];
  for (let i = 0; i < value.length; i++) {
    const result = itemValidator(value[i], i);
    if (!result.success) {
      return { success: false, error: `${fieldName}[${i}]: ${result.error}`, field: `${fieldName}[${i}]` };
    }
    results.push(result.data!);
  }
  
  return { success: true, data: results };
}

// ============= Booking Assistant Validation =============
export interface BookingAssistantInput {
  message: string;
  language: string;
  conversationHistory: Array<{ role: string; content: string }>;
  visitorId?: string;
  stream: boolean;
  customerName?: string;
}

export function validateBookingAssistantInput(data: unknown): ValidationResult<BookingAssistantInput> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate message (required)
  const messageResult = validateString(obj.message, 'message', {
    required: true,
    minLength: 1,
    maxLength: VALIDATION_LIMITS.MESSAGE_MAX_LENGTH,
  });
  if (!messageResult.success) return messageResult;
  
  // Validate language (optional, default EN)
  const languageResult = validateString(obj.language, 'language', {
    required: false,
    maxLength: 10,
  });
  if (!languageResult.success) return languageResult;
  
  // Validate conversationHistory (optional array)
  const historyResult = validateArray(
    obj.conversationHistory,
    'conversationHistory',
    (item, index) => {
      if (!item || typeof item !== 'object') {
        return { success: false, error: 'must be an object' };
      }
      const msg = item as Record<string, unknown>;
      
      // Validate role
      if (!['user', 'assistant', 'system'].includes(String(msg.role))) {
        return { success: false, error: 'role must be user, assistant, or system' };
      }
      
      // Validate content
      const contentResult = validateString(msg.content, 'content', {
        required: true,
        maxLength: VALIDATION_LIMITS.MESSAGE_MAX_LENGTH,
      });
      if (!contentResult.success) return contentResult;
      
      return { success: true, data: { role: String(msg.role), content: contentResult.data! } };
    },
    { maxLength: VALIDATION_LIMITS.CONVERSATION_HISTORY_MAX_LENGTH }
  );
  if (!historyResult.success) return historyResult;
  
  // Validate visitorId (optional)
  const visitorIdResult = validateString(obj.visitorId, 'visitorId', {
    required: false,
    maxLength: 100,
  });
  if (!visitorIdResult.success) return visitorIdResult;
  
  // Validate stream (optional boolean)
  const streamResult = validateBoolean(obj.stream, 'stream', false);
  if (!streamResult.success) return streamResult;
  
  // Validate customerName (optional)
  const customerNameResult = validateString(obj.customerName, 'customerName', {
    required: false,
    maxLength: VALIDATION_LIMITS.NAME_MAX_LENGTH,
  });
  if (!customerNameResult.success) return customerNameResult;
  
  return {
    success: true,
    data: {
      message: messageResult.data!,
      language: languageResult.data || 'EN',
      conversationHistory: historyResult.data || [],
      visitorId: visitorIdResult.data || undefined,
      stream: streamResult.data || false,
      customerName: customerNameResult.data || undefined,
    },
  };
}

// ============= Quick Booking Reservation Validation =============
export interface QuickBookingReservationInput {
  bookingId: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  passengers: number;
  price: number;
  priceCurrency: string;
  paymentMethod: string;
  hasReturnTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  returnPrice?: number;
  returnDiscountPercentage?: number;
  returnDiscountAmount?: number;
  promoCode?: string;
  babySeatCount?: number;
  luggageCount?: number;
  customerNotes?: string;
  flightNumber?: string;
  passengerNames?: string[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerPassword?: string;
  isGoogleUser?: boolean;
}

export function validateQuickBookingReservationInput(data: unknown): ValidationResult<QuickBookingReservationInput> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Required fields
  const bookingIdResult = validateUUID(obj.bookingId, 'bookingId');
  if (!bookingIdResult.success) return bookingIdResult;
  
  const pickupResult = validateString(obj.pickup, 'pickup', {
    required: true,
    maxLength: VALIDATION_LIMITS.LOCATION_MAX_LENGTH,
  });
  if (!pickupResult.success) return pickupResult;
  
  const dropoffResult = validateString(obj.dropoff, 'dropoff', {
    required: true,
    maxLength: VALIDATION_LIMITS.LOCATION_MAX_LENGTH,
  });
  if (!dropoffResult.success) return dropoffResult;
  
  const pickupDateResult = validateDate(obj.pickupDate, 'pickupDate');
  if (!pickupDateResult.success) return pickupDateResult;
  
  const pickupTimeResult = validateTime(obj.pickupTime, 'pickupTime');
  if (!pickupTimeResult.success) return pickupTimeResult;
  
  const vehicleTypeResult = validateString(obj.vehicleType, 'vehicleType', {
    required: true,
    maxLength: VALIDATION_LIMITS.VEHICLE_TYPE_MAX_LENGTH,
  });
  if (!vehicleTypeResult.success) return vehicleTypeResult;
  
  const passengersResult = validateNumber(obj.passengers, 'passengers', {
    required: true,
    min: VALIDATION_LIMITS.PASSENGERS_MIN,
    max: VALIDATION_LIMITS.PASSENGERS_MAX,
    integer: true,
  });
  if (!passengersResult.success) return passengersResult;
  
  const priceResult = validateNumber(obj.price, 'price', {
    required: true,
    min: VALIDATION_LIMITS.PRICE_MIN,
    max: VALIDATION_LIMITS.PRICE_MAX,
  });
  if (!priceResult.success) return priceResult;
  
  const priceCurrencyResult = validateString(obj.priceCurrency, 'priceCurrency', {
    required: true,
    maxLength: 3,
    pattern: PATTERNS.CURRENCY,
    patternMessage: 'priceCurrency must be a 3-letter currency code (e.g., EUR, USD)',
  });
  if (!priceCurrencyResult.success) return priceCurrencyResult;
  
  const paymentMethodResult = validateString(obj.paymentMethod, 'paymentMethod', {
    required: true,
    maxLength: 50,
  });
  if (!paymentMethodResult.success) return paymentMethodResult;
  
  const hasReturnTripResult = validateBoolean(obj.hasReturnTrip, 'hasReturnTrip', false);
  if (!hasReturnTripResult.success) return hasReturnTripResult;
  
  // Optional fields
  const returnDateResult = validateDate(obj.returnDate, 'returnDate', false);
  if (!returnDateResult.success) return returnDateResult;
  
  const returnTimeResult = validateTime(obj.returnTime, 'returnTime', false);
  if (!returnTimeResult.success) return returnTimeResult;
  
  const returnPriceResult = validateNumber(obj.returnPrice, 'returnPrice', {
    required: false,
    min: VALIDATION_LIMITS.PRICE_MIN,
    max: VALIDATION_LIMITS.PRICE_MAX,
  });
  if (!returnPriceResult.success) return returnPriceResult;
  
  const returnDiscountPercentageResult = validateNumber(obj.returnDiscountPercentage, 'returnDiscountPercentage', {
    required: false,
    min: 0,
    max: 100,
  });
  if (!returnDiscountPercentageResult.success) return returnDiscountPercentageResult;
  
  const returnDiscountAmountResult = validateNumber(obj.returnDiscountAmount, 'returnDiscountAmount', {
    required: false,
    min: 0,
    max: VALIDATION_LIMITS.PRICE_MAX,
  });
  if (!returnDiscountAmountResult.success) return returnDiscountAmountResult;
  
  const promoCodeResult = validateString(obj.promoCode, 'promoCode', {
    required: false,
    maxLength: 50,
  });
  if (!promoCodeResult.success) return promoCodeResult;
  
  const babySeatCountResult = validateNumber(obj.babySeatCount, 'babySeatCount', {
    required: false,
    min: VALIDATION_LIMITS.BABY_SEAT_MIN,
    max: VALIDATION_LIMITS.BABY_SEAT_MAX,
    integer: true,
  });
  if (!babySeatCountResult.success) return babySeatCountResult;
  
  const luggageCountResult = validateNumber(obj.luggageCount, 'luggageCount', {
    required: false,
    min: VALIDATION_LIMITS.LUGGAGE_MIN,
    max: VALIDATION_LIMITS.LUGGAGE_MAX,
    integer: true,
  });
  if (!luggageCountResult.success) return luggageCountResult;
  
  const customerNotesResult = validateString(obj.customerNotes, 'customerNotes', {
    required: false,
    maxLength: VALIDATION_LIMITS.NOTES_MAX_LENGTH,
  });
  if (!customerNotesResult.success) return customerNotesResult;
  
  const flightNumberResult = validateString(obj.flightNumber, 'flightNumber', {
    required: false,
    maxLength: VALIDATION_LIMITS.FLIGHT_NUMBER_MAX_LENGTH,
  });
  if (!flightNumberResult.success) return flightNumberResult;
  
  // Validate passengerNames array
  const passengerNamesResult = validateArray(
    obj.passengerNames,
    'passengerNames',
    (name) => validateString(name, 'passengerName', { required: true, maxLength: VALIDATION_LIMITS.NAME_MAX_LENGTH }),
    { maxLength: VALIDATION_LIMITS.PASSENGER_NAMES_MAX_LENGTH }
  );
  if (!passengerNamesResult.success) return passengerNamesResult;
  
  // Customer info (optional)
  const customerNameResult = validateString(obj.customerName, 'customerName', {
    required: false,
    maxLength: VALIDATION_LIMITS.NAME_MAX_LENGTH,
  });
  if (!customerNameResult.success) return customerNameResult;
  
  const customerPhoneResult = obj.customerPhone ? validatePhone(obj.customerPhone, false) : { success: true, data: '' };
  if (!customerPhoneResult.success) return customerPhoneResult;
  
  const customerEmailResult = obj.customerEmail ? validateEmail(obj.customerEmail, false) : { success: true, data: '' };
  if (!customerEmailResult.success) return customerEmailResult;
  
  const customerPasswordResult = validateString(obj.customerPassword, 'customerPassword', {
    required: false,
    minLength: obj.customerPassword ? VALIDATION_LIMITS.PASSWORD_MIN_LENGTH : 0,
    maxLength: VALIDATION_LIMITS.PASSWORD_MAX_LENGTH,
  });
  if (!customerPasswordResult.success) return customerPasswordResult;
  
  const isGoogleUserResult = validateBoolean(obj.isGoogleUser, 'isGoogleUser', false);
  if (!isGoogleUserResult.success) return isGoogleUserResult;
  
  return {
    success: true,
    data: {
      bookingId: bookingIdResult.data!,
      pickup: pickupResult.data!,
      dropoff: dropoffResult.data!,
      pickupDate: pickupDateResult.data!,
      pickupTime: pickupTimeResult.data!,
      vehicleType: vehicleTypeResult.data!,
      passengers: passengersResult.data!,
      price: priceResult.data!,
      priceCurrency: priceCurrencyResult.data!,
      paymentMethod: paymentMethodResult.data!,
      hasReturnTrip: hasReturnTripResult.data || false,
      returnDate: returnDateResult.data || undefined,
      returnTime: returnTimeResult.data || undefined,
      returnPrice: returnPriceResult.data,
      returnDiscountPercentage: returnDiscountPercentageResult.data,
      returnDiscountAmount: returnDiscountAmountResult.data,
      promoCode: promoCodeResult.data || undefined,
      babySeatCount: babySeatCountResult.data,
      luggageCount: luggageCountResult.data,
      customerNotes: customerNotesResult.data || undefined,
      flightNumber: flightNumberResult.data || undefined,
      passengerNames: passengerNamesResult.data,
      customerName: customerNameResult.data || undefined,
      customerPhone: customerPhoneResult.data || undefined,
      customerEmail: customerEmailResult.data || undefined,
      customerPassword: customerPasswordResult.data || undefined,
      isGoogleUser: isGoogleUserResult.data || false,
    },
  };
}

// ============= Update Customer Validation =============
export interface UpdateCustomerInput {
  reservationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerPassword?: string;
  customerId?: string;
  isGoogleAuth?: boolean;
  returnReservationCode?: string;
  selectedVehicle?: string;
  newPrice?: number;
}

export function validateUpdateCustomerInput(data: unknown): ValidationResult<UpdateCustomerInput> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Required fields
  const reservationIdResult = validateUUID(obj.reservationId, 'reservationId');
  if (!reservationIdResult.success) return reservationIdResult;
  
  const customerNameResult = validateString(obj.customerName, 'customerName', {
    required: true,
    minLength: 1,
    maxLength: VALIDATION_LIMITS.NAME_MAX_LENGTH,
  });
  if (!customerNameResult.success) return customerNameResult;
  
  const customerPhoneResult = validatePhone(obj.customerPhone, true);
  if (!customerPhoneResult.success) return customerPhoneResult;
  
  const customerEmailResult = validateEmail(obj.customerEmail, true);
  if (!customerEmailResult.success) return customerEmailResult;
  
  // Optional fields
  const isGoogleAuthResult = validateBoolean(obj.isGoogleAuth, 'isGoogleAuth', false);
  if (!isGoogleAuthResult.success) return isGoogleAuthResult;
  
  // Password required if not Google auth
  if (!isGoogleAuthResult.data && obj.customerPassword !== undefined) {
    const customerPasswordResult = validateString(obj.customerPassword, 'customerPassword', {
      required: !isGoogleAuthResult.data,
      minLength: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: VALIDATION_LIMITS.PASSWORD_MAX_LENGTH,
    });
    if (!customerPasswordResult.success) return customerPasswordResult;
  }
  
  const customerIdResult = obj.customerId ? validateUUID(obj.customerId, 'customerId', false) : { success: true, data: '' };
  if (!customerIdResult.success) return customerIdResult;
  
  const returnReservationCodeResult = validateString(obj.returnReservationCode, 'returnReservationCode', {
    required: false,
    maxLength: 20,
  });
  if (!returnReservationCodeResult.success) return returnReservationCodeResult;
  
  const selectedVehicleResult = validateString(obj.selectedVehicle, 'selectedVehicle', {
    required: false,
    maxLength: VALIDATION_LIMITS.VEHICLE_TYPE_MAX_LENGTH,
  });
  if (!selectedVehicleResult.success) return selectedVehicleResult;
  
  const newPriceResult = validateNumber(obj.newPrice, 'newPrice', {
    required: false,
    min: VALIDATION_LIMITS.PRICE_MIN,
    max: VALIDATION_LIMITS.PRICE_MAX,
  });
  if (!newPriceResult.success) return newPriceResult;
  
  return {
    success: true,
    data: {
      reservationId: reservationIdResult.data!,
      customerName: customerNameResult.data!,
      customerPhone: customerPhoneResult.data!,
      customerEmail: customerEmailResult.data!,
      customerPassword: obj.customerPassword as string | undefined,
      customerId: customerIdResult.data || undefined,
      isGoogleAuth: isGoogleAuthResult.data || false,
      returnReservationCode: returnReservationCodeResult.data || undefined,
      selectedVehicle: selectedVehicleResult.data || undefined,
      newPrice: newPriceResult.data,
    },
  };
}

// ============= Token Validation =============
export interface TokenInput {
  token: string;
}

export function validateTokenInput(data: unknown): ValidationResult<TokenInput> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }
  
  const obj = data as Record<string, unknown>;
  
  const tokenResult = validateString(obj.token, 'token', {
    required: true,
    minLength: VALIDATION_LIMITS.TOKEN_MIN_LENGTH,
    maxLength: VALIDATION_LIMITS.TOKEN_MAX_LENGTH,
  });
  if (!tokenResult.success) return tokenResult;
  
  return {
    success: true,
    data: {
      token: tokenResult.data!,
    },
  };
}

// ============= Helper to create error response =============
export function createValidationErrorResponse(error: string, corsHeaders: Record<string, string>): Response {
  console.error("Validation error:", error);
  return new Response(
    JSON.stringify({ error }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
