import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalendarDays,
  UserPlus,
  Users,
  Search,
  Check,
  Plus,
  FileDown,
  RotateCcw,
  UserMinus,
  MapPin,
  Flag,
  Tag,
  Car,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  ArrowDownRight,
  Database,
  Edit3,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Driver, Passenger, CompanyConfig } from '../types';
import { generateDailyListPdf } from '../utils/pdfGenerator';

interface DailyListManagerProps {
  passengers: Passenger[];
  drivers: Driver[];
  dailyPassengerIds: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAddPassengerToDaily: (passengerId: string, customSeller?: string) => void;
  onAddMultiplePassengersToDaily: (passengerIds: string[]) => void;
  onRemovePassengerFromDaily: (passengerId: string) => void;
  onClearDailyList: () => void;
  onSaveNewPassengerAndAddToDaily: (newPassenger: Passenger) => void;
  onUpdatePassengerDriver: (passengerId: string, driverId: string) => void;
  onUpdatePassengerSeller?: (passengerId: string, newSeller: string) => void;
  onUpdatePassengerOrigin?: (passengerId: string, newOrigin: string) => void;
  onUpdatePassengerDestination?: (passengerId: string, newDestination: string) => void;
  companyConfig?: CompanyConfig;
}

export const DailyListManager: React.FC<DailyListManagerProps> = ({
  passengers,
  drivers,
  dailyPassengerIds,
  selectedDate,
  onSelectDate,
  onAddPassengerToDaily,
  onAddMultiplePassengersToDaily,
  onRemovePassengerFromDaily,
  onClearDailyList,
  onSaveNewPassengerAndAddToDaily,
  onUpdatePassengerDriver,
  onUpdatePassengerSeller,
  onUpdatePassengerOrigin,
  onUpdatePassengerDestination,
  companyConfig,
}) => {
  // Modals state
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [passengerToRemove, setPassengerToRemove] = useState<Passenger | null>(null);

  // Route alteration state (Origin and Destination editing in Daily List)
  const [routeEditPassenger, setRouteEditPassenger] = useState<Passenger | null>(null);
  const [routeOriginInput, setRouteOriginInput] = useState('');
  const [routeDestinationInput, setRouteDestinationInput] = useState('');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isPullingAfterRouteEdit, setIsPullingAfterRouteEdit] = useState(false);

  // Seller alteration state (when pulling or updating)
  const [sellerEditPassenger, setSellerEditPassenger] = useState<Passenger | null>(null);
  const [isPullingAfterSellerEdit, setIsPullingAfterSellerEdit] = useState(false);
  const [customSellerInput, setCustomSellerInput] = useState('');
  const [isBulkSellerModalOpen, setIsBulkSellerModalOpen] = useState(false);
  const [bulkSellerInput, setBulkSellerInput] = useState('');

  // Search inside daily list
  const [dailySearch, setDailySearch] = useState('');
  // View mode: single-line list (default) or cards
  const [dailyViewMode, setDailyViewMode] = useState<'list' | 'cards'>('list');

  // Pull modal state
  const [pullSearch, setPullSearch] = useState('');
  const [selectedToPull, setSelectedToPull] = useState<string[]>([]);

  // New Client Form state
  const [newFullName, setNewFullName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newSeller, setNewSeller] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [autoPulledNoticeModal, setAutoPulledNoticeModal] = useState<string | null>(null);
  const [isModalSuggestionsOpen, setIsModalSuggestionsOpen] = useState(false);
  const modalSuggestionsRef = useRef<HTMLDivElement>(null);

  // Close modal suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalSuggestionsRef.current && !modalSuggestionsRef.current.contains(e.target as Node)) {
        setIsModalSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Driver dictionary
  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  // Passenger dictionary
  const passengerMap = useMemo(() => {
    const map = new Map<string, Passenger>();
    passengers.forEach((p) => map.set(p.id, p));
    return map;
  }, [passengers]);

  // Passengers currently in the daily list
  const currentDailyPassengers = useMemo(() => {
    return dailyPassengerIds
      .map((id) => passengerMap.get(id))
      .filter((p): p is Passenger => p !== undefined);
  }, [dailyPassengerIds, passengerMap]);

  // Filtered daily passengers (by search box)
  const filteredDailyPassengers = useMemo(() => {
    const query = dailySearch.trim().toLowerCase();
    if (!query) return currentDailyPassengers;
    return currentDailyPassengers.filter((p) => {
      const driver = p.driverId ? driverMap.get(p.driverId)?.fullName.toLowerCase() || '' : '';
      return (
        p.fullName.toLowerCase().includes(query) ||
        p.origin.toLowerCase().includes(query) ||
        p.destination.toLowerCase().includes(query) ||
        p.seller.toLowerCase().includes(query) ||
        driver.includes(query)
      );
    });
  }, [currentDailyPassengers, dailySearch, driverMap]);

  // Existing passengers available in general list for pull modal
  const pullFilteredPassengers = useMemo(() => {
    const query = pullSearch.trim().toLowerCase();
    if (!query) return passengers;
    return passengers.filter((p) => {
      const driver = p.driverId ? driverMap.get(p.driverId)?.fullName.toLowerCase() || '' : '';
      return (
        p.fullName.toLowerCase().includes(query) ||
        p.origin.toLowerCase().includes(query) ||
        p.destination.toLowerCase().includes(query) ||
        p.seller.toLowerCase().includes(query) ||
        driver.includes(query)
      );
    });
  }, [passengers, pullSearch, driverMap]);

  // Quick suggestions for origins, destinations and sellers from existing database
  const suggestedOrigins = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.origin) set.add(p.origin.trim());
    });
    return Array.from(set).slice(0, 5);
  }, [passengers]);

  const suggestedDestinations = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.destination) set.add(p.destination.trim());
    });
    return Array.from(set).slice(0, 5);
  }, [passengers]);

  const suggestedSellers = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.seller) set.add(p.seller.trim());
    });
    return Array.from(set).slice(0, 5);
  }, [passengers]);

  // Detect if typed name in new client form matches someone in General List
  const existingMatchesInGeneralList = useMemo(() => {
    const trimmed = newFullName.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return passengers.filter((p) => p.fullName.toLowerCase().includes(trimmed)).slice(0, 5);
  }, [newFullName, passengers]);

  // Exact match detection in General List
  const exactMatchInGeneralList = useMemo(() => {
    const trimmed = newFullName.trim().toLowerCase();
    if (trimmed.length < 3) return null;
    return passengers.find((p) => p.fullName.trim().toLowerCase() === trimmed) || null;
  }, [newFullName, passengers]);

  // Handler to auto-fill form with matching customer data
  const handleAutoFillFromMatch = (match: Passenger) => {
    setNewFullName(match.fullName);
    setNewOrigin(match.origin);
    setNewDestination(match.destination);
    setNewSeller(match.seller);
    if (match.driverId) {
      setNewDriverId(match.driverId);
    }
    setIsModalSuggestionsOpen(false);
    setAutoPulledNoticeModal(`Dados de "${match.fullName}" puxados automaticamente da base de dados!`);
  };

  // Open route editor modal (Origin and Destination for Daily List)
  const openRouteEditor = (passenger: Passenger, andPull: boolean = false) => {
    setRouteEditPassenger(passenger);
    setIsPullingAfterRouteEdit(andPull);
    setRouteOriginInput(passenger.origin || '');
    setRouteDestinationInput(passenger.destination || '');
    setRouteError(null);
  };

  // Save route alteration
  const handleSaveRouteEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!routeEditPassenger) return;

    const origin = routeOriginInput.trim().toUpperCase();
    const dest = routeDestinationInput.trim().toUpperCase();

    if (!origin) {
      setRouteError('Na Lista do Dia, a Cidade de Origem é obrigatória.');
      return;
    }
    if (!dest) {
      setRouteError('Na Lista do Dia, a Cidade de Destino é obrigatória.');
      return;
    }

    if (onUpdatePassengerOrigin) {
      onUpdatePassengerOrigin(routeEditPassenger.id, origin);
    }
    if (onUpdatePassengerDestination) {
      onUpdatePassengerDestination(routeEditPassenger.id, dest);
    }

    if (isPullingAfterRouteEdit) {
      onAddPassengerToDaily(routeEditPassenger.id);
    }

    setRouteEditPassenger(null);
    setIsPullingAfterRouteEdit(false);
    setRouteError(null);
  };

  // Open seller editor modal
  const openSellerEditor = (passenger: Passenger, andPull: boolean = false) => {
    setSellerEditPassenger(passenger);
    setIsPullingAfterSellerEdit(andPull);
    setCustomSellerInput(passenger.seller);
  };

  // Save seller alteration
  const handleSaveSellerEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sellerEditPassenger) return;

    const newSeller = customSellerInput.trim().toUpperCase() || sellerEditPassenger.seller.toUpperCase();

    if (onUpdatePassengerSeller) {
      onUpdatePassengerSeller(sellerEditPassenger.id, newSeller);
    }

    if (isPullingAfterSellerEdit) {
      // Se não tiver cidade de origem ou destino, abre o editor de rota obrigatório da Lista do Dia
      if (!sellerEditPassenger.origin?.trim() || !sellerEditPassenger.destination?.trim()) {
        const passengerRef = sellerEditPassenger;
        setSellerEditPassenger(null);
        setIsPullingAfterSellerEdit(false);
        setCustomSellerInput('');
        openRouteEditor(passengerRef, true);
        return;
      }
      onAddPassengerToDaily(sellerEditPassenger.id, newSeller);
    }

    setSellerEditPassenger(null);
    setIsPullingAfterSellerEdit(false);
    setCustomSellerInput('');
  };

  // Bulk pull with custom seller
  const handleConfirmBulkPullWithSeller = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const seller = bulkSellerInput.trim().toUpperCase();
    if (seller && onUpdatePassengerSeller) {
      selectedToPull.forEach((id) => {
        onUpdatePassengerSeller(id, seller);
      });
    }
    onAddMultiplePassengersToDaily(selectedToPull);
    setSelectedToPull([]);
    setIsPullModalOpen(false);
    setIsBulkSellerModalOpen(false);
    setBulkSellerInput('');
  };

  // Handler to directly pull existing customer into today's list
  const handleDirectPullMatch = (match: Passenger) => {
    // Na Lista do Dia: Origem e Destino são obrigatórios!
    if (!match.origin?.trim() || !match.destination?.trim()) {
      handleAutoFillFromMatch(match);
      setFormError('Na Lista do Dia é obrigatório definir Cidade de Origem e de Destino. Preencha os campos destacados abaixo.');
      return;
    }
    onAddPassengerToDaily(match.id);
    setIsNewClientModalOpen(false);
    setIsModalSuggestionsOpen(false);
    setNewFullName('');
    setNewOrigin('');
    setNewDestination('');
    setNewSeller('');
    setNewDriverId('');
    setAutoPulledNoticeModal(null);
  };

  // Navigation helpers for dates
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const newY = current.getFullYear();
    const newM = String(current.getMonth() + 1).padStart(2, '0');
    const newD = String(current.getDate()).padStart(2, '0');
    onSelectDate(`${newY}-${newM}-${newD}`);
  };

  const setDateToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
  };

  // Formatted date string for header
  const formattedDateTitle = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      // Fallback
    }
    return selectedDate;
  }, [selectedDate]);

  // Handle saving new client from the Daily List modal
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = newFullName.trim();
    const origin = newOrigin.trim();
    const dest = newDestination.trim();
    const seller = newSeller.trim();

    if (!name) {
      setFormError('Informe o nome completo do cliente.');
      return;
    }
    // Na Lista do Dia: EXIGIR apenas Origem e Destino (Vendedor e Motorista são opcionais)
    if (!origin) {
      setFormError('Na Lista do Dia é obrigatório informar a Cidade de Origem.');
      return;
    }
    if (!dest) {
      setFormError('Na Lista do Dia é obrigatório informar a Cidade de Destino.');
      return;
    }

    const newPassenger: Passenger = {
      id: 'pass_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      fullName: name.toUpperCase(),
      origin: origin.toUpperCase(),
      destination: dest.toUpperCase(),
      seller: seller ? seller.toUpperCase() : 'BALCÃO',
      driverId: newDriverId || '',
      createdAt: new Date().toISOString(),
    };

    onSaveNewPassengerAndAddToDaily(newPassenger);

    // Reset form
    setNewFullName('');
    setNewOrigin('');
    setNewDestination('');
    setNewSeller('');
    setNewDriverId('');
    setIsNewClientModalOpen(false);
  };

  // Handle pull selection toggle
  const togglePullSelection = (id: string) => {
    setSelectedToPull((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmPullSelection = () => {
    if (selectedToPull.length === 0) return;
    onAddMultiplePassengersToDaily(selectedToPull);
    setSelectedToPull([]);
    setIsPullModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Date Control Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-300 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b-2 border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold border-2 border-emerald-300 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>Lista do Dia</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border-2 border-emerald-300">
                  {currentDailyPassengers.length} cliente(s)
                </span>
              </h2>
              <p className="text-xs text-slate-500 uppercase font-medium truncate">
                {formattedDateTitle}
              </p>
            </div>
          </div>

          {/* Date Selector & Fast Nav */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-50 p-1 rounded-xl border-2 border-slate-300 w-full sm:w-auto">
            <button
              onClick={() => changeDateByDays(-1)}
              title="Dia anterior"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 px-1 py-1 focus:outline-hidden cursor-pointer flex-1 sm:flex-none text-center min-w-0"
            />

            <button
              onClick={() => changeDateByDays(1)}
              title="Próximo dia"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={setDateToToday}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[11px] font-bold text-emerald-800 rounded-lg border-2 border-slate-300 shadow-2xs transition cursor-pointer shrink-0"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Primary Action Buttons: Puxar da Lista Geral, Novo Cliente, Gerar PDF, Zerar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Button 1: Puxar da Lista Geral */}
          <button
            id="btn-pull-from-general"
            onClick={() => {
              setPullSearch('');
              setSelectedToPull([]);
              setIsPullModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer border-2 border-emerald-900"
            title="Importar ou selecionar clientes já cadastrados na Lista Geral"
          >
            <Users className="w-4 h-4 text-emerald-200" />
            <span>Puxar da Lista Geral</span>
          </button>

          {/* Button 2: Novo Cliente (salva na lista do dia e alimenta a lista geral) */}
          <button
            id="btn-new-client-daily"
            onClick={() => {
              setFormError(null);
              setIsNewClientModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer border-2 border-emerald-800"
            title="Cadastrar novo cliente: adiciona à lista do dia e salva automaticamente na Lista Geral permanente"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Cliente</span>
          </button>

          {/* Button 3: Gerar PDF */}
          <button
            id="btn-pdf-daily"
            onClick={() => {
              generateDailyListPdf(selectedDate, currentDailyPassengers, drivers, companyConfig);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer border-2 border-slate-950"
            title="Baixar lista em PDF para conferência, controle de embarque ou impressão"
          >
            <FileDown className="w-4 h-4 text-slate-300" />
            <span>Gerar PDF</span>
          </button>

          {/* Button 4: Zerar Lista do Dia */}
          <button
            id="btn-clear-daily"
            onClick={() => setIsConfirmClearOpen(true)}
            disabled={currentDailyPassengers.length === 0}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition cursor-pointer ${
              currentDailyPassengers.length === 0
                ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400 active:scale-[0.98]'
            }`}
            title="Zerar passageiros agendados para este dia (mantém clientes salvos na Lista Geral)"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Zerar Lista</span>
          </button>
        </div>

        {/* Explain Card */}
        <div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-emerald-950/80">
            Você pode <strong>puxar contatos da Lista Geral</strong> ou cadastrar <strong>novos clientes</strong>. Ao cadastrar um novo cliente aqui, ele é salvo automaticamente na <strong>Lista Geral</strong> para continuar alimentando a base permanente do sistema.
          </p>
        </div>
      </div>

      {/* Search Filter for Current Day */}
      {currentDailyPassengers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar cliente, destino, vendedor ou motorista nesta lista..."
            value={dailySearch}
            onChange={(e) => setDailySearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-2xs font-medium"
          />
          {dailySearch && (
            <button
              onClick={() => setDailySearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Daily List Items Display */}
      {currentDailyPassengers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-300 space-y-4 shadow-2xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 border border-emerald-200/60">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              Nenhum passageiro na Lista do Dia
            </h3>
            <p className="text-xs text-slate-500">
              Escolha uma das opções abaixo para montar a lista de embarque desta data:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto pt-2">
            <button
              onClick={() => {
                setPullSearch('');
                setSelectedToPull([]);
                setIsPullModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-200" />
              <span>Puxar da Lista Geral</span>
            </button>

            <button
              onClick={() => {
                setFormError(null);
                setIsNewClientModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>
        </div>
      ) : filteredDailyPassengers.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500 space-y-2">
          <p>Nenhum passageiro encontrado com o termo "{dailySearch}".</p>
          <button
            onClick={() => setDailySearch('')}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-medium">
            <span>Passageiros Agendados ({filteredDailyPassengers.length})</span>

            {/* View mode toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setDailyViewMode('list')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  dailyViewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualização em Linha Única"
              >
                <List className="w-3 h-3" />
                <span>1 Linha</span>
              </button>
              <button
                type="button"
                onClick={() => setDailyViewMode('cards')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  dailyViewMode === 'cards'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Cards</span>
              </button>
            </div>
          </div>

          {dailyViewMode === 'list' ? (
            /* Single-line list view */
            <div className="space-y-2">
              {filteredDailyPassengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="bg-white hover:bg-emerald-50/20 rounded-xl p-2.5 sm:px-3 sm:py-2 border-2 border-slate-300 hover:border-emerald-500 transition flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-2.5 text-xs shadow-2xs hover:shadow-xs"
                >
                  {/* Top line: # + Client Name + Remove on Mobile */}
                  <div className="flex items-center justify-between gap-2 w-full md:w-auto md:min-w-[170px] md:max-w-xs flex-1">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 border-2 border-emerald-300">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 truncate text-xs sm:text-[13px]">
                        {passenger.fullName}
                      </h4>
                    </div>

                    {/* Remove button on mobile top bar */}
                    <button
                      onClick={() => setPassengerToRemove(passenger)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-lg md:hidden shrink-0 active:scale-95"
                      title="Remover desta Lista do Dia"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges / Chips Row */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
                    {/* Campo 1: Cidade de Origem (Obrigatório na Lista do Dia) */}
                    <button
                      type="button"
                      onClick={() => openRouteEditor(passenger)}
                      className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs max-w-[calc(50%-4px)] sm:max-w-none transition cursor-pointer ${
                        passenger.origin?.trim()
                          ? 'bg-emerald-50/70 border border-emerald-300 hover:bg-emerald-100 text-emerald-900'
                          : 'bg-rose-50 border-2 border-rose-400 hover:bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                      title="Clique para alterar ou preencher a Cidade de Origem (obrigatória na Lista do Dia)"
                    >
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-tight shrink-0">Orig:</span>
                      <span className="font-bold truncate max-w-[90px] sm:max-w-none" title={passenger.origin || 'Definir Origem'}>
                        {passenger.origin?.trim() || 'Definir *'}
                      </span>
                      <Edit3 className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                    </button>

                    {/* Campo 2: Cidade de Destino (Obrigatório na Lista do Dia) */}
                    <button
                      type="button"
                      onClick={() => openRouteEditor(passenger)}
                      className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs max-w-[calc(50%-4px)] sm:max-w-none transition cursor-pointer ${
                        passenger.destination?.trim()
                          ? 'bg-rose-50/70 border border-rose-300 hover:bg-rose-100 text-rose-950'
                          : 'bg-rose-50 border-2 border-rose-400 hover:bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                      title="Clique para alterar ou preencher a Cidade de Destino (obrigatória na Lista do Dia)"
                    >
                      <Flag className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-tight shrink-0">Dest:</span>
                      <span className="font-bold truncate max-w-[90px] sm:max-w-none" title={passenger.destination || 'Definir Destino'}>
                        {passenger.destination?.trim() || 'Definir *'}
                      </span>
                      <Edit3 className="w-2.5 h-2.5 opacity-60 shrink-0 ml-0.5" />
                    </button>

                    {/* Seller with quick edit */}
                    <button
                      type="button"
                      onClick={() => openSellerEditor(passenger, false)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition cursor-pointer shrink-0 max-w-[calc(50%-4px)] sm:max-w-none"
                      title="Clique para alterar o vendedor"
                    >
                      <Tag className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">VEND: {passenger.seller}</span>
                      <Edit3 className="w-2.5 h-2.5 text-amber-700 opacity-60 ml-0.5 shrink-0" />
                    </button>

                    {/* Driver Selector */}
                    <div className="inline-flex items-center gap-1 text-[11px] shrink-0 max-w-[calc(50%-4px)] sm:max-w-none">
                      <Car className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
                      <select
                        value={passenger.driverId || ''}
                        onChange={(e) => onUpdatePassengerDriver(passenger.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer w-full sm:max-w-[130px] truncate"
                      >
                        <option value="">Mot: A definir</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Remove Button for desktop */}
                  <button
                    onClick={() => setPassengerToRemove(passenger)}
                    className="hidden md:block p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition cursor-pointer shrink-0 ml-auto sm:ml-0"
                    title="Remover desta Lista do Dia"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDailyPassengers.map((passenger, index) => {
                return (
                  <div
                    key={passenger.id}
                    className="bg-white rounded-2xl p-4 shadow-2xs border-2 border-slate-300 hover:border-slate-400 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border-2 border-slate-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {passenger.fullName}
                          </h4>
                          {/* Campos Separados: Origem e Destino (Obrigatórios na Lista do Dia) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => openRouteEditor(passenger)}
                              className={`p-2 rounded-xl border-2 shadow-2xs text-left transition cursor-pointer group ${
                                passenger.origin?.trim()
                                  ? 'bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-300/80'
                                  : 'bg-rose-50 border-rose-400 animate-pulse'
                              }`}
                              title="Clique para alterar ou preencher a Cidade de Origem"
                            >
                              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-tight text-emerald-800">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Cidade de Origem</span>
                                </div>
                                <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                              </div>
                              <span className="font-bold text-slate-800 text-xs block truncate mt-0.5" title={passenger.origin || 'Definir Origem'}>
                                {passenger.origin?.trim() || <span className="text-rose-700 font-bold">Definir *</span>}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openRouteEditor(passenger)}
                              className={`p-2 rounded-xl border-2 shadow-2xs text-left transition cursor-pointer group ${
                                passenger.destination?.trim()
                                  ? 'bg-rose-50/50 hover:bg-rose-100/70 border-rose-300/80'
                                  : 'bg-rose-50 border-rose-400 animate-pulse'
                              }`}
                              title="Clique para alterar ou preencher a Cidade de Destino"
                            >
                              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-tight text-rose-800">
                                <div className="flex items-center gap-1">
                                  <Flag className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Cidade de Destino</span>
                                </div>
                                <Edit3 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                              </div>
                              <span className="font-bold text-rose-950 text-xs block truncate mt-0.5" title={passenger.destination || 'Definir Destino'}>
                                {passenger.destination?.trim() || <span className="text-rose-700 font-bold">Definir *</span>}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove from Daily List button */}
                      <button
                        onClick={() => setPassengerToRemove(passenger)}
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 border-2 border-transparent hover:border-amber-200 rounded-lg transition cursor-pointer"
                        title="Remover desta Lista do Dia (o cliente continua salvo na Lista Geral)"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sub-bar: Vendedor & Motorista com Seletor Rápido */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t-2 border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => openSellerEditor(passenger, false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-[11px] font-bold transition cursor-pointer group"
                        title="Clique para alterar o vendedor desta passagem"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <span>Vendedor: <strong className="font-bold">{passenger.seller}</strong></span>
                        <Edit3 className="w-3 h-3 text-amber-700 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition ml-0.5" />
                      </button>

                      {/* Driver Selector */}
                      <div className="inline-flex items-center gap-1 text-[11px]">
                        <Car className="w-3.5 h-3.5 text-slate-500" />
                        <select
                          value={passenger.driverId || ''}
                          onChange={(e) => onUpdatePassengerDriver(passenger.id, e.target.value)}
                          className="bg-slate-50 border-2 border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="">Motorista: A definir</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PUXAR DA LISTA GERAL                                            */}
      {/* ========================================================================= */}
      {isPullModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Puxar da Lista Geral para o Dia
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione clientes já cadastrados no sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPullModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar na lista geral por nome, rota ou vendedor..."
                  value={pullSearch}
                  onChange={(e) => setPullSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />
                {pullSearch && (
                  <button
                    onClick={() => setPullSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                <span>{pullFilteredPassengers.length} cliente(s) no cadastro geral</span>
                {selectedToPull.length > 0 && (
                  <span className="font-bold text-emerald-700">
                    {selectedToPull.length} selecionado(s)
                  </span>
                )}
              </div>
            </div>

            {/* Modal Passenger List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pullFilteredPassengers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                  <p>Nenhum cliente encontrado na Lista Geral com o termo digitado.</p>
                  <p className="text-[11px] text-slate-400">
                    Você também pode usar a opção "+ Novo Cliente" para cadastrar e alimentar o sistema.
                  </p>
                </div>
              ) : (
                pullFilteredPassengers.map((p) => {
                  const isAlreadyInDaily = dailyPassengerIds.includes(p.id);
                  const isSelected = selectedToPull.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!isAlreadyInDaily) {
                          togglePullSelection(p.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                        isAlreadyInDaily
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-default'
                          : isSelected
                          ? 'bg-emerald-50/80 border-emerald-400 cursor-pointer shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border transition ${
                            isAlreadyInDaily
                              ? 'bg-slate-200 border-slate-300 text-slate-500'
                              : isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {(isAlreadyInDaily || isSelected) && <Check className="w-3 h-3" />}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{p.fullName}</p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="truncate">{p.origin} → {p.destination}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold">
                              <Tag className="w-2.5 h-2.5 text-amber-700" />
                              <span>VENDEDOR: {p.seller}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action / Badge */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isAlreadyInDaily ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              Já na lista
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSellerEditor(p, false);
                              }}
                              className="p-1 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded border border-slate-200 transition cursor-pointer"
                              title="Alterar vendedor deste cliente"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSellerEditor(p, true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Alterar vendedor e puxar para a Lista do Dia"
                            >
                              <Edit3 className="w-3 h-3 text-amber-700" />
                              <span>Alterar Vendedor</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!p.origin?.trim() || !p.destination?.trim()) {
                                  setIsPullModalOpen(false);
                                  openRouteEditor(p, true);
                                } else {
                                  onAddPassengerToDaily(p.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Puxar para a Lista do Dia (exige Origem e Destino)"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Puxar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPullModalOpen(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer order-2 sm:order-1 text-center"
              >
                Fechar
              </button>

              {selectedToPull.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkSellerInput('');
                      setIsBulkSellerModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Alt. Vendedor ({selectedToPull.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPullSelection}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Puxar ({selectedToPull.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NOVO CLIENTE (SALVA NA LISTA DO DIA E ALIMENTA LISTA GERAL)       */}
      {/* ========================================================================= */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cadastrar Novo Cliente na Lista do Dia
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exigidos: Nome Completo, Origem e Destino • Vendedor e Motorista opcionais
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewClient} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* Informative Guarantee Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Requisitos da Lista do Dia:</strong> É obrigatório informar o <strong>Nome Completo</strong>, a <strong>Cidade de Origem</strong> e a <strong>Cidade de Destino</strong> para a rota do dia. <strong>Vendedor</strong> e <strong>Motorista</strong> são opcionais. Este cliente também será salvo na <strong>Lista Geral</strong>.
                </p>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Auto Pulled Notice */}
              {autoPulledNoticeModal && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{autoPulledNoticeModal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPulledNoticeModal(null)}
                    className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Nome Completo com Busca Flutuante e Detecção Automática na Base */}
              <div className="space-y-1 relative" ref={modalSuggestionsRef}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>Nome Completo do Cliente *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                      Obrigatório
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>Busca na base</span>
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Digite o nome completo do cliente..."
                    value={newFullName}
                    onFocus={() => setIsModalSuggestionsOpen(true)}
                    onChange={(e) => {
                      setNewFullName(e.target.value);
                      setIsModalSuggestionsOpen(true);
                      setAutoPulledNoticeModal(null);
                    }}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-xs text-slate-900 font-semibold"
                    autoFocus
                    autoComplete="off"
                  />
                  {newFullName && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewFullName('');
                        setIsModalSuggestionsOpen(false);
                        setAutoPulledNoticeModal(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* BARRA DE BUSCA FLUTUANTE (DROPDOWN AUTOCOMPLETE) */}
                {isModalSuggestionsOpen && existingMatchesInGeneralList.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-emerald-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        Cliente encontrado na base de dados:
                      </span>
                      <span className="text-emerald-700 text-[10px] font-normal">
                        Escolha uma ação
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto">
                      {existingMatchesInGeneralList.map((match) => {
                        const isAlreadyInDaily = dailyPassengerIds.includes(match.id);
                        return (
                          <div
                            key={match.id}
                            className="p-2.5 hover:bg-emerald-50/50 transition flex items-center justify-between gap-2 group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                                  {match.fullName}
                                </p>
                                {isAlreadyInDaily ? (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold shrink-0">
                                    Na Lista de Hoje
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-medium shrink-0">
                                    Na Base
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                <span className="text-emerald-700 font-medium">{match.origin}</span> → <span className="text-rose-600 font-medium">{match.destination}</span>
                                {match.seller && <span className="text-slate-400"> • Vend: {match.seller}</span>}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1 shrink-0 justify-end">
                              <button
                                type="button"
                                onClick={() => handleAutoFillFromMatch(match)}
                                title="Preencher formulário com estes dados"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                Preencher
                              </button>
                              {!isAlreadyInDaily && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsNewClientModalOpen(false);
                                      setIsModalSuggestionsOpen(false);
                                      openSellerEditor(match, true);
                                    }}
                                    title="Alterar vendedor e puxar para a Lista do Dia"
                                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-0.5"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>Vendedor</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectPullMatch(match)}
                                    title="Adicionar diretamente à Lista do Dia"
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-0.5 shadow-2xs"
                                  >
                                    <ArrowDownRight className="w-3 h-3" />
                                    <span>Puxar</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Exact Match Notification */}
                {exactMatchInGeneralList && !autoPulledNoticeModal && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-900">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Cliente já cadastrado:</strong> "{exactMatchInGeneralList.fullName}" está na base.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoFillFromMatch(exactMatchInGeneralList)}
                        className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        Preencher Dados
                      </button>
                      {!dailyPassengerIds.includes(exactMatchInGeneralList.id) && (
                        <button
                          type="button"
                          onClick={() => handleDirectPullMatch(exactMatchInGeneralList)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Puxar Direto</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Campos Separados: Cidade de Origem e Cidade de Destino (Exigidos na Lista do Dia) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 p-2.5 bg-emerald-50/30 rounded-xl border-2 border-emerald-300">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs font-bold text-emerald-900">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Cidade de Origem *</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                      Obrigatório
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 text-xs text-slate-900 font-semibold"
                  />
                  {suggestedOrigins.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {suggestedOrigins.slice(0, 3).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewOrigin(s)}
                          className="px-1.5 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-medium cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 p-2.5 bg-rose-50/30 rounded-xl border-2 border-rose-300">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs font-bold text-rose-900">
                      <Flag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Cidade de Destino *</span>
                    </label>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                      Obrigatório
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rio de Janeiro"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-600 text-xs text-slate-900 font-semibold"
                  />
                  {suggestedDestinations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {suggestedDestinations.slice(0, 3).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewDestination(s)}
                          className="px-1.5 py-0.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded text-[10px] font-medium cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vendedor e Motorista (Opcionais na Lista do Dia) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Vendedor</label>
                    <span className="text-[10px] text-slate-500 font-medium">Opcional (Padrão: BALCÃO)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Carlos (Opcional)"
                    value={newSeller}
                    onChange={(e) => setNewSeller(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-xs text-slate-900"
                  />
                  {suggestedSellers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {suggestedSellers.slice(0, 3).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewSeller(s)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Motorista</label>
                    <span className="text-[10px] text-slate-500 font-medium">Opcional</span>
                  </div>
                  <select
                    value={newDriverId}
                    onChange={(e) => setNewDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="">A definir (Opcional)</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-new-client"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Cliente & Adicionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMAÇÃO DE REMOÇÃO DE PASSAGEIRO DA LISTA DO DIA             */}
      {/* ========================================================================= */}
      {passengerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Remover da Lista do Dia?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800">{passengerToRemove.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-200 space-y-2">
              <p>
                Esta ação apenas retira o passageiro da <strong>Lista do Dia ({selectedDate})</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px] pt-1 border-t border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>O cadastro do cliente permanece 100% salvo e seguro na Lista Geral.</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setPassengerToRemove(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-remove-daily"
                onClick={() => {
                  onRemovePassengerFromDaily(passengerToRemove.id);
                  setPassengerToRemove(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRMAÇÃO DE ZERAR LISTA DO DIA                                */}
      {/* ========================================================================= */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Zerar Lista do Dia ({selectedDate})?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentDailyPassengers.length} cliente(s) agendado(s)
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-200 space-y-2">
              <p>
                Esta ação vai limpar todos os passageiros agendados nesta data para começar uma nova escala do dia.
              </p>
              <div className="space-y-1 pt-1 border-t border-slate-200 text-[11px] text-emerald-800">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Todos os clientes continuam salvos no cadastro geral.</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>As viagens já salvas na guia Viagens permanecem intactas.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-clear-daily-list"
                onClick={() => {
                  onClearDailyList();
                  setIsConfirmClearOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                Sim, Zerar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ALTERAR VENDEDOR DA PASSAGEM                                      */}
      {/* ========================================================================= */}
      {sellerEditPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPullingAfterSellerEdit
                      ? 'Alterar Vendedor e Puxar'
                      : 'Alterar Vendedor da Passagem'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina quem realizou a venda desta passagem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSellerEditPassenger(null);
                  setIsPullingAfterSellerEdit(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Passenger Info Summary Box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cliente:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {sellerEditPassenger.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Trajeto:</span>
                <span className="font-semibold text-emerald-800 truncate max-w-[200px]">
                  {sellerEditPassenger.origin} → {sellerEditPassenger.destination}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span className="text-slate-500 font-medium">Vendedor Atual:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/70 text-amber-900 font-bold text-[11px]">
                  <Tag className="w-3 h-3 text-amber-700" />
                  <span>{sellerEditPassenger.seller}</span>
                </span>
              </div>
            </div>

            {/* Seller Input Form */}
            <form onSubmit={handleSaveSellerEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Vendedor da Passagem *
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customSellerInput}
                    onChange={(e) => setCustomSellerInput(e.target.value.toUpperCase())}
                    placeholder="Digite o nome do vendedor..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase tracking-wide placeholder:normal-case transition"
                  />
                </div>
              </div>

              {/* Quick Suggestions from existing sellers */}
              {suggestedSellers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Vendedores frequentes (clique para preencher):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSellers.map((sellerName) => (
                      <button
                        key={sellerName}
                        type="button"
                        onClick={() => setCustomSellerInput(sellerName.toUpperCase())}
                        className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition cursor-pointer ${
                          customSellerInput.toUpperCase() === sellerName.toUpperCase()
                            ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sellerName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSellerEditPassenger(null);
                    setIsPullingAfterSellerEdit(false);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer order-3 sm:order-1"
                >
                  Cancelar
                </button>

                {isPullingAfterSellerEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddPassengerToDaily(sellerEditPassenger.id);
                      setSellerEditPassenger(null);
                      setIsPullingAfterSellerEdit(false);
                    }}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer order-2"
                    title="Puxar mantendo o vendedor cadastrado originalmente"
                  >
                    Manter Vendedor Atual
                  </button>
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer order-1 sm:order-3 inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isPullingAfterSellerEdit
                      ? 'Confirmar e Puxar com Este Vendedor'
                      : 'Salvar Novo Vendedor'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5B: ALTERAR TRAJETO (CIDADE DE ORIGEM E DESTINO NA LISTA DO DIA)    */}
      {/* ========================================================================= */}
      {routeEditPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Definir Trajeto da Viagem
                  </h3>
                  <p className="text-xs text-slate-500">
                    Origem e Destino são obrigatórios na Lista do Dia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRouteEditPassenger(null);
                  setRouteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner if any */}
            {routeError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{routeError}</span>
              </div>
            )}

            {/* Passenger Info Summary Box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cliente:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {routeEditPassenger.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Vendedor:</span>
                <span className="font-semibold text-slate-800">
                  {routeEditPassenger.seller || 'BALCÃO'}
                </span>
              </div>
            </div>

            {/* Route Form */}
            <form onSubmit={handleSaveRouteEdit} className="space-y-3">
              {/* Origem */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cidade de Origem *</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Obrigatório
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={routeOriginInput}
                  onChange={(e) => setRouteOriginInput(e.target.value.toUpperCase())}
                  placeholder="Ex: São Paulo"
                  autoFocus
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 uppercase transition"
                />
                {suggestedOrigins.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {suggestedOrigins.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRouteOriginInput(s)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 rounded text-[10px] cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destino */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-950 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cidade de Destino *</span>
                  </label>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                    Obrigatório
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={routeDestinationInput}
                  onChange={(e) => setRouteDestinationInput(e.target.value.toUpperCase())}
                  placeholder="Ex: Rio de Janeiro"
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-rose-600 focus:ring-1 focus:ring-rose-600 uppercase transition"
                />
                {suggestedDestinations.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {suggestedDestinations.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRouteDestinationInput(s)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-rose-100 text-slate-700 rounded text-[10px] cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRouteEditPassenger(null);
                    setRouteError(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Trajeto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ALTERAR VENDEDOR EM LOTE (SELEÇÃO MÚLTIPLA AO PUXAR)             */}
      {/* ========================================================================= */}
      {isBulkSellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Alterar Vendedor dos Selecionados
                  </h3>
                  <p className="text-xs text-slate-500">
                    Definir vendedor para {selectedToPull.length} cliente(s) selecionado(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkSellerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBulkPullWithSeller} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendedor para Todos os {selectedToPull.length} Selecionados *
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={bulkSellerInput}
                    onChange={(e) => setBulkSellerInput(e.target.value.toUpperCase())}
                    placeholder="Digite o nome do vendedor..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase tracking-wide placeholder:normal-case transition"
                  />
                </div>
              </div>

              {/* Suggestions */}
              {suggestedSellers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Vendedores frequentes (clique para preencher):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSellers.map((sellerName) => (
                      <button
                        key={sellerName}
                        type="button"
                        onClick={() => setBulkSellerInput(sellerName.toUpperCase())}
                        className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition cursor-pointer ${
                          bulkSellerInput.toUpperCase() === sellerName.toUpperCase()
                            ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sellerName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkSellerModalOpen(false)}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer order-2 sm:order-1 text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5 order-1 sm:order-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Puxar Todos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
