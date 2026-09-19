import { DatabaseMetadata } from '../types';
import {
  getStoredDrivers,
  getStoredPassengers,
  getStoredTrips,
  getStoredDailyLists,
  getStoredFinancialConfig,
  getStoredDestinationPrices,
  getStoredExpenses,
  getStoredTripClosings,
  getStoredCompanyConfig,
  saveDrivers,
  savePassengers,
  saveTrips,
  saveDestinationPrices,
  saveFinancialConfig,
  saveCompanyConfig,
  saveExpenses,
  DEFAULT_DESTINATION_PRICES,
  DEFAULT_FINANCIAL_CONFIG,
  DEFAULT_COMPANY_CONFIG,
} from './storage';

const DB_METADATA_KEY = 'sys_database_metadata_v1';
const DB_VERSION = '2.5.0';

/**
 * Cria ou inicializa o banco de dados local no momento da instalação / primeira execução
 */
export function initializeLocalDatabase(): {
  isFirstInstall: boolean;
  metadata: DatabaseMetadata;
  message: string;
} {
  try {
    const existingRaw = localStorage.getItem(DB_METADATA_KEY);
    const isFirstInstall = !existingRaw;

    let metadata: DatabaseMetadata;

    if (isFirstInstall) {
      // Cria ID único para esta instância de banco de dados
      const dbRandom = Math.floor(100000 + Math.random() * 900000);
      const dbId = `DB-OSNIR-${new Date().getFullYear()}-${dbRandom}`;

      // Garante que todas as tabelas/coleções padrão existem no banco
      const existingDrivers = getStoredDrivers();
      if (existingDrivers.length === 0) {
        saveDrivers([]);
      }

      const existingPassengers = getStoredPassengers();
      if (existingPassengers.length === 0) {
        savePassengers([]);
      }

      const existingTrips = getStoredTrips();
      if (existingTrips.length === 0) {
        saveTrips([]);
      }

      const existingPrices = getStoredDestinationPrices();
      if (Object.keys(existingPrices).length === 0) {
        saveDestinationPrices(DEFAULT_DESTINATION_PRICES);
      }

      const existingFinConfig = getStoredFinancialConfig();
      if (!existingFinConfig) {
        saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
      }

      const existingExpenses = getStoredExpenses();
      if (existingExpenses.length === 0) {
        saveExpenses([]);
      }

      metadata = {
        databaseId: dbId,
        version: DB_VERSION,
        initializedAt: new Date().toISOString(),
        totalRecordsCount:
          existingDrivers.length + existingPassengers.length + existingTrips.length + existingExpenses.length,
        engine: 'IndexedDB/LocalStorage',
        storageStatus: 'healthy',
      };

      localStorage.setItem(DB_METADATA_KEY, JSON.stringify(metadata));
      return {
        isFirstInstall: true,
        metadata,
        message: 'Banco de dados local criado e inicializado com sucesso!',
      };
    } else {
      metadata = JSON.parse(existingRaw);
      // Atualiza contagem de registros
      metadata.totalRecordsCount =
        getStoredDrivers().length +
        getStoredPassengers().length +
        getStoredTrips().length +
        getStoredExpenses().length;
      metadata.storageStatus = 'healthy';
      localStorage.setItem(DB_METADATA_KEY, JSON.stringify(metadata));

      return {
        isFirstInstall: false,
        metadata,
        message: 'Banco de dados local carregado normalmente.',
      };
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados local', error);
    const fallbackMeta: DatabaseMetadata = {
      databaseId: 'DB-FALLBACK',
      version: DB_VERSION,
      initializedAt: new Date().toISOString(),
      totalRecordsCount: 0,
      engine: 'IndexedDB/LocalStorage',
      storageStatus: 'warning',
    };
    return {
      isFirstInstall: false,
      metadata: fallbackMeta,
      message: 'Aviso: Inicialização em modo de contingência.',
    };
  }
}

/**
 * Retorna as estatísticas detalhadas de uso e integridade do banco de dados local
 */
export function getDatabaseStatistics() {
  const drivers = getStoredDrivers();
  const passengers = getStoredPassengers();
  const trips = getStoredTrips();
  const expenses = getStoredExpenses();
  const destinationPrices = getStoredDestinationPrices();
  const tripClosings = getStoredTripClosings();
  const company = getStoredCompanyConfig();

  let approxBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        approxBytes += (key.length + val.length) * 2; // UTF-16
      }
    }
  } catch {
    approxBytes = 102400; // 100KB fallback
  }

  const rawMeta = localStorage.getItem(DB_METADATA_KEY);
  const metadata: DatabaseMetadata = rawMeta
    ? JSON.parse(rawMeta)
    : {
        databaseId: 'DB-OSNIR-LOCAL',
        version: DB_VERSION,
        initializedAt: new Date().toISOString(),
        totalRecordsCount: drivers.length + passengers.length + trips.length + expenses.length,
        engine: 'IndexedDB/LocalStorage',
        storageStatus: 'healthy',
      };

  return {
    metadata,
    counts: {
      drivers: drivers.length,
      passengers: passengers.length,
      trips: trips.length,
      expenses: expenses.length,
      destinations: Object.keys(destinationPrices).length,
      tripClosings: Object.keys(tripClosings).length,
      totalRecords: drivers.length + passengers.length + trips.length + expenses.length,
    },
    companyName: company.companyName,
    storageSizeKb: Math.round(approxBytes / 1024),
    storageSizeFormatted:
      approxBytes < 1024 * 1024
        ? `${(approxBytes / 1024).toFixed(1)} KB`
        : `${(approxBytes / (1024 * 1024)).toFixed(2)} MB`,
  };
}

/**
 * Exporta um arquivo completo de Backup do Banco de Dados (.json)
 */
export function exportDatabaseBackupFile(): void {
  const stats = getDatabaseStatistics();
  const backupPayload = {
    schema: 'OSNIR_TURISMO_DATABASE_BACKUP',
    version: DB_VERSION,
    databaseId: stats.metadata.databaseId,
    exportedAt: new Date().toISOString(),
    company: getStoredCompanyConfig(),
    drivers: getStoredDrivers(),
    passengers: getStoredPassengers(),
    trips: getStoredTrips(),
    dailyLists: getStoredDailyLists(),
    expenses: getStoredExpenses(),
    destinationPrices: getStoredDestinationPrices(),
    financialConfig: getStoredFinancialConfig(),
    tripClosings: getStoredTripClosings(),
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `backup_banco_dados_osnir_${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  // Atualiza timestamp do último backup nos metadados
  try {
    const raw = localStorage.getItem(DB_METADATA_KEY);
    if (raw) {
      const meta = JSON.parse(raw);
      meta.lastBackupAt = new Date().toISOString();
      localStorage.setItem(DB_METADATA_KEY, JSON.stringify(meta));
    }
  } catch {
    // ignore
  }
}

/**
 * Restaura o banco de dados a partir de um arquivo de backup (.json)
 */
export function restoreDatabaseFromFile(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.drivers && !data.passengers && !data.trips) {
      return { success: false, message: 'Arquivo de backup inválido ou incompatível.' };
    }

    if (Array.isArray(data.drivers)) saveDrivers(data.drivers);
    if (Array.isArray(data.passengers)) savePassengers(data.passengers);
    if (Array.isArray(data.trips)) saveTrips(data.trips);
    if (Array.isArray(data.expenses)) saveExpenses(data.expenses);
    if (data.destinationPrices && typeof data.destinationPrices === 'object') {
      saveDestinationPrices(data.destinationPrices);
    }
    if (data.financialConfig && typeof data.financialConfig === 'object') {
      saveFinancialConfig(data.financialConfig);
    }
    if (data.company && typeof data.company === 'object') {
      saveCompanyConfig(data.company);
    }

    // Atualiza metadados do banco restaurado
    const stats = getDatabaseStatistics();
    const updatedMeta: DatabaseMetadata = {
      databaseId: data.databaseId || `DB-RESTORED-${Date.now()}`,
      version: DB_VERSION,
      initializedAt: data.exportedAt || new Date().toISOString(),
      lastBackupAt: new Date().toISOString(),
      totalRecordsCount: stats.counts.totalRecords,
      engine: 'IndexedDB/LocalStorage',
      storageStatus: 'healthy',
    };
    localStorage.setItem(DB_METADATA_KEY, JSON.stringify(updatedMeta));

    return {
      success: true,
      message: `Banco de dados restaurado com sucesso! (${stats.counts.passengers} passageiros, ${stats.counts.trips} viagens e ${stats.counts.drivers} motoristas carregados)`,
    };
  } catch (error) {
    console.error('Erro ao restaurar banco de dados', error);
    return { success: false, message: 'Falha ao processar arquivo JSON de backup.' };
  }
}
