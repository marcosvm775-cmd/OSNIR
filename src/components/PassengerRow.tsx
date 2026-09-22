import React, { useState } from 'react';
import {
  MapPin,
  Flag,
  ArrowRight,
  Tag,
  Car,
  Trash2,
  Edit3,
  Share2,
  Check,
  X,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { Passenger, Driver } from '../types';

interface PassengerRowProps {
  index: number;
  passenger: Passenger;
  driver?: Driver;
  drivers: Driver[];
  onEdit: (passenger: Passenger) => void;
  onDelete: (id: string) => void;
  onQuickAllocateDriver: (passengerId: string, driverId: string) => void;
  onUpdateOrigin?: (passengerId: string, newOrigin: string) => void;
  onUpdateDestination: (passengerId: string, newDestination: string) => void;
  onUpdateSeller?: (passengerId: string, newSeller: string) => void;
  onAddToDailyList?: (passengerId: string) => void;
  isInDailyList?: boolean;
}

export const PassengerRow: React.FC<PassengerRowProps> = ({
  index,
  passenger,
  driver,
  drivers,
  onEdit,
  onDelete,
  onQuickAllocateDriver,
  onUpdateOrigin,
  onUpdateDestination,
  onUpdateSeller,
  onAddToDailyList,
  isInDailyList = false,
}) => {
  // Inline edit state for origin
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);
  const [originInput, setOriginInput] = useState(passenger.origin);

  // Inline edit state for destination
  const [isEditingDestination, setIsEditingDestination] = useState(false);
  const [destinationInput, setDestinationInput] = useState(passenger.destination);

  // Inline edit state for seller
  const [isEditingSeller, setIsEditingSeller] = useState(false);
  const [sellerInput, setSellerInput] = useState(passenger.seller);

  const handleShareWhatsApp = () => {
    const text = `*COMPROVANTE DE EMBARQUE - TRANSPORTE*\n👤 *Passageiro:* ${passenger.fullName}\n📍 *Origem:* ${passenger.origin}\n🏁 *Destino:* ${passenger.destination}\n🏷️ *Vendedor:* ${passenger.seller}\n🚐 *Motorista:* ${driver ? driver.fullName : 'Não informado'}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = originInput.trim().toUpperCase();
    if (trimmed && trimmed !== passenger.origin && onUpdateOrigin) {
      onUpdateOrigin(passenger.id, trimmed);
    }
    setIsEditingOrigin(false);
  };

  const handleSaveDestination = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = destinationInput.trim().toUpperCase();
    if (trimmed && trimmed !== passenger.destination) {
      onUpdateDestination(passenger.id, trimmed);
    }
    setIsEditingDestination(false);
  };

  const handleSaveSeller = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sellerInput.trim().toUpperCase();
    if (trimmed && trimmed !== passenger.seller && onUpdateSeller) {
      onUpdateSeller(passenger.id, trimmed);
    }
    setIsEditingSeller(false);
  };

  return (
    <div
      id={`passenger-row-${passenger.id}`}
      className={`group bg-white hover:bg-emerald-50/25 border-2 transition-all duration-150 rounded-xl p-2.5 sm:px-3 sm:py-2 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3.5 shadow-2xs hover:shadow-xs hover:border-emerald-500 ${
        driver ? 'border-slate-300' : 'border-amber-400 bg-amber-50/25'
      }`}
    >
      {/* Top / Main Line: Index + Client Name + Action Buttons (on mobile) */}
      <div className="flex items-center justify-between gap-2 w-full md:w-auto md:min-w-[180px] md:max-w-xs xl:max-w-sm flex-1">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span
            className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 border-2 ${
              driver
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-900 border-amber-400'
            }`}
            title={driver ? `Motorista: ${driver.fullName}` : 'Aguardando Motorista'}
          >
            {index}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4
                className="font-bold text-slate-900 truncate text-xs sm:text-[13px] leading-tight"
                title={passenger.fullName}
              >
                {passenger.fullName}
              </h4>
              {!driver && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                  title="Sem motorista alocado"
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons for Mobile Screen */}
        <div className="flex items-center gap-1 shrink-0 md:hidden">
          <button
            onClick={handleShareWhatsApp}
            title="WhatsApp"
            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(passenger)}
            title="Editar"
            className="p-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(passenger.id)}
            title="Excluir"
            className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row of Details / Chips on Mobile & Tablet */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
        {/* Campo 1: Cidade de Origem */}
        <div className="flex items-center gap-1 shrink-0 bg-emerald-50/60 border border-emerald-300 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs">
          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-tight">Origem:</span>

          {isEditingOrigin ? (
            <form onSubmit={handleSaveOrigin} className="flex items-center gap-1">
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value.toUpperCase())}
                placeholder="Origem..."
                autoFocus
                className="text-[11px] px-1 py-0.2 bg-white border border-emerald-500 rounded font-semibold text-slate-900 focus:outline-none w-24 uppercase"
              />
              <button
                type="submit"
                className="p-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                title="Salvar"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOriginInput(passenger.origin);
                  setIsEditingOrigin(false);
                }}
                className="p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOriginInput(passenger.origin);
                setIsEditingOrigin(true);
              }}
              className="font-bold text-slate-800 max-w-[100px] truncate hover:underline hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
              title="Clique para alterar a cidade de origem"
            >
              <span className="truncate">{passenger.origin}</span>
              <Edit3 className="w-2.5 h-2.5 text-emerald-600/70 shrink-0" />
            </button>
          )}
        </div>

        {/* Campo 2: Cidade de Destino */}
        <div className="flex items-center gap-1 shrink-0 bg-rose-50/60 border border-rose-300 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs">
          <Flag className="w-3 h-3 text-rose-600 shrink-0" />
          <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-tight">Destino:</span>

          {isEditingDestination ? (
            <form onSubmit={handleSaveDestination} className="flex items-center gap-1">
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value.toUpperCase())}
                placeholder="Destino..."
                autoFocus
                className="text-[11px] px-1 py-0.2 bg-white border border-rose-500 rounded font-semibold text-slate-900 focus:outline-none w-24 uppercase"
              />
              <button
                type="submit"
                className="p-0.5 bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                title="Salvar"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDestinationInput(passenger.destination);
                  setIsEditingDestination(false);
                }}
                className="p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDestinationInput(passenger.destination);
                setIsEditingDestination(true);
              }}
              className="font-bold text-rose-950 max-w-[110px] truncate hover:underline hover:text-rose-700 cursor-pointer flex items-center gap-0.5"
              title="Clique para alterar a cidade de destino"
            >
              <span className="truncate">{passenger.destination}</span>
              <Edit3 className="w-2.5 h-2.5 text-rose-500/70 shrink-0" />
            </button>
          )}
        </div>

        {/* Col 3: Seller Badge with inline quick edit */}
        <div className="shrink-0">
          {isEditingSeller ? (
            <form onSubmit={handleSaveSeller} className="flex items-center gap-1">
              <input
                type="text"
                value={sellerInput}
                onChange={(e) => setSellerInput(e.target.value.toUpperCase())}
                placeholder="Vendedor..."
                autoFocus
                className="text-[11px] px-1 py-0.2 bg-white border border-amber-500 rounded font-semibold text-slate-900 focus:outline-none w-24 uppercase"
              />
              <button
                type="submit"
                className="p-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSellerInput(passenger.seller);
                  setIsEditingSeller(false);
                }}
                className="p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSellerInput(passenger.seller);
                setIsEditingSeller(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold transition cursor-pointer"
              title="Clique para alterar o vendedor"
            >
              <Tag className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="max-w-[95px] truncate">VEND: {passenger.seller}</span>
              <Edit3 className="w-2.5 h-2.5 text-amber-700 opacity-60 shrink-0 ml-0.5" />
            </button>
          )}
        </div>

        {/* Col 4: Driver Selector Dropdown */}
        <div className="shrink-0 flex items-center gap-1">
          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={passenger.driverId || ''}
            onChange={(e) => onQuickAllocateDriver(passenger.id, e.target.value)}
            className={`text-[11px] font-semibold py-1 px-2 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 transition max-w-[125px] sm:max-w-[140px] truncate ${
              driver
                ? 'bg-emerald-50/90 text-emerald-900 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Selecione para definir ou alterar o motorista"
          >
            <option value="">A Definir</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Col 5: Daily List Status & Quick Pull Button */}
        <div className="shrink-0">
          {onAddToDailyList && (
            <button
              type="button"
              onClick={() => onAddToDailyList(passenger.id)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer border ${
                isInDailyList
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-300 shadow-2xs'
              }`}
              title={isInDailyList ? 'Cliente já está agendado na Lista do Dia' : 'Adicionar este cliente à Lista do Dia'}
            >
              {isInDailyList ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Na Lista</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>+ P/ Dia</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons on Tablet / Desktop */}
      <div className="hidden md:flex items-center gap-1 shrink-0 ml-auto">
        <button
          onClick={handleShareWhatsApp}
          title="Enviar comprovante no WhatsApp"
          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-transparent hover:border-emerald-200"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onEdit(passenger)}
          title="Editar dados completos do passageiro"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-transparent hover:border-slate-300"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(passenger.id)}
          title="Excluir da lista geral"
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
