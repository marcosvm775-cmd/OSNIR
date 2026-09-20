import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredDrivers,
  saveDrivers,
  getStoredPassengers,
  savePassengers,
  getStoredTrips,
  saveTrips,
  getStoredDailyLists,
  saveDailyLists,
  clearAllData,
  getStoredFinancialConfig,
  getStoredCompanyConfig,
  saveCompanyConfig,
} from './utils/storage';
import { Driver, Passenger, Trip, ActiveTab, CompanyConfig } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PassengerForm } from './components/PassengerForm';
import { PassengerCard } from './components/PassengerCard';
import { PassengerRow } from './components/PassengerRow';
import { DriverModal } from './components/DriverModal';
import { DriverList } from './components/DriverList';
import { DriverManifestModal } from './components/DriverManifestModal';
import { DriverAllocationModal } from './components/DriverAllocationModal';
import { SellerReport } from './components/SellerReport';
import { ReportsManager } from './components/ReportsManager';
import { TripManager } from './components/TripManager';
import { DailyListManager } from './components/DailyListManager';
import { PricingManager } from './components/PricingManager';
import { TripClosingManager } from './components/TripClosingManager';
import { SettingsManager } from './components/SettingsManager';
import { LicenseModal } from './components/LicenseModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { initializeLocalDatabase } from './utils/database';
import { isProductActivated } from './utils/license';
import { generateGeneralPassengersListPdf } from './utils/pdfGenerator';
import {
  Search,
  Filter,
  UserCheck,
  Users,
  PlusCircle,
  AlertCircle,
  FileDown,
  Tag,
  Compass,
  CalendarDays,
  List,
  LayoutGrid,
} from 'lucide-react';

export default function App() {
  // Helper to get today's date in local YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dailyLists, setDailyLists] = useState<Record<string, string[]>>({});
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(getStoredCompanyConfig);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(getTodayDateString);
  const [activeTab, setActiveTab] = useState<ActiveTab>('passengers');
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [manifestDriver, setManifestDriver] = useState<Driver | null>(null);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [allocatingPassenger, setAllocatingPassenger] = useState<Passenger | null>(null);

  // View mode for general passenger list: 'list' (single-line default) or 'grid' (cards)
  const [passengerViewMode, setPassengerViewMode] = useState<'list' | 'grid'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // License & Database Modal States
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isLicenseModalDirectToGenerator, setIsLicenseModalDirectToGenerator] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isLicenseActive, setIsLicenseActive] = useState<boolean>(() => isProductActivated());

  const handleOpenLicenseModal = (directToGenerator: boolean = false) => {
    setIsLicenseModalDirectToGenerator(directToGenerator);
    setIsLicenseModalOpen(true);
  };

  // Function to reload state from storage (used on database restore)
  const reloadAllData = () => {
    setDrivers(getStoredDrivers());
    setPassengers(getStoredPassengers());
    setTrips(getStoredTrips());
    setDailyLists(getStoredDailyLists());
    setCompanyConfig(getStoredCompanyConfig());
  };

  // Load initial data and initialize local database on installation
  useEffect(() => {
    const dbInit = initializeLocalDatabase();
    if (dbInit.isFirstInstall) {
      showToast('Banco de dados local criado e inicializado nesta máquina!');
    }

    reloadAllData();
    setIsLicenseActive(isProductActivated());
  }, []);

  const handleSaveCompanyConfig = (newConfig: CompanyConfig) => {
    setCompanyConfig(newConfig);
    saveCompanyConfig(newConfig);
    showToast('Configurações da empresa salvas com sucesso!');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Save changes to drivers
  const handleSaveDriver = (newDriver: Driver) => {
    const updated = [newDriver, ...drivers];
    setDrivers(updated);
    saveDrivers(updated);
    showToast(`Motorista "${newDriver.fullName}" cadastrado com sucesso!`);
  };

  const handleDeleteDriver = (driverId: string) => {
    const updatedDrivers = drivers.filter((d) => d.id !== driverId);
    setDrivers(updatedDrivers);
    saveDrivers(updatedDrivers);

    // If any passenger was assigned to this driver, they are ONLY unallocated, NEVER deleted from general list!
    const updatedPassengers = passengers.map((p) =>
      p.driverId === driverId ? { ...p, driverId: '' } : p
    );
    setPassengers(updatedPassengers);
    savePassengers(updatedPassengers);

    // Also update any trips referencing this driver
    const updatedTrips = trips.map((t) =>
      t.driverId === driverId ? { ...t, driverId: '' } : t
    );
    setTrips(updatedTrips);
    saveTrips(updatedTrips);

    showToast('Motorista removido. Seus passageiros permanecem salvos na Lista Geral.');
  };

  // Clear passengers assigned to a specific driver
  // CRITICAL: They are ONLY unlinked from the driver (driverId: '').
  // They are NEVER deleted from the general list and existing trips remain 100% intact!
  const handleClearDriverPassengers = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    const affectedCount = passengers.filter((p) => p.driverId === driverId).length;

    const updatedPassengers = passengers.map((p) =>
      p.driverId === driverId ? { ...p, driverId: '' } : p
    );

    setPassengers(updatedPassengers);
    savePassengers(updatedPassengers);

    const driverName = driver ? driver.fullName : 'do motorista';
    showToast(`${affectedCount} passageiro(s) desvinculado(s) de "${driverName}". Permanecem na Lista Geral e no histórico de Viagens.`);
  };

  // Save changes to trips
  const handleSaveTrip = (tripData: Trip) => {
    const exists = trips.some((t) => t.id === tripData.id);
    let updated: Trip[];
    if (exists) {
      updated = trips.map((t) => (t.id === tripData.id ? tripData : t));
      showToast('Viagem atualizada com sucesso!');
    } else {
      updated = [tripData, ...trips];
      showToast('Viagem programada com sucesso!');
    }
    setTrips(updated);
    saveTrips(updated);
  };

  const handleDeleteTrip = (tripId: string) => {
    const updated = trips.filter((t) => t.id !== tripId);
    setTrips(updated);
    saveTrips(updated);
    showToast('Viagem excluída.');
  };

  // Save changes to passengers
  const handleSavePassenger = (passengerData: Passenger) => {
    const exists = passengers.some((p) => p.id === passengerData.id);
    let updated: Passenger[];
    if (exists) {
      updated = passengers.map((p) => (p.id === passengerData.id ? passengerData : p));
      showToast('Passageiro atualizado com sucesso!');
    } else {
      updated = [passengerData, ...passengers];
      showToast('Passageiro cadastrado na Lista Geral!');
    }
    setPassengers(updated);
    savePassengers(updated);
    setEditingPassenger(null);
    setActiveTab('passengers');
  };

  // Direct driver allocation or removal from driver
  // CRITICAL: Unallocating a driver NEVER deletes the passenger from the general list!
  const handleAllocateDriver = (passengerId: string, driverId: string) => {
    const targetPassenger = passengers.find((p) => p.id === passengerId);
    const targetDriver = drivers.find((d) => d.id === driverId);

    const updated = passengers.map((p) =>
      p.id === passengerId ? { ...p, driverId } : p
    );

    setPassengers(updated);
    savePassengers(updated);

    if (targetDriver && targetPassenger) {
      showToast(`Passageiro "${targetPassenger.fullName}" destinado ao motorista "${targetDriver.fullName}"!`);
    } else if (targetPassenger) {
      showToast(`Passageiro "${targetPassenger.fullName}" retirado do motorista (mantido na Lista Geral).`);
    }
  };

  // Update passenger destination directly from the General List
  const handleUpdateDestination = (passengerId: string, newDestination: string) => {
    const target = passengers.find((p) => p.id === passengerId);
    if (!target) return;

    const updated = passengers.map((p) =>
      p.id === passengerId ? { ...p, destination: newDestination } : p
    );

    setPassengers(updated);
    savePassengers(updated);
    showToast(`Destino de "${target.fullName}" alterado para "${newDestination}" com sucesso!`);
  };

  // Update passenger origin directly from the General List
  const handleUpdateOrigin = (passengerId: string, newOrigin: string) => {
    const target = passengers.find((p) => p.id === passengerId);
    if (!target) return;

    const updated = passengers.map((p) =>
      p.id === passengerId ? { ...p, origin: newOrigin } : p
    );

    setPassengers(updated);
    savePassengers(updated);
    showToast(`Origem de "${target.fullName}" alterada para "${newOrigin}" com sucesso!`);
  };

  // Delete passenger explicitly requested by the user
  const handleDeletePassenger = (passengerId: string) => {
    const updated = passengers.filter((p) => p.id !== passengerId);
    setPassengers(updated);
    savePassengers(updated);

    // Also remove from trips passengerIds
    const updatedTrips = trips.map((t) => ({
      ...t,
      passengerIds: t.passengerIds.filter((id) => id !== passengerId),
    }));
    setTrips(updatedTrips);
    saveTrips(updatedTrips);

    // Also remove from daily lists
    const updatedDailyLists: Record<string, string[]> = {};
    Object.keys(dailyLists).forEach((d) => {
      updatedDailyLists[d] = dailyLists[d].filter((id) => id !== passengerId);
    });
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);

    showToast('Passageiro excluído da Lista Geral.');
  };

  // Update passenger seller
  const handleUpdatePassengerSeller = (passengerId: string, newSeller: string) => {
    const trimmed = newSeller.trim().toUpperCase();
    if (!trimmed) return;
    const target = passengers.find((p) => p.id === passengerId);
    if (!target) return;

    const updated = passengers.map((p) =>
      p.id === passengerId ? { ...p, seller: trimmed } : p
    );

    setPassengers(updated);
    savePassengers(updated);
    showToast(`Vendedor de "${target.fullName}" alterado para "${trimmed}" com sucesso!`);
  };

  // Daily List Handlers
  const currentDailyPassengerIds = useMemo(() => {
    return dailyLists[selectedDailyDate] || [];
  }, [dailyLists, selectedDailyDate]);

  const handleAddPassengerToDaily = (passengerId: string, customSeller?: string) => {
    let targetPassenger = passengers.find((p) => p.id === passengerId);
    if (customSeller && customSeller.trim() && targetPassenger) {
      const trimmedSeller = customSeller.trim().toUpperCase();
      if (targetPassenger.seller !== trimmedSeller) {
        const updated = passengers.map((p) =>
          p.id === passengerId ? { ...p, seller: trimmedSeller } : p
        );
        setPassengers(updated);
        savePassengers(updated);
        targetPassenger = { ...targetPassenger, seller: trimmedSeller };
      }
    }

    const currentIds = dailyLists[selectedDailyDate] || [];
    if (currentIds.includes(passengerId)) {
      showToast(`Este cliente já está na Lista do Dia.${customSeller && customSeller.trim() ? ` Vendedor atualizado para "${customSeller.trim().toUpperCase()}".` : ''}`);
      return;
    }
    const updatedList = [...currentIds, passengerId];
    const updatedDailyLists = {
      ...dailyLists,
      [selectedDailyDate]: updatedList,
    };
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);

    const name = targetPassenger ? `"${targetPassenger.fullName}"` : 'Cliente';
    const sellerInfo = customSeller && customSeller.trim() ? ` (Vendedor: ${customSeller.trim().toUpperCase()})` : '';
    showToast(`${name} puxado para a Lista do Dia com sucesso!${sellerInfo}`);
  };

  const handleAddMultiplePassengersToDaily = (newIds: string[]) => {
    const currentIds = dailyLists[selectedDailyDate] || [];
    const setIds = new Set(currentIds);
    let addedCount = 0;
    newIds.forEach((id) => {
      if (!setIds.has(id)) {
        setIds.add(id);
        addedCount++;
      }
    });

    const updatedList = Array.from(setIds);
    const updatedDailyLists = {
      ...dailyLists,
      [selectedDailyDate]: updatedList,
    };
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);
    showToast(`${addedCount} cliente(s) puxado(s) para a Lista do Dia!`);
  };

  const handleRemovePassengerFromDaily = (passengerId: string) => {
    const currentIds = dailyLists[selectedDailyDate] || [];
    const updatedList = currentIds.filter((id) => id !== passengerId);
    const updatedDailyLists = {
      ...dailyLists,
      [selectedDailyDate]: updatedList,
    };
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);

    const targetPassenger = passengers.find((p) => p.id === passengerId);
    const name = targetPassenger ? `"${targetPassenger.fullName}"` : 'Cliente';
    showToast(`${name} removido da Lista do Dia (mantido na Lista Geral).`);
  };

  const handleClearDailyList = () => {
    const updatedDailyLists = {
      ...dailyLists,
      [selectedDailyDate]: [],
    };
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);
    showToast('Lista do Dia zerada com sucesso! Todos os clientes continuam salvos na Lista Geral.');
  };

  const handleSaveNewPassengerAndAddToDaily = (newPassenger: Passenger) => {
    // 1. Save in General List to keep feeding the system
    const updatedPassengers = [newPassenger, ...passengers];
    setPassengers(updatedPassengers);
    savePassengers(updatedPassengers);

    // 2. Add to Daily List
    const currentIds = dailyLists[selectedDailyDate] || [];
    const updatedList = currentIds.includes(newPassenger.id) ? currentIds : [...currentIds, newPassenger.id];
    const updatedDailyLists = {
      ...dailyLists,
      [selectedDailyDate]: updatedList,
    };
    setDailyLists(updatedDailyLists);
    saveDailyLists(updatedDailyLists);

    showToast(`Cliente "${newPassenger.fullName}" adicionado à Lista do Dia e cadastrado na Lista Geral!`);
  };

  const handleEditPassenger = (p: Passenger) => {
    setEditingPassenger(p);
    setActiveTab('new-passenger');
  };

  const handleClearAllData = (resetFinancial: boolean = false) => {
    clearAllData(resetFinancial);
    setDrivers([]);
    setPassengers([]);
    setTrips([]);
    setDailyLists({});
    setSelectedDriverFilter('all');
    setSearchQuery('');
    setEditingPassenger(null);
    setAllocatingPassenger(null);
    showToast('Todos os dados foram zerados com sucesso!');
  };

  // Distinct seller count
  const sellerCount = useMemo(() => {
    const sellers = new Set(passengers.map((p) => p.seller.trim()).filter(Boolean));
    return sellers.size;
  }, [passengers]);

  // Filtered passengers
  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      // Driver filter
      if (selectedDriverFilter === 'unallocated') {
        if (p.driverId) return false;
      } else if (selectedDriverFilter !== 'all' && p.driverId !== selectedDriverFilter) {
        return false;
      }

      // Search query (matches name, origin, destination, seller, or driver name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesOrigin = p.origin.toLowerCase().includes(q);
        const matchesDestination = p.destination.toLowerCase().includes(q);
        const matchesSeller = p.seller.toLowerCase().includes(q);
        const assignedDriver = drivers.find((d) => d.id === p.driverId);
        const matchesDriver = assignedDriver ? assignedDriver.fullName.toLowerCase().includes(q) : false;

        return matchesName || matchesOrigin || matchesDestination || matchesSeller || matchesDriver;
      }

      return true;
    });
  }, [passengers, selectedDriverFilter, searchQuery, drivers]);

  // Driver dictionary for quick lookup
  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 pb-20 md:pb-8 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-slate-900 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* App Header */}
      <Header
        passengerCount={passengers.length}
        driverCount={drivers.length}
        dailyCount={currentDailyPassengerIds.length}
        tripCount={trips.length}
        sellerCount={sellerCount}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenDriverModal={() => setIsDriverModalOpen(true)}
        onResetData={() => setActiveTab('settings')}
        companyConfig={companyConfig}
        onOpenLicenseModal={() => handleOpenLicenseModal(false)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenKeyGenerator={() => handleOpenLicenseModal(true)}
        isLicenseActive={isLicenseActive}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-4">
        {/* TAB 1: PASSENGERS GENERAL LIST */}
        {activeTab === 'passengers' && (
          <div className="space-y-3.5">
            {/* Quick action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Clientes (Lista Geral)
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {filteredPassengers.length} de {passengers.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerenciamento unificado de passageiros. Filtre por motorista, edite diretamente ou adicione à lista do dia.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  id="btn-goto-daily-list"
                  onClick={() => setActiveTab('daily-list')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Acessar a Lista do Dia"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Lista do Dia</span>
                  {currentDailyPassengerIds.length > 0 && (
                    <span className="bg-emerald-900 text-emerald-100 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {currentDailyPassengerIds.length}
                    </span>
                  )}
                </button>

                <button
                  id="btn-generate-general-pdf"
                  onClick={() => {
                    if (passengers.length === 0) {
                      showToast('Cadastre ao menos um passageiro para gerar o PDF.');
                      return;
                    }
                    const isFiltered = filteredPassengers.length !== passengers.length;
                    const listToExport = isFiltered ? filteredPassengers : passengers;
                    const filterNote = isFiltered ? `Filtrados (${filteredPassengers.length} de ${passengers.length})` : undefined;
                    generateGeneralPassengersListPdf(listToExport, drivers, filterNote, companyConfig);
                    showToast('PDF da Lista Geral gerado com sucesso!');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Baixar PDF com a lista geral de passageiros cadastrados"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Gerar PDF</span>
                </button>

                <button
                  id="main-new-passenger-shortcut-btn"
                  onClick={() => {
                    setEditingPassenger(null);
                    setActiveTab('new-passenger');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Search Input & Driver Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-passengers-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por passageiro, destino, vendedor, motorista..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Driver Filter Horizontal Scroll */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                  <span className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-emerald-700" />
                    Filtrar por Motorista:
                  </span>
                  {selectedDriverFilter !== 'all' && (
                    <button
                      onClick={() => setSelectedDriverFilter('all')}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <button
                    id="filter-driver-all"
                    onClick={() => setSelectedDriverFilter('all')}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedDriverFilter === 'all'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({passengers.length})
                  </button>

                  <button
                    onClick={() => setSelectedDriverFilter('unallocated')}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      selectedDriverFilter === 'unallocated'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-50 text-amber-700 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>Não Alocados</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                      {passengers.filter((p) => !p.driverId).length}
                    </span>
                  </button>

                  {drivers.map((drv) => {
                    const count = passengers.filter((p) => p.driverId === drv.id).length;
                    const isSelected = selectedDriverFilter === drv.id;
                    return (
                      <button
                        key={drv.id}
                        onClick={() => setSelectedDriverFilter(drv.id)}
                        className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{drv.fullName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* View Mode Toggle & Legend Bar */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <span>{filteredPassengers.length} cliente(s)</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-emerald-800 hidden sm:inline">
                  {passengerViewMode === 'list'
                    ? 'Visualização em Linha Única (1 linha por cliente)'
                    : 'Visualização em Cards Detalhados'}
                </span>
              </div>

              {/* View Switcher: Linha Única vs Cards */}
              <div className="flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80">
                <button
                  type="button"
                  onClick={() => setPassengerViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    passengerViewMode === 'list'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Modo Linha Única: visualize todos os dados de cada cliente em apenas uma linha"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Linha Única</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPassengerViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    passengerViewMode === 'grid'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Modo Cards: visualize os passageiros em formato de cards detalhados"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>

            {/* Table Header Guide for Single-Line View (Visible on tablet/desktop) */}
            {passengerViewMode === 'list' && filteredPassengers.length > 0 && (
              <div className="hidden lg:flex items-center justify-between gap-2.5 px-4 py-1.5 bg-slate-200/60 rounded-lg text-[11px] font-bold text-slate-600 tracking-wider">
                <div className="min-w-[200px] max-w-xs xl:max-w-sm flex-1"># / NOME DO PASSAGEIRO</div>
                <div className="shrink-0 w-36 text-center">CIDADE DE ORIGEM</div>
                <div className="shrink-0 w-36 text-center">CIDADE DE DESTINO</div>
                <div className="shrink-0 w-32 text-center">VENDEDOR</div>
                <div className="shrink-0 w-36 text-center">MOTORISTA ALOCADO</div>
                <div className="shrink-0 w-28 text-center">LISTA DO DIA</div>
                <div className="shrink-0 w-24 text-right">AÇÕES</div>
              </div>
            )}

            {/* Passenger List Rendering */}
            {filteredPassengers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Nenhum passageiro encontrado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery || selectedDriverFilter !== 'all'
                    ? 'Tente ajustar sua busca ou o filtro de motorista selecionado.'
                    : 'Cadastre os passageiros na Lista Geral com Nome Completo, Origem, Destino e Vendedor.'}
                </p>
                <button
                  onClick={() => {
                    if (searchQuery || selectedDriverFilter !== 'all') {
                      setSearchQuery('');
                      setSelectedDriverFilter('all');
                    } else {
                      setActiveTab('new-passenger');
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {passengers.length === 0 ? 'Cadastrar Passageiro' : 'Limpar Filtros'}
                </button>
              </div>
            ) : passengerViewMode === 'list' ? (
              /* SINGLE LINE LIST VIEW (1 linha por cliente) */
              <div className="space-y-1.5">
                {filteredPassengers.map((passenger, index) => (
                  <PassengerRow
                    key={passenger.id}
                    index={index + 1}
                    passenger={passenger}
                    driver={driverMap.get(passenger.driverId)}
                    drivers={drivers}
                    onEdit={handleEditPassenger}
                    onDelete={handleDeletePassenger}
                    onQuickAllocateDriver={handleAllocateDriver}
                    onUpdateOrigin={handleUpdateOrigin}
                    onUpdateDestination={handleUpdateDestination}
                    onUpdateSeller={handleUpdatePassengerSeller}
                    onAddToDailyList={handleAddPassengerToDaily}
                    isInDailyList={currentDailyPassengerIds.includes(passenger.id)}
                  />
                ))}
              </div>
            ) : (
              /* GRID CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPassengers.map((passenger) => (
                  <PassengerCard
                    key={passenger.id}
                    passenger={passenger}
                    driver={driverMap.get(passenger.driverId)}
                    drivers={drivers}
                    onEdit={handleEditPassenger}
                    onDelete={handleDeletePassenger}
                    onSelectDriverManifest={(driverId) => {
                      const drv = driverMap.get(driverId);
                      if (drv) setManifestDriver(drv);
                    }}
                    onQuickAllocateDriver={handleAllocateDriver}
                    onOpenAllocationModal={(p) => setAllocatingPassenger(p)}
                    onUpdateOrigin={handleUpdateOrigin}
                    onUpdateDestination={handleUpdateDestination}
                    onUpdateSeller={handleUpdatePassengerSeller}
                    onAddToDailyList={handleAddPassengerToDaily}
                    isInDailyList={currentDailyPassengerIds.includes(passenger.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LISTA DO DIA (NOVA GUIA SOLICITADA) */}
        {activeTab === 'daily-list' && (
          <DailyListManager
            passengers={passengers}
            drivers={drivers}
            dailyPassengerIds={currentDailyPassengerIds}
            selectedDate={selectedDailyDate}
            onSelectDate={setSelectedDailyDate}
            onAddPassengerToDaily={handleAddPassengerToDaily}
            onAddMultiplePassengersToDaily={handleAddMultiplePassengersToDaily}
            onRemovePassengerFromDaily={handleRemovePassengerFromDaily}
            onClearDailyList={handleClearDailyList}
            onSaveNewPassengerAndAddToDaily={handleSaveNewPassengerAndAddToDaily}
            onUpdatePassengerDriver={handleAllocateDriver}
            onUpdatePassengerSeller={handleUpdatePassengerSeller}
            companyConfig={companyConfig}
          />
        )}

        {/* TAB 3: VIAGEM (TRIPS GUIA COM DATA, ORIGEM, DESTINO, MOTORISTA E RELATÓRIO PDF) */}
        {activeTab === 'trips' && (
          <TripManager
            trips={trips}
            drivers={drivers}
            passengers={passengers}
            onSaveTrip={handleSaveTrip}
            onDeleteTrip={handleDeleteTrip}
            onOpenAddDriver={() => setIsDriverModalOpen(true)}
            onNavigateToNewPassenger={() => {
              setEditingPassenger(null);
              setActiveTab('new-passenger');
            }}
            companyConfig={companyConfig}
          />
        )}

        {/* TAB 4: FECHAMENTO DE VIAGENS, DESPESAS & APURAÇÃO DE LUCRO (NOVA GUIA SOLICITADA) */}
        {activeTab === 'closing' && (
          <TripClosingManager
            trips={trips}
            passengers={passengers}
            drivers={drivers}
            companyConfig={companyConfig}
            onNavigateToPricing={() => setActiveTab('pricing')}
          />
        )}

        {/* TAB 5: VALORES, TARIFAS & COMISSÕES (CENTRALIZADO) */}
        {activeTab === 'pricing' && (
          <PricingManager
            passengers={passengers}
            trips={trips}
            drivers={drivers}
            companyConfig={companyConfig}
          />
        )}

        {/* FORMULÁRIO DE CADASTRO/EDIÇÃO DE CLIENTES */}
        {activeTab === 'new-passenger' && (
          <div>
            <PassengerForm
              drivers={drivers}
              passengers={passengers}
              onSavePassenger={handleSavePassenger}
              onOpenDriverModal={() => setIsDriverModalOpen(true)}
              editingPassenger={editingPassenger}
              onCancelEdit={() => {
                setEditingPassenger(null);
                setActiveTab('passengers');
              }}
            />

            {/* Informational guide */}
            <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Diretrizes de Cadastro</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-950/80">
                • Cada passageiro contém obrigatoriamente: <strong>Nome Completo</strong>, <strong>Origem e Destino da viagem</strong> e o <strong>Vendedor da passagem</strong>.
              </p>
              <p className="text-[11px] leading-relaxed text-emerald-950/80">
                • Você pode destinar para um motorista imediatamente ou cadastrar na <strong>Lista Geral de Clientes</strong> e alocar a qualquer momento.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: DRIVERS MANAGEMENT */}
        {activeTab === 'drivers' && (
          <DriverList
            drivers={drivers}
            passengers={passengers}
            onOpenAddDriver={() => setIsDriverModalOpen(true)}
            onDeleteDriver={handleDeleteDriver}
            onClearDriverPassengers={handleClearDriverPassengers}
            onViewManifest={(driver) => setManifestDriver(driver)}
            companyConfig={companyConfig}
          />
        )}

        {/* TAB 5: REPORTS (SUBSTITUIU VENDEDORES COM FILTROS, VIAGENS POR MOTORISTA, DESTINOS MAIS PROCURADOS, CLIENTES VIP, COMISSÕES % E FATURAMENTO DO MÊS) */}
        {(activeTab === 'reports' || (activeTab as string) === 'sellers') && (
          <ReportsManager
            passengers={passengers}
            drivers={drivers}
            trips={trips}
            dailyLists={dailyLists}
            onSelectPassengerFilter={(sellerName) => {
              setSearchQuery(sellerName);
              setSelectedDriverFilter('all');
              setActiveTab('passengers');
            }}
            companyConfig={companyConfig}
          />
        )}

        {/* TAB 6: SISTEMA & AJUSTES (LIMPEZA SEGURA DE DADOS COM CONFIRMAÇÃO ANTIERRO E BACKUP) */}
        {activeTab === 'settings' && (
          <SettingsManager
            passengers={passengers}
            drivers={drivers}
            trips={trips}
            dailyLists={dailyLists}
            financialConfig={getStoredFinancialConfig()}
            companyConfig={companyConfig}
            onSaveCompanyConfig={handleSaveCompanyConfig}
            onClearAllData={handleClearAllData}
            onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
            onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          />
        )}
      </main>

      {/* Driver Registration Modal */}
      <DriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSaveDriver={handleSaveDriver}
        existingDrivers={drivers}
      />

      {/* Driver Allocation Modal */}
      <DriverAllocationModal
        passenger={allocatingPassenger}
        drivers={drivers}
        isOpen={!!allocatingPassenger}
        onClose={() => setAllocatingPassenger(null)}
        onAllocateDriver={handleAllocateDriver}
        onOpenAddDriver={() => setIsDriverModalOpen(true)}
      />

      {/* Driver Passenger Manifest Modal */}
      <DriverManifestModal
        driver={manifestDriver}
        passengers={passengers}
        isOpen={!!manifestDriver}
        onClose={() => setManifestDriver(null)}
        onUnallocatePassenger={(pId) => {
          handleAllocateDriver(pId, '');
        }}
        onClearDriverPassengers={handleClearDriverPassengers}
        companyConfig={companyConfig}
      />

      {/* Product Licensing & 3-Installation Slot Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onLicenseUpdated={(lic) => setIsLicenseActive(!!lic)}
        initialShowGenerator={isLicenseModalDirectToGenerator}
      />

      {/* Local Database Initialization & Health Modal */}
      <DatabaseStatusModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onDataRestored={reloadAllData}
      />

      {/* Offline Connectivity & Storage Banner */}
      <OfflineIndicator />

      {/* Bottom Navigation with 6 tabs */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab !== 'new-passenger') {
            setEditingPassenger(null);
          }
          setActiveTab(tab);
        }}
        passengerCount={passengers.length}
        driverCount={drivers.length}
        dailyCount={currentDailyPassengerIds.length}
        tripCount={trips.length}
        sellerCount={sellerCount}
        companyConfig={companyConfig}
      />
    </div>
  );
}
