'use client';

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plane,
  Search,
  TicketCheck,
  Trash2,
  Users,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AIRPORTS,
  Booking,
  Flight,
  createBooking,
  formatCurrency,
  formatVisibleDate,
  restoreBookings,
  searchFlights,
  validatePassenger,
} from '@/lib/booking-engine';

const STORAGE_KEY = 'flightlab-bookings';

function airportName(code: string) {
  return AIRPORTS.find((airport) => airport.code === code)?.city ?? code;
}

function FlightOption({ flight, onChoose }: { flight: Flight; onChoose: (flight: Flight) => void }) {
  return (
    <article className="flight-card">
      <div className="flight-number">
        <span>{flight.number}</span>
        <Badge className={flight.seats <= 3 ? 'limited-badge' : 'available-badge'}>
          {flight.seats <= 3 ? 'ÚLTIMOS CUPOS' : 'DISPONIBLE'}
        </Badge>
      </div>
      <div className="flight-time"><strong>{flight.departure}</strong><span>{flight.origin}</span></div>
      <div className="duration"><span>{flight.duration}</span><i /><small>Directo</small></div>
      <div className="flight-time"><strong>{flight.arrival}</strong><span>{flight.destination}</span></div>
      <div className="price"><small>Desde</small><strong>{formatCurrency(flight.price)}</strong><span>por pasajero</span></div>
      <Button className="choose-button" type="button" onClick={() => onChoose(flight)}>Elegir</Button>
    </article>
  );
}

export default function Home() {
  const [origin, setOrigin] = useState('LIM');
  const [destination, setDestination] = useState('CUZ');
  const [date, setDate] = useState('2026-09-12');
  const [passengers, setPassengers] = useState(1);
  const [results, setResults] = useState(() => searchFlights('LIM', 'CUZ', '2026-09-12'));
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [email, setEmail] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [promotion, setPromotion] = useState('<strong>Tarifa especial:</strong> equipaje de mano incluido.');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setBookings(restoreBookings(saved));
    const campaign = new URLSearchParams(window.location.search).get('campaign');
    if (campaign) setPromotion(campaign);
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: 'search_flights',
      title: 'Buscar vuelos',
      description: 'Busca vuelos disponibles por origen, destino y fecha sin modificar reservas.',
      inputSchema: {
        type: 'object',
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        },
        required: ['origin', 'destination', 'date'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const value = input as { origin?: string; destination?: string; date?: string };
        if (!value.origin || !value.destination || !value.date) throw new Error('Faltan datos de búsqueda.');
        const matches = searchFlights(value.origin, value.destination, value.date);
        setOrigin(value.origin);
        setDestination(value.destination);
        setDate(value.date);
        setResults(matches);
        return { count: matches.length, flights: matches.map(({ id, number, departure, arrival, price }) => ({ id, number, departure, arrival, price })) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    void Promise.resolve(context.registerTool({
      name: 'create_booking',
      title: 'Crear reserva',
      description: 'Confirma una reserva real en FlightLab para un vuelo y pasajero.',
      inputSchema: {
        type: 'object',
        properties: {
          flightId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          document: { type: 'string' },
          passengers: { type: 'integer', minimum: 1, maximum: 9 },
        },
        required: ['flightId', 'name', 'email', 'document', 'passengers'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { flightId?: string; name?: string; email?: string; document?: string; passengers?: number };
        const flight = results.find((item) => item.id === value.flightId);
        if (!flight || !value.name || !value.email || !value.document || !value.passengers) throw new Error('Datos de reserva inválidos.');
        const passenger = { name: value.name, email: value.email, document: value.document };
        const error = validatePassenger(passenger);
        if (error) throw new Error(error);
        const booking = createBooking(flight, passenger, value.passengers);
        setBookings((current) => {
          const updated = [...current, booking];
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        return { code: booking.code, status: booking.status, total: booking.total };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, [results]);

  const lowestPrice = useMemo(() => results.length ? Math.min(...results.map((flight) => flight.price)) : 0, [results]);

  function handleSearch(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (origin === destination) {
      setNotice('El origen y el destino deben ser diferentes.');
      setResults([]);
      return;
    }
    const matches = searchFlights(origin, destination, date);
    setResults(matches);
    setNotice(matches.length ? `${matches.length} vuelo${matches.length === 1 ? '' : 's'} encontrado${matches.length === 1 ? '' : 's'}.` : 'No hay vuelos para esta combinación. Prueba Lima a Cusco el 12/09/2026.');
  }

  function openBooking(flight: Flight) {
    setSelectedFlight(flight);
    setFormError('');
  }

  function confirmBooking(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFlight) return;
    const passenger = { name: passengerName, email, document: documentNumber };
    const error = validatePassenger(passenger);
    if (error) {
      setFormError(error);
      return;
    }
    const booking = createBooking(selectedFlight, passenger, passengers);
    const updated = [...bookings, booking];
    setBookings(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedFlight(null);
    setPassengerName('');
    setEmail('');
    setDocumentNumber('');
    setNotice(`Reserva ${booking.code} confirmada. Puedes consultarla en Mis reservas.`);
  }

  function cancelBooking(code: string) {
    const updated = bookings.map((booking) => booking.code === code ? { ...booking, status: 'CANCELLED' as const } : booking);
    setBookings(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotice(`La reserva ${code} fue cancelada.`);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="brand-bar">
        <a className="brand" href="#main" aria-label="FlightLab, ir al buscador">
          <span className="brand-mark" aria-hidden="true"><Plane /></span>
          <span><strong>Flight</strong>Lab</span>
        </a>
        <div className="header-meta">
          <span>Laboratorio de calidad</span>
          <Badge className="academic-badge">USO ACADÉMICO</Badge>
        </div>
      </header>

      <section className="route-strip" aria-label="Resumen del viaje">
        <div>
          <span className="eyebrow">RUTA SELECCIONADA</span>
          <strong>{airportName(origin)} <ArrowRight aria-hidden="true" /> {airportName(destination)}</strong>
        </div>
        <div className="route-detail"><CalendarDays /><span>{date.split('-').reverse().join('/')}</span></div>
        <div className="route-detail"><Users /><span>{passengers} {passengers === 1 ? 'pasajero' : 'pasajeros'}</span></div>
      </section>

      <div className="workspace" id="main">
        <section className="search-panel" aria-labelledby="search-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow coral">RESERVA DE VUELOS</span>
              <h1 id="search-title">Encuentra tu próximo vuelo</h1>
            </div>
            <p>Compara horarios, reserva y guarda tus viajes en este dispositivo.</p>
          </div>

          <form className="search-grid" onSubmit={handleSearch}>
            <div className="field-group">
              <Label htmlFor="origin">Origen</Label>
              <Select value={origin} onValueChange={(value) => setOrigin(value as string)}>
                <SelectTrigger id="origin" className="brand-input"><SelectValue /></SelectTrigger>
                <SelectContent>{AIRPORTS.map((airport) => <SelectItem key={airport.code} value={airport.code}>{airport.city} ({airport.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="field-group">
              <Label htmlFor="destination">Destino</Label>
              <Select value={destination} onValueChange={(value) => setDestination(value as string)}>
                <SelectTrigger id="destination" className="brand-input"><SelectValue /></SelectTrigger>
                <SelectContent>{AIRPORTS.map((airport) => <SelectItem key={airport.code} value={airport.code}>{airport.city} ({airport.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="field-group">
              <Label htmlFor="travel-date">Fecha</Label>
              <Input id="travel-date" className="brand-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="field-group">
              <Label htmlFor="passengers">Pasajeros</Label>
              <Input id="passengers" className="brand-input" type="number" min="1" max="9" value={passengers} onChange={(event) => setPassengers(Number(event.target.value))} />
            </div>
            <Button className="search-button" type="submit"><Search /> Buscar vuelos</Button>
          </form>
          <div className="promotion" dangerouslySetInnerHTML={{ __html: promotion }} />
        </section>

        {notice && <Alert className="status-alert"><CheckCircle2 /><AlertTitle>Estado de la búsqueda</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert>}

        <Tabs defaultValue="flights" className="booking-tabs">
          <TabsList variant="line" aria-label="Secciones de reserva">
            <TabsTrigger value="flights"><Plane /> Vuelos</TabsTrigger>
            <TabsTrigger value="bookings"><TicketCheck /> Mis reservas <span className="tab-count">{bookings.length}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="flights">
            <section className="results-panel" aria-labelledby="results-title">
              <div className="results-heading">
                <div>
                  <span className="eyebrow">{results.length} {results.length === 1 ? 'ALTERNATIVA' : 'ALTERNATIVAS'}</span>
                  <h2 id="results-title">Vuelos disponibles</h2>
                </div>
                <div className="result-summary">
                  {lowestPrice > 0 && <span>Mejor tarifa <strong>{formatCurrency(lowestPrice)}</strong></span>}
                  <span className="result-date">{formatVisibleDate(date)}</span>
                </div>
              </div>
              <div className="flight-list">
                {results.map((flight) => <FlightOption key={flight.id} flight={flight} onChoose={openBooking} />)}
                {!results.length && <div className="empty-state"><Plane /><h3>Sin vuelos disponibles</h3><p>Cambia la ruta o la fecha para continuar.</p></div>}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="bookings">
            <section className="results-panel" aria-labelledby="bookings-title">
              <div className="results-heading"><div><span className="eyebrow">HISTORIAL LOCAL</span><h2 id="bookings-title">Mis reservas</h2></div></div>
              <div className="booking-list">
                {bookings.map((booking) => (
                  <article className="booking-card" key={booking.code}>
                    <div><span className="eyebrow">CÓDIGO DE RESERVA</span><strong className="booking-code">{booking.code}</strong></div>
                    <div className="booking-route"><strong>{booking.flight.origin} <ArrowRight /> {booking.flight.destination}</strong><span>{booking.flight.number} - {booking.flight.departure}</span></div>
                    <div><span className="eyebrow">PASAJERO</span><strong>{booking.passenger.name}</strong></div>
                    <div className="booking-total"><span className="eyebrow">TOTAL</span><strong>{formatCurrency(booking.total)}</strong></div>
                    <Badge className={booking.status === 'CONFIRMED' ? 'available-badge' : 'cancelled-badge'}>{booking.status === 'CONFIRMED' ? 'CONFIRMADA' : 'CANCELADA'}</Badge>
                    {booking.status === 'CONFIRMED' && <Button variant="outline" className="cancel-button" onClick={() => cancelBooking(booking.code)}><Trash2 /> Cancelar</Button>}
                  </article>
                ))}
                {!bookings.length && <div className="empty-state"><TicketCheck /><h3>Aún no tienes reservas</h3><p>Elige un vuelo y completa los datos del pasajero.</p></div>}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedFlight)} onOpenChange={(open) => !open && setSelectedFlight(null)}>
        <DialogContent className="booking-dialog">
          <DialogHeader>
            <span className="eyebrow coral">CONFIRMAR VUELO</span>
            <DialogTitle>Datos del pasajero</DialogTitle>
            <DialogDescription>{selectedFlight ? `${selectedFlight.number} - ${selectedFlight.origin} a ${selectedFlight.destination}, ${selectedFlight.departure}` : ''}</DialogDescription>
          </DialogHeader>
          <form id="booking-form" className="passenger-form" onSubmit={confirmBooking}>
            <div className="field-group"><Label htmlFor="passenger-name">Nombre completo</Label><Input id="passenger-name" value={passengerName} onChange={(event) => setPassengerName(event.target.value)} autoComplete="name" /></div>
            <div className="field-group"><Label htmlFor="passenger-email">Correo electrónico</Label><Input id="passenger-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div>
            <div className="field-group"><Label htmlFor="passenger-document">DNI o pasaporte</Label><Input id="passenger-document" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} /></div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="fare-summary"><span><Clock3 /> Tarifa para {passengers} {passengers === 1 ? 'pasajero' : 'pasajeros'}</span><strong>{selectedFlight ? formatCurrency(selectedFlight.price * passengers) : ''}</strong></div>
          </form>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setSelectedFlight(null)}>Volver</Button>
            <Button className="search-button" type="submit" form="booking-form">Confirmar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer>Prototipo educativo independiente inspirado en el sistema visual LATAM Cargo OpsCom. No procesa pagos ni emite pasajes reales.</footer>
    </main>
  );
}
