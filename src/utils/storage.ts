import {
  Driver,
  Passenger,
  Trip,
  FinancialConfig,
  SellerCommissionConfig,
  CompanyConfig,
  Expense,
  DriverCommissionConfig,
  TripClosing,
} from '../types';

const DRIVERS_STORAGE_KEY = 'transporte_motoristas_v2';
const PASSENGERS_STORAGE_KEY = 'transporte_passageiros_v2';
const TRIPS_STORAGE_KEY = 'transporte_viagens_v2';
const DAILY_LISTS_STORAGE_KEY = 'transporte_lista_do_dia_v1';
const FINANCIAL_CONFIG_KEY = 'transporte_config_financeira_v1';
const SELLER_COMMISSIONS_KEY = 'transporte_comissoes_vendedores_v1';
const DRIVER_COMMISSIONS_KEY = 'transporte_comissoes_motoristas_v1';
const DESTINATION_PRICES_KEY = 'transporte_precos_destinos_v1';
const EXPENSES_STORAGE_KEY = 'transporte_despesas_v1';
const TRIP_CLOSINGS_KEY = 'transporte_fechamento_viagens_v1';
const COMPANY_CONFIG_KEY = 'transporte_config_empresa_v1';

export const DEFAULT_DESTINATION_PRICES: Record<string, number> = {
  'SÃO PAULO - SP → RIO DE JANEIRO - RJ': 180,
  'SÃO PAULO - SP → SANTOS - SP': 90,
  'SÃO PAULO - SP → CAMPINAS - SP': 100,
  'SÃO PAULO - SP → CURITIBA - PR': 220,
  'SÃO PAULO - SP → BELO HORIZONTE - MG': 240,
  'SÃO PAULO - SP': 120,
  'RIO DE JANEIRO - RJ': 180,
  'SANTOS - SP': 90,
  'CAMPINAS - SP': 100,
  'CURITIBA - PR': 220,
  'BELO HORIZONTE - MG': 240,
};

export function normalizeDestination(dest: string): string {
  if (!dest) return '';
  return dest.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function getStoredDestinationPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DESTINATION_PRICES_KEY);
    if (!raw) {
      localStorage.setItem(DESTINATION_PRICES_KEY, JSON.stringify(DEFAULT_DESTINATION_PRICES));
      return { ...DEFAULT_DESTINATION_PRICES };
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler preços por destino', error);
    return { ...DEFAULT_DESTINATION_PRICES };
  }
}

export function saveDestinationPrices(prices: Record<string, number>): void {
  try {
    localStorage.setItem(DESTINATION_PRICES_KEY, JSON.stringify(prices));
  } catch (error) {
    console.error('Erro ao salvar preços por destino', error);
  }
}

/**
 * Returns the ticket price for a given destination and optional origin.
 * Checks normalized route (origin → destination) first;
 * then destination against destinationPrices dictionary;
 * if not found or invalid, returns fallbackPrice or default 120.
 */
export function getTicketPriceForDestination(
  destination: string,
  destinationPrices?: Record<string, number>,
  fallbackPrice: number = 120,
  origin?: string
): number {
  if (!destination) return fallbackPrice;
  const normalizedDest = normalizeDestination(destination);
  const normalizedOrig = origin ? normalizeDestination(origin) : '';
  const prices = destinationPrices || getStoredDestinationPrices();
  if (!prices) return fallbackPrice;

  // 1. If origin is provided, look for specific route: "ORIGIN → DESTINATION"
  if (normalizedOrig) {
    const routeKey1 = `${normalizedOrig} → ${normalizedDest}`;
    if (typeof prices[routeKey1] === 'number' && prices[routeKey1] > 0) {
      return prices[routeKey1];
    }
    const routeKey2 = `${normalizedOrig} -> ${normalizedDest}`;
    if (typeof prices[routeKey2] === 'number' && prices[routeKey2] > 0) {
      return prices[routeKey2];
    }

    // Try finding in keys with arrow
    for (const [key, val] of Object.entries(prices)) {
      if (typeof val === 'number' && val > 0 && (key.includes('→') || key.includes('->'))) {
        const separator = key.includes('→') ? '→' : '->';
        const parts = key.split(separator).map((s) => normalizeDestination(s));
        if (parts.length === 2 && parts[0] === normalizedOrig && parts[1] === normalizedDest) {
          return val;
        }
      }
    }
  }

  // 2. Direct match on destination alone
  if (typeof prices[normalizedDest] === 'number' && prices[normalizedDest] > 0) {
    return prices[normalizedDest];
  }

  // 3. Normalized direct key match
  const directKey = Object.keys(prices).find(
    (k) => !k.includes('→') && !k.includes('->') && normalizeDestination(k) === normalizedDest
  );
  if (directKey && typeof prices[directKey] === 'number' && prices[directKey] > 0) {
    return prices[directKey];
  }

  // 4. Any route matching this destination if no specific origin was found
  for (const [key, val] of Object.entries(prices)) {
    if (typeof val === 'number' && val > 0 && (key.includes('→') || key.includes('->'))) {
      const separator = key.includes('→') ? '→' : '->';
      const parts = key.split(separator).map((s) => normalizeDestination(s));
      if (parts.length === 2 && parts[1] === normalizedDest) {
        return val;
      }
    }
  }

  return fallbackPrice;
}

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  companyName: 'Osnir Turismo',
  logoUrl: '',
  primaryColor: '#065f46', // Emerald 800
  secondaryColor: '#047857', // Emerald 700
  accentColor: '#10b981', // Emerald 500
  phone: '',
  cnpjOrCpf: '',
};

export function getStoredCompanyConfig(): CompanyConfig {
  try {
    const raw = localStorage.getItem(COMPANY_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(COMPANY_CONFIG_KEY, JSON.stringify(DEFAULT_COMPANY_CONFIG));
      return DEFAULT_COMPANY_CONFIG;
    }
    return { ...DEFAULT_COMPANY_CONFIG, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Erro ao ler dados da empresa', error);
    return DEFAULT_COMPANY_CONFIG;
  }
}

export function saveCompanyConfig(config: CompanyConfig): void {
  try {
    localStorage.setItem(COMPANY_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Erro ao salvar dados da empresa', error);
  }
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  ticketPrice: 120, // R$ 120,00 por passagem por padrão
  driverTripPrice: 350, // R$ 350,00 por viagem realizada por padrão
  defaultCommissionPercent: 10, // 10% de comissão padrão para vendedores
};

export function getStoredFinancialConfig(): FinancialConfig {
  try {
    const raw = localStorage.getItem(FINANCIAL_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(FINANCIAL_CONFIG_KEY, JSON.stringify(DEFAULT_FINANCIAL_CONFIG));
      return DEFAULT_FINANCIAL_CONFIG;
    }
    return { ...DEFAULT_FINANCIAL_CONFIG, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Erro ao ler configurações financeiras', error);
    return DEFAULT_FINANCIAL_CONFIG;
  }
}

export function saveFinancialConfig(config: FinancialConfig): void {
  try {
    localStorage.setItem(FINANCIAL_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Erro ao salvar configurações financeiras', error);
  }
}

export function getStoredSellerCommissions(): SellerCommissionConfig {
  try {
    const raw = localStorage.getItem(SELLER_COMMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(SELLER_COMMISSIONS_KEY, JSON.stringify({}));
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler comissões dos vendedores', error);
    return {};
  }
}

export function saveSellerCommissions(commissions: SellerCommissionConfig): void {
  try {
    localStorage.setItem(SELLER_COMMISSIONS_KEY, JSON.stringify(commissions));
  } catch (error) {
    console.error('Erro ao salvar comissões dos vendedores', error);
  }
}

export function getStoredDriverCommissions(): DriverCommissionConfig {
  try {
    const raw = localStorage.getItem(DRIVER_COMMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(DRIVER_COMMISSIONS_KEY, JSON.stringify({}));
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler comissões de motoristas', error);
    return {};
  }
}

export function saveDriverCommissions(commissions: DriverCommissionConfig): void {
  try {
    localStorage.setItem(DRIVER_COMMISSIONS_KEY, JSON.stringify(commissions));
  } catch (error) {
    console.error('Erro ao salvar comissões de motoristas', error);
  }
}

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler despesas do localStorage', error);
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Erro ao salvar despesas', error);
  }
}

export function getStoredTripClosings(): Record<string, TripClosing> {
  try {
    const raw = localStorage.getItem(TRIP_CLOSINGS_KEY);
    if (!raw) {
      localStorage.setItem(TRIP_CLOSINGS_KEY, JSON.stringify({}));
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler fechamentos de viagens do localStorage', error);
    return {};
  }
}

export function saveTripClosings(closings: Record<string, TripClosing>): void {
  try {
    localStorage.setItem(TRIP_CLOSINGS_KEY, JSON.stringify(closings));
  } catch (error) {
    console.error('Erro ao salvar fechamentos de viagens', error);
  }
}

export function calculateDriverTripPayout(
  trip: Trip,
  passengers: Passenger[],
  destinationPrices: Record<string, number>,
  financialConfig: FinancialConfig,
  driverCommissions: DriverCommissionConfig = {},
  tripClosing?: TripClosing
): number {
  if (tripClosing?.overrideDriverPayout !== undefined && tripClosing.overrideDriverPayout >= 0) {
    return tripClosing.overrideDriverPayout;
  }

  const customRate = trip.driverId ? driverCommissions[trip.driverId] : undefined;
  if (customRate) {
    if (customRate.type === 'fixed') {
      return customRate.value;
    } else if (customRate.type === 'percent') {
      const tripPassengers = passengers.filter((p) => trip.passengerIds.includes(p.id));
      const tripRevenue = tripPassengers.reduce((sum, p) => {
        return sum + getTicketPriceForDestination(p.destination, destinationPrices, financialConfig.ticketPrice, p.origin);
      }, 0);
      return (tripRevenue * customRate.value) / 100;
    }
  }

  if (financialConfig.driverPaymentType === 'percent' && financialConfig.driverCommissionPercent) {
    const tripPassengers = passengers.filter((p) => trip.passengerIds.includes(p.id));
    const tripRevenue = tripPassengers.reduce((sum, p) => {
      return sum + getTicketPriceForDestination(p.destination, destinationPrices, financialConfig.ticketPrice, p.origin);
    }, 0);
    return (tripRevenue * financialConfig.driverCommissionPercent) / 100;
  }

  return financialConfig.driverTripPrice || 0;
}

export function getStoredDrivers(): Driver[] {
  try {
    const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler motoristas do localStorage', error);
    return [];
  }
}

export function saveDrivers(drivers: Driver[]): void {
  try {
    localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
  } catch (error) {
    console.error('Erro ao salvar motoristas', error);
  }
}

export function getStoredPassengers(): Passenger[] {
  try {
    const raw = localStorage.getItem(PASSENGERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PASSENGERS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler passageiros do localStorage', error);
    return [];
  }
}

export function savePassengers(passengers: Passenger[]): void {
  try {
    localStorage.setItem(PASSENGERS_STORAGE_KEY, JSON.stringify(passengers));
  } catch (error) {
    console.error('Erro ao salvar passageiros', error);
  }
}

export function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler viagens do localStorage', error);
    return [];
  }
}

export function saveTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error('Erro ao salvar viagens', error);
  }
}

export function getStoredDailyLists(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(DAILY_LISTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DAILY_LISTS_STORAGE_KEY, JSON.stringify({}));
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler lista do dia do localStorage', error);
    return {};
  }
}

export function saveDailyLists(lists: Record<string, string[]>): void {
  try {
    localStorage.setItem(DAILY_LISTS_STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Erro ao salvar lista do dia', error);
  }
}

export function getStoredDailyPassengerIds(date: string): string[] {
  const lists = getStoredDailyLists();
  return lists[date] || [];
}

export function saveDailyPassengerIds(date: string, passengerIds: string[]): void {
  const lists = getStoredDailyLists();
  lists[date] = passengerIds;
  saveDailyLists(lists);
}

export function getAllDataExport() {
  const companyConfig = getStoredCompanyConfig();
  return {
    appName: `${companyConfig.companyName} - Transporte de Passageiros`,
    version: '2.5',
    exportDate: new Date().toISOString(),
    companyConfig,
    drivers: getStoredDrivers(),
    passengers: getStoredPassengers(),
    trips: getStoredTrips(),
    dailyLists: getStoredDailyLists(),
    financialConfig: getStoredFinancialConfig(),
    destinationPrices: getStoredDestinationPrices(),
    sellerCommissions: getStoredSellerCommissions(),
    driverCommissions: getStoredDriverCommissions(),
    expenses: getStoredExpenses(),
    tripClosings: getStoredTripClosings(),
  };
}

export function clearAllData(includeFinancial: boolean = false): void {
  try {
    localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PASSENGERS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(DAILY_LISTS_STORAGE_KEY, JSON.stringify({}));
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(TRIP_CLOSINGS_KEY, JSON.stringify({}));
    if (includeFinancial) {
      localStorage.setItem(FINANCIAL_CONFIG_KEY, JSON.stringify(DEFAULT_FINANCIAL_CONFIG));
      localStorage.setItem(DESTINATION_PRICES_KEY, JSON.stringify(DEFAULT_DESTINATION_PRICES));
      localStorage.setItem(SELLER_COMMISSIONS_KEY, JSON.stringify({}));
      localStorage.setItem(DRIVER_COMMISSIONS_KEY, JSON.stringify({}));
    }
    // Also clear legacy keys if any
    localStorage.removeItem('transporte_motoristas_v1');
    localStorage.removeItem('transporte_passageiros_v1');
  } catch (error) {
    console.error('Erro ao zerar dados', error);
  }
}
