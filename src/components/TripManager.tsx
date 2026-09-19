import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Flag,
  Car,
  Users,
  PlusCircle,
  FileDown,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowRight,
  UserCheck,
  UserPlus,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Trip, Driver, Passenger, CompanyConfig } from '../types';
import { generateTripOfficialPdf } from '../utils/pdfGenerator';

interface TripManagerProps {
  trips: Trip[];
  drivers: Driver[];
  passengers: Passenger[];
  onSaveTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenAddDriver: () => void;
  onNavigateToNewPassenger: () => void;
  companyConfig?: CompanyConfig;
}

export const TripManager: React.FC<TripManagerProps> = ({
  trips,
  drivers,
  passengers,
  onSaveTrip,
  onDeleteTrip,
  onOpenAddDriver,
  onNavigateToNewPassenger,
  companyConfig,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Form fields
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [expandedTripIds, setExpandedTripIds] = useState<Record<string, boolean>>({});

  // Filter passengers belonging to the currently selected driver or already part of the editing trip
  const driverPassengers = React.useMemo(() => {
    if (!selectedDriverId) return [];
    const editingTrip = trips.find((t) => t.id === editingTripId);
    return passengers.filter((p) => {
      if (p.driverId === selectedDriverId) return true;
      if (editingTrip && editingTrip.driverId === selectedDriverId && editingTrip.passengerIds?.includes(p.id)) {
        return true;
      }
      return false;
    });
  }, [passengers, selectedDriverId, editingTripId, trips]);

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    if (!driverId) {
      setSelectedPassengerIds([]);
      return;
    }

    const assignedPassengerIds = passengers
      .filter((p) => p.driverId === driverId)
      .map((p) => p.id);

    setSelectedPassengerIds(assignedPassengerIds);
  };

  const handleOpenNewForm = () => {
    setEditingTripId(null);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    const firstOrigin = passengers[0]?.origin || '';
    const firstDest = passengers[0]?.destination || '';
    setOrigin(firstOrigin);
    setDestination(firstDest);

    if (drivers.length > 0) {
      const defaultDriver = drivers[0].id;
      setSelectedDriverId(defaultDriver);
      const defaultPassengers = passengers
        .filter((p) => p.driverId === defaultDriver)
        .map((p) => p.id);
      setSelectedPassengerIds(defaultPassengers);
    } else {
      setSelectedDriverId('');
      setSelectedPassengerIds([]);
    }

    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTripId(trip.id);
    setDate(trip.date);
    setOrigin(trip.origin);
    setDestination(trip.destination);
    setSelectedDriverId(trip.driverId);
    const validPassengerIds = (trip.passengerIds || []).filter((id) => {
      const p = passengers.find((pass) => pass.id === id);
      return p !== undefined;
    });
    setSelectedPassengerIds(validPassengerIds);
    setFormError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePassengerSelection = (passengerId: string) => {
    setSelectedPassengerIds((prev) =>
      prev.includes(passengerId)
        ? prev.filter((id) => id !== passengerId)
        : [...prev, passengerId]
    );
  };

  const handleSelectAllDriverPassengers = () => {
    if (!selectedDriverId) return;
    const ids = passengers
      .filter((p) => p.driverId === selectedDriverId)
      .map((p) => p.id);
    setSelectedPassengerIds(ids);
  };

  const handleClearPassengerSelection = () => {
    setSelectedPassengerIds([]);
  };

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds((prev) => ({
      ...prev,
      [tripId]: prev[tripId] === false ? true : false,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim()) {
      setFormError('Informe a data da viagem.');
      return;
    }
    if (!origin.trim()) {
      setFormError('Informe a origem da viagem.');
      return;
    }
    if (!destination.trim()) {
      setFormError('Informe o destino da viagem.');
      return;
    }
    if (!selectedDriverId) {
      setFormError('Selecione o motorista desta viagem.');
      return;
    }

    const tripData: Trip = {
      id: editingTripId || `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: date.trim(),
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      driverId: selectedDriverId,
      passengerIds: selectedPassengerIds,
      createdAt: new Date().toISOString(),
    };

    onSaveTrip(tripData);
    setIsFormOpen(false);
  };

  const driverMap = React.useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  const primaryColor = companyConfig?.primaryColor || '#065f46';

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Compass className="w-4 h-4" />
            </div>
            <span>Guia de Viagens</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Planejamento de rotas, alocação de motoristas, lista de passageiros e emissão de relatórios oficiais em PDF com as cores da sua empresa.
          </p>
        </div>

        <button
          id="btn-new-trip"
          onClick={handleOpenNewForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Programar Nova Viagem</span>
        </button>
      </div>

      {/* Creation / Editing Form Inline Box */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-lg animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {editingTripId ? 'Alterar Dados da Viagem' : 'Programar Nova Viagem'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preencha as informações para organizar a escala e os passageiros
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field: Data */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data da Viagem <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Field 1: Cidade de Origem */}
              <div className="p-2.5 bg-emerald-50/30 rounded-xl border-2 border-emerald-200">
                <label className="flex items-center gap-1 text-xs font-bold text-emerald-950 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cidade de Origem <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ex: SÃO PAULO - SP"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-bold text-slate-800 uppercase placeholder:normal-case placeholder:font-normal"
                />
              </div>

              {/* Field 2: Cidade de Destino */}
              <div className="p-2.5 bg-rose-50/30 rounded-xl border-2 border-rose-200">
                <label className="flex items-center gap-1 text-xs font-bold text-rose-950 mb-1">
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cidade de Destino <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ex: RIO DE JANEIRO - RJ"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-rose-600 font-bold text-slate-800 uppercase placeholder:normal-case placeholder:font-normal"
                />
              </div>
            </div>

            {/* Field: Motorista */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Motorista Responsável <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenAddDriver}
                  className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Cadastrar Novo Motorista</span>
                </button>
              </div>

              {drivers.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <span>Nenhum motorista cadastrado ainda. Cadastre um condutor primeiro.</span>
                  <button
                    type="button"
                    onClick={onOpenAddDriver}
                    className="font-bold underline ml-2 cursor-pointer"
                  >
                    + Cadastrar
                  </button>
                </div>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Selecione o Motorista --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Field: Seleção de Passageiros */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Passageiros desta Viagem ({selectedPassengerIds.length} selecionados)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Passageiros alocados para este motorista. Marque ou desmarque conforme a viagem:
                  </span>
                </div>

                {driverPassengers.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllDriverPassengers}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer text-[11px]"
                    >
                      Marcar Todos ({driverPassengers.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearPassengerSelection}
                      className="text-slate-500 font-medium hover:underline cursor-pointer text-[11px]"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              {driverPassengers.length === 0 ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>Nenhum passageiro atribuído a este motorista ainda</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Na <strong>Lista Geral</strong> ou na <strong>Lista do Dia</strong>, destine passageiros ao motorista escolhido ou cadastre um novo cliente.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToNewPassenger}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline cursor-pointer pt-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Cadastrar Novo Passageiro</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 border-2 border-slate-200 rounded-xl p-2 bg-slate-50/60">
                  {driverPassengers.map((p) => {
                    const isSelected = selectedPassengerIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg border-2 text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePassengerSelection(p.id)}
                            className="w-4 h-4 text-emerald-600 rounded border-2 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="block truncate font-bold text-slate-900">
                              {p.fullName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {p.origin} → {p.destination} • Vendedor: {p.seller}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-300">
                            Do motorista
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-4 h-4" />
                <span>{editingTripId ? 'Atualizar Viagem' : 'Salvar Viagem'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trips List with ENHANCED BORDERS & DISTINCT SEPARATION */}
      {trips.length === 0 && !isFormOpen ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Nenhuma viagem programada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-4">
            Crie sua primeira viagem definindo <strong>Data</strong>, <strong>Origem</strong>, <strong>Destino</strong> e <strong>Motorista</strong> para agrupar passageiros e emitir o relatório em PDF.
          </p>
          <button
            onClick={handleOpenNewForm}
            className="px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Programar Primeira Viagem</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {trips.map((trip, index) => {
            const driver = driverMap.get(trip.driverId);
            const tripPassengers = passengers.filter((p) => trip.passengerIds.includes(p.id));
            const isExpanded = expandedTripIds[trip.id] !== false; // Default expanded

            // Format Brazilian date
            let displayDate = trip.date;
            if (trip.date && trip.date.includes('-')) {
              const parts = trip.date.split('-');
              if (parts.length === 3) {
                displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
            }

            const tripNumberStr = String(index + 1).padStart(2, '0');

            return (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border-2 border-slate-300/90 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative"
              >
                {/* Trip Top Ribbon & Sequence Number */}
                <div className="bg-slate-50/90 px-4 sm:px-6 py-3.5 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {/* Badge: Viagem #01 */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wider shadow-2xs">
                      <span>VIAGEM #{tripNumberStr}</span>
                    </div>

                    {/* Date Pill */}
                    <div className="flex items-center space-x-1.5 px-3 py-1 bg-white rounded-xl border-2 border-slate-300 text-slate-800 text-xs font-bold shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{displayDate}</span>
                    </div>

                    <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border-2 border-emerald-300">
                      Escala Oficial
                    </span>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => generateTripOfficialPdf(trip, driver, passengers, companyConfig)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-xs transition active:scale-95 cursor-pointer border-2 border-emerald-950"
                      title="Gerar Relatório Oficial desta Viagem em PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Imprimir PDF</span>
                    </button>
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition border-2 border-slate-300 cursor-pointer"
                      title="Alterar viagem"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Alterar</span>
                    </button>
                    <button
                      onClick={() => setTripToDelete(trip)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 text-xs font-bold rounded-xl transition border-2 border-rose-300 cursor-pointer"
                      title="Excluir viagem"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

                {/* Trip Route Card Box */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Campos Separados: Cidade de Origem e Cidade de Destino */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-300/80 shadow-2xs">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Cidade de Origem</span>
                      </span>
                      <span className="font-black text-slate-900 text-sm sm:text-base truncate block mt-1">
                        {trip.origin}
                      </span>
                    </div>

                    <div className="p-3.5 bg-rose-50/60 rounded-2xl border-2 border-rose-300/80 shadow-2xs">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-800 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Cidade de Destino</span>
                      </span>
                      <span className="font-black text-rose-950 text-sm sm:text-base truncate block mt-1">
                        {trip.destination}
                      </span>
                    </div>
                  </div>

                  {/* Driver and Total Passengers Info Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Motorista Escalado
                        </span>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                          <Car className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="truncate">{driver ? driver.fullName : 'Não definido'}</span>
                        </div>
                      </div>
                      {driver?.phone && (
                        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg font-semibold">
                          {driver.phone}
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Total de Passageiros
                        </span>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                          <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{tripPassengers.length} cliente(s)</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
                        {tripPassengers.length} assentos
                      </span>
                    </div>
                  </div>

                  {/* Passenger Manifest Accordion / Table */}
                  <div className="pt-3 border-t-2 border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Passageiros Embarcados Nesta Viagem:
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold border border-slate-300">
                          {tripPassengers.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleTripExpand(trip.id)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Recolher Lista' : 'Expandir Lista'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div>
                        {tripPassengers.length === 0 ? (
                          <div className="p-3 bg-amber-50/80 border-2 border-amber-300 rounded-xl text-xs text-amber-800">
                            Nenhum passageiro atribuído a esta viagem. Clique em "Alterar" para selecionar clientes.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {tripPassengers.map((p, idx) => (
                              <div
                                key={p.id}
                                className="bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-300 text-xs flex items-center justify-between transition hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="truncate">
                                    <span className="font-bold text-slate-900 block truncate">
                                      {p.fullName}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-900 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                        <MapPin className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                                        <span>Origem: {p.origin}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-900 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                                        <Flag className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                        <span>Destino: {p.destination}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] px-2 py-0.5 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-md">
                                    Vendedor: {p.seller}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Excluir Viagem</h3>
                <p className="text-xs text-slate-500">Esta ação removerá esta rota do histórico.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <p className="text-slate-600">
                <strong className="text-slate-800">Rota:</strong> {tripToDelete.origin} &rarr; {tripToDelete.destination}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-800">Data:</strong> {tripToDelete.date}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTrip(tripToDelete.id);
                  setTripToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Viagem</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
