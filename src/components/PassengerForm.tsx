import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, MapPin, Flag, Tag, Car, PlusCircle, CheckCircle, AlertCircle, Sparkles, ArrowDownRight, Database, X } from 'lucide-react';
import { Driver, Passenger } from '../types';

interface PassengerFormProps {
  drivers: Driver[];
  passengers?: Passenger[];
  onSavePassenger: (passenger: Passenger) => void;
  onOpenDriverModal: () => void;
  editingPassenger?: Passenger | null;
  onCancelEdit?: () => void;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  drivers,
  passengers = [],
  onSavePassenger,
  onOpenDriverModal,
  editingPassenger,
  onCancelEdit,
}) => {
  const [fullName, setFullName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [seller, setSeller] = useState('');
  const [driverId, setDriverId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoPulledNotice, setAutoPulledNotice] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing passengers in database matching the typed name
  const matchedPassengers = useMemo(() => {
    const query = fullName.trim().toLowerCase();
    if (!query || query.length < 2 || editingPassenger) return [];
    return passengers.filter((p) => p.fullName.toLowerCase().includes(query)).slice(0, 5);
  }, [fullName, passengers, editingPassenger]);

  // Exact match detection
  const exactMatchPassenger = useMemo(() => {
    const query = fullName.trim().toLowerCase();
    if (!query || query.length < 3 || editingPassenger) return null;
    return passengers.find((p) => p.fullName.trim().toLowerCase() === query) || null;
  }, [fullName, passengers, editingPassenger]);

  // Handle auto-pulling data from an existing passenger in the database
  const handleAutoPullPassenger = (p: Passenger) => {
    setFullName(p.fullName);
    setOrigin(p.origin);
    setDestination(p.destination);
    setSeller(p.seller);
    if (p.driverId) {
      setDriverId(p.driverId);
    }
    setIsSuggestionsOpen(false);
    setAutoPulledNotice(`Cliente "${p.fullName}" já cadastrado na base! Os dados de rota e vendedor foram preenchidos automaticamente.`);
  };

  // Populate form if editing
  useEffect(() => {
    if (editingPassenger) {
      setFullName(editingPassenger.fullName);
      setOrigin(editingPassenger.origin);
      setDestination(editingPassenger.destination);
      setSeller(editingPassenger.seller);
      setDriverId(editingPassenger.driverId || '');
    } else {
      setFullName('');
      setOrigin('');
      setDestination('');
      setSeller('');
      setDriverId('');
    }
  }, [editingPassenger]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const trimmedSeller = seller.trim();

    if (!trimmedName) {
      setError('Informe o nome completo do cliente / passageiro.');
      return;
    }
    if (!trimmedOrigin) {
      setError('Informe a origem da viagem.');
      return;
    }
    if (!trimmedDestination) {
      setError('Informe o destino da viagem.');
      return;
    }
    if (!trimmedSeller) {
      setError('Informe o vendedor da passagem.');
      return;
    }

    const passengerData: Passenger = {
      id: editingPassenger ? editingPassenger.id : `pass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: trimmedName.toUpperCase(),
      origin: trimmedOrigin.toUpperCase(),
      destination: trimmedDestination.toUpperCase(),
      seller: trimmedSeller.toUpperCase(),
      driverId: driverId || '',
      createdAt: editingPassenger ? editingPassenger.createdAt : new Date().toISOString(),
    };

    onSavePassenger(passengerData);

    setSuccess(
      editingPassenger
        ? 'Passageiro atualizado com sucesso!'
        : driverId
        ? 'Passageiro cadastrado e destinado ao motorista!'
        : 'Passageiro salvo na Lista Geral! Você pode alocar o motorista na lista.'
    );
    
    if (!editingPassenger) {
      setFullName('');
      setOrigin('');
      setDestination('');
      setSeller('');
      setDriverId('');
    }

    setTimeout(() => {
      setSuccess('');
      if (editingPassenger && onCancelEdit) {
        onCancelEdit();
      }
    }, 1200);
  };

  return (
    <div id="passenger-form-container" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-slate-800 rounded-lg text-emerald-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base leading-tight">
              {editingPassenger ? 'Editar Passageiro' : 'Cadastro de Cliente Passageiro'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {editingPassenger ? 'Atualize as informações da viagem' : 'Preencha os dados e destine o motorista'}
            </p>
          </div>
        </div>

        {editingPassenger && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
        {error && (
          <div
            id="passenger-form-error"
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            id="passenger-form-success"
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Auto Pulled from Database Notice */}
        {autoPulledNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{autoPulledNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoPulledNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Nome Completo com Busca Flutuante e Detecção de Base */}
        <div className="relative" ref={suggestionsRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="passenger-fullname-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Nome Completo do Passageiro *</span>
            </label>
            {!editingPassenger && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Busca automática na base</span>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              id="passenger-fullname-input"
              type="text"
              value={fullName}
              onFocus={() => setIsSuggestionsOpen(true)}
              onChange={(e) => {
                setFullName(e.target.value);
                setIsSuggestionsOpen(true);
                setAutoPulledNotice(null);
              }}
              placeholder="Ex: Carlos Eduardo de Oliveira"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 placeholder-slate-400"
              autoComplete="off"
            />
            {fullName && (
              <button
                type="button"
                onClick={() => {
                  setFullName('');
                  setIsSuggestionsOpen(false);
                  setAutoPulledNotice(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* BARRA DE BUSCA FLUTUANTE (DROPDOWN AUTOCOMPLETE) */}
          {isSuggestionsOpen && matchedPassengers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-emerald-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Cliente(s) já encontrado(s) na base de dados:
                </span>
                <span className="text-emerald-700 text-[10px] font-normal">
                  Clique para puxar dados
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto">
                {matchedPassengers.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => handleAutoPullPassenger(match)}
                    className="p-3 hover:bg-emerald-50/50 cursor-pointer transition flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                          {match.fullName}
                        </p>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium shrink-0">
                          Na base
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        <span className="text-emerald-700 font-medium">{match.origin}</span> → <span className="text-rose-600 font-medium">{match.destination}</span>
                        {match.seller && <span className="text-slate-400"> • Vend: {match.seller}</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoPullPassenger(match);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition active:scale-95 cursor-pointer inline-flex items-center gap-1 shadow-xs"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Puxar Dados</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Exact Match Callout */}
          {exactMatchPassenger && !autoPulledNotice && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Atenção:</strong> "{exactMatchPassenger.fullName}" já está cadastrado na base!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAutoPullPassenger(exactMatchPassenger)}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
              >
                Puxar Dados Automaticamente
              </button>
            </div>
          )}
        </div>

        {/* 2. Campos Separados: Cidade de Origem e Cidade de Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-50/30 rounded-xl border-2 border-emerald-200">
            <label
              htmlFor="passenger-origin-input"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5"
            >
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Cidade de Origem *</span>
            </label>
            <input
              id="passenger-origin-input"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ex: São Paulo - SP"
              className="w-full px-3.5 py-2.5 text-sm bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 transition text-slate-900 font-semibold placeholder-slate-400"
            />
          </div>

          <div className="p-3 bg-rose-50/30 rounded-xl border-2 border-rose-200">
            <label
              htmlFor="passenger-destination-input"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-950 mb-1.5"
            >
              <Flag className="w-4 h-4 text-rose-600" />
              <span>Cidade de Destino *</span>
            </label>
            <input
              id="passenger-destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Belo Horizonte - MG"
              className="w-full px-3.5 py-2.5 text-sm bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-rose-600 transition text-slate-900 font-semibold placeholder-slate-400"
            />
          </div>
        </div>

        {/* 3. Vendedor da Passagem */}
        <div>
          <label
            htmlFor="passenger-seller-input"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Vendedor da Passagem *</span>
          </label>
          <input
            id="passenger-seller-input"
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="Ex: Maria Vendedora / Guichê Central / Agência 01"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 placeholder-slate-400"
          />
        </div>

          {/* 4. Destinar para qual motorista ele irá viajar (opcional no cadastro, alocável a qualquer momento na Lista Geral) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="passenger-driver-select"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              <Car className="w-3.5 h-3.5 text-emerald-600" />
              <span>Motorista da Viagem (Alocação)</span>
            </label>
            <button
              id="passenger-form-quick-add-driver-btn"
              type="button"
              onClick={onOpenDriverModal}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Motorista</span>
            </button>
          </div>

          {drivers.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <span>Nenhum motorista cadastrado ainda. O passageiro será salvo na Lista Geral.</span>
              <button
                type="button"
                onClick={onOpenDriverModal}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition cursor-pointer"
              >
                Cadastrar Agora
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                id="passenger-driver-select"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 font-medium appearance-none cursor-pointer"
              >
                <option value="">
                  Deixar sem motorista (Alocar depois pela Lista Geral)
                </option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    Alocar para: {drv.fullName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            Você pode alocar o motorista agora ou diretamente na Lista Geral de Passageiros.
          </p>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            id="passenger-form-submit-btn"
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{editingPassenger ? 'Salvar Alterações' : 'Cadastrar e Destinar Passageiro'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
