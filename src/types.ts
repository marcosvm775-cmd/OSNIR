export interface Driver {
  id: string;
  fullName: string;
  phone?: string;
  createdAt: string;
}

export interface Passenger {
  id: string;
  fullName: string;
  origin: string;
  destination: string;
  seller: string;
  driverId: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  driverId: string;
  passengerIds: string[];
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId?: string; // vinculada a uma viagem específica (opcional) ou despesa geral/operacional
  description: string;
  category: 'combustivel' | 'pedagio' | 'alimentacao' | 'manutencao' | 'hospedagem' | 'diaria' | 'outro';
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface DriverRateConfig {
  type: 'fixed' | 'percent'; // 'fixed' = R$ por viagem | 'percent' = % da receita bruta da viagem
  value: number;
}

export interface DriverCommissionConfig {
  [driverId: string]: DriverRateConfig;
}

export interface TripClosing {
  tripId: string;
  status: 'open' | 'closed' | 'settled'; // Aberta, Fechada, Liquidada
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  overrideDriverPayout?: number;
}

export interface FinancialConfig {
  ticketPrice: number; // Valor padrão/fallback da passagem em R$ quando o destino não tiver valor específico
  driverTripPrice: number; // Valor padrão repassado por viagem ao motorista em R$
  driverPaymentType?: 'fixed' | 'percent'; // Tipo de remuneração padrão do motorista (fixo por viagem ou % das passagens)
  driverCommissionPercent?: number; // Porcentagem padrão de comissão para motoristas (%) caso seja percentual
  defaultCommissionPercent: number; // Porcentagem padrão de comissão para vendedores (%)
  destinationPrices?: Record<string, number>; // Tabela de preços específicos por destino (ex: { "RIO DE JANEIRO - RJ": 180 })
}

export interface DestinationPriceItem {
  destination: string;
  price: number;
  notes?: string;
}

export interface SellerCommissionConfig {
  [sellerName: string]: number; // Porcentagem específica (%) para cada vendedor
}

export interface CompanyConfig {
  companyName: string;
  logoUrl: string; // Base64 data URL ou URL da imagem
  primaryColor: string; // Cor primária (Hex, ex: #065f46)
  secondaryColor: string; // Cor secundária (Hex, ex: #047857)
  accentColor?: string; // Cor de destaque (Hex, ex: #10b981)
  phone?: string;
  cnpjOrCpf?: string;
}

export interface LicenseActivation {
  machineId: string;
  machineName?: string;
  slotNumber: 1 | 2 | 3;
  activatedAt: string;
}

export interface ProductLicense {
  productKey: string;
  licenseeName: string;
  maxInstallations: number; // 3 instalações
  currentSlot: 1 | 2 | 3;
  machineId: string;
  activatedAt: string;
  expiresAt: string | null; // null para vitalícia
  planType: 'lifetime' | 'annual' | 'trial';
  signature: string;
  activationsLog?: LicenseActivation[];
}

export interface DatabaseMetadata {
  databaseId: string;
  version: string;
  initializedAt: string;
  lastBackupAt?: string;
  totalRecordsCount: number;
  engine: 'IndexedDB/LocalStorage' | 'SQLite/Tauri';
  storageStatus: 'healthy' | 'warning';
}

export type ActiveTab =
  | 'passengers'
  | 'daily-list'
  | 'trips'
  | 'closing'
  | 'pricing'
  | 'drivers'
  | 'reports'
  | 'settings'
  | 'new-passenger';

