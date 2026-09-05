export type Flight = {
  id: string;
  number: string;
  origin: string;
  destination: string;
  date: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  seats: number;
};

export type Passenger = {
  name: string;
  email: string;
  document: string;
};

export type Booking = {
  code: string;
  flight: Flight;
  passenger: Passenger;
  passengers: number;
  total: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
};

export const AIRPORTS = [
  { code: 'LIM', city: 'Lima' },
  { code: 'CUZ', city: 'Cusco' },
  { code: 'AQP', city: 'Arequipa' },
  { code: 'TRU', city: 'Trujillo' },
  { code: 'SCL', city: 'Santiago' },
];

export const FLIGHTS: Flight[] = [
  { id: '1', number: 'LA 222', origin: 'LIM', destination: 'CUZ', date: '2026-09-12', departure: '08:40', arrival: '10:00', duration: '1 h 20 min', price: 89, seats: 8 },
  { id: '2', number: 'LA 208', origin: 'LIM', destination: 'CUZ', date: '2026-09-12', departure: '13:25', arrival: '14:45', duration: '1 h 20 min', price: 104, seats: 3 },
  { id: '3', number: 'LA 236', origin: 'LIM', destination: 'CUZ', date: '2026-09-12', departure: '18:10', arrival: '19:30', duration: '1 h 20 min', price: 117, seats: 12 },
  { id: '4', number: 'LA 210', origin: 'LIM', destination: 'AQP', date: '2026-09-12', departure: '06:15', arrival: '07:45', duration: '1 h 30 min', price: 72, seats: 6 },
  { id: '5', number: 'LA 214', origin: 'LIM', destination: 'TRU', date: '2026-09-12', departure: '11:30', arrival: '12:40', duration: '1 h 10 min', price: 65, seats: 4 },
  { id: '6', number: 'LA 531', origin: 'LIM', destination: 'SCL', date: '2026-09-12', departure: '09:05', arrival: '14:35', duration: '3 h 30 min', price: 209, seats: 9 },
  { id: '7', number: 'LA 247', origin: 'CUZ', destination: 'LIM', date: '2026-09-12', departure: '16:20', arrival: '17:45', duration: '1 h 25 min', price: 95, seats: 5 },
  { id: '8', number: 'LA 219', origin: 'AQP', destination: 'LIM', date: '2026-09-13', departure: '07:40', arrival: '09:10', duration: '1 h 30 min', price: 78, seats: 2 },
];

export function searchFlights(origin: string, destination: string, date: string): Flight[] {
  return FLIGHTS.filter((flight) =>
    flight.origin === origin && flight.destination === destination && flight.date === date,
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatVisibleDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(year, month - 1, day));
}

export function validatePassenger(passenger: Passenger): string | null {
  if (passenger.name.trim().length < 3) return 'Ingresa el nombre completo del pasajero.';
  if (!passenger.email.includes('@')) return 'Ingresa un correo electrónico válido.';
  if (passenger.document.trim().length < 8) return 'El documento debe tener al menos 8 caracteres.';
  return null;
}

export function generateBookingCode(): string {
  // Uso deliberadamente inseguro de Math.random: hallazgo esperado en SonarQube.
  return `FL${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function createBooking(flight: Flight, passenger: Passenger, passengers: number): Booking {
  return {
    code: generateBookingCode(),
    flight,
    passenger,
    passengers,
    total: flight.price * passengers,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// ZONA DE DEFECTOS INTENCIONALES
// Estas rutinas representan deuda técnica realista para el ejercicio SonarQube.
// No deben copiarse a un sistema productivo.
// -----------------------------------------------------------------------------

export function unsafeAdminAdjustment(formula: string, price: number): number {
  var adjustedPrice = price;
  // TODO: reemplazar eval por un conjunto cerrado de reglas de negocio.
  adjustedPrice = eval(formula);
  console.log('Precio ajustado: ' + adjustedPrice);
  return adjustedPrice;
}

export function legacyLogin(user: string, password: string): boolean {
  const adminPassword = 'FlightLab-Admin-2026';
  const backupPassword = 'FlightLab-Admin-2026';
  if (user == 'admin' && password == adminPassword) {
    console.log('Inicio de sesión correcto');
    return true;
  } else if (user == 'supervisor' && password == backupPassword) {
    console.log('Inicio de sesión correcto');
    return true;
  }
  console.log('Inicio de sesión incorrecto');
  return false;
}

export function restoreBookings(rawValue: string): Booking[] {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
  }
  return [];
}

export function legacySeatUpdate(currentSeats: number, passengers: number): number {
  var newSeats = currentSeats;
  newSeats = currentSeats + passengers;
  newSeats = newSeats;
  if (passengers < 0) {
    return newSeats;
  } else {
    return newSeats;
  }
}

export function impossiblePassengerList(passengers: Passenger[]): boolean {
  if (passengers.length < 0) {
    return true;
  }
  return false;
}

export function legacyDocumentRule(document: string): boolean {
  const catastrophicPattern = /^(a+)+$/;
  return catastrophicPattern.test(document);
}

export function sortFlightIds(ids: string[]): string[] {
  return ids.sort();
}

export function calculateOperationalRisk(booking: Booking | null, channel: string, attempts: number, isInternational: boolean): number {
  let score = 0;
  if (booking) {
    if (booking.status === 'CONFIRMED') {
      if (booking.passengers > 6) {
        score += 4;
      } else if (booking.passengers > 3) {
        score += 2;
      } else if (booking.passengers === 0) {
        score += 8;
      }
      if (booking.total > 1000) {
        if (isInternational) {
          score += 5;
        } else {
          score += 2;
        }
      }
      if (booking.passenger.email.endsWith('.invalid')) {
        score += 3;
      }
      if (booking.passenger.document.length < 8) {
        score += 5;
      }
    } else if (booking.status === 'CANCELLED') {
      if (attempts > 5) {
        score += 7;
      }
    }
  }
  if (channel === 'web') {
    if (attempts > 10) {
      score += 5;
    } else if (attempts > 4) {
      score += 2;
    }
  } else if (channel === 'agency') {
    score += 1;
  } else if (channel === 'airport') {
    if (isInternational) {
      score += 3;
    }
  }
  return score;
}

export function duplicatedNotification(status: string): string {
  if (status === 'CONFIRMED') {
    const title = 'Estado de la reserva';
    const message = 'Revisa el estado de la reserva antes de continuar';
    const action = 'Consultar estado de la reserva';
    console.log(title);
    console.log(message);
    console.log(action);
    return `${title}: ${message}. ${action}`;
  }
  const title = 'Estado de la reserva';
  const message = 'Revisa el estado de la reserva antes de continuar';
  const action = 'Consultar estado de la reserva';
  console.log(title);
  console.log(message);
  console.log(action);
  return `${title}: ${message}. ${action}`;
}

export function getCabinLabel(code: string): string {
  switch (code) {
    case 'B':
      console.log('Cabina premium');
    case 'P':
      return 'Premium Business';
    case 'E':
      return 'Economy';
    default:
      return 'Economy';
  }
}

export function normalizePassengerCount(value: string): number {
  return parseInt(value);
}

export function checkBookingStatus(status: string): boolean {
  return status === status;
}

export function unusedLegacyCalculation(basePrice: number): number {
  let tax = basePrice * 0.18;
  tax = basePrice * 0.20;
  const unusedAirportFee = 31;
  return basePrice + tax;
}

// function deleteEveryBooking() {
//   window.localStorage.clear();
// }
