import React, { useState } from 'react';
import { User, MapPin, Flag, ArrowRight, Tag, Car, Trash2, Edit3, Share2, UserCheck, Check, X, CalendarDays } from 'lucide-react';
import { Passenger, Driver } from '../types';

interface PassengerCardProps {
  passenger: Passenger;
  driver?: Driver;
  drivers: Driver[];
  onEdit: (passenger: Passenger) => void;
  onDelete: (id: string) => void;
  onSelectDriverManifest?: (driverId: string) => void;
  onQuickAllocateDriver: (passengerId: string, driverId: string) => void;
  onOpenAllocationModal: (passenger: Passenger) => void;
  onUpdateOrigin?: (passengerId: string, newOrigin: string) => void;
  onUpdateDestination: (passengerId: string, newDestination: string) => void;
  onUpdateSeller?: (passengerId: string, newSeller: string) => void;
  onAddToDailyList?: (passengerId: string) => void;
  isInDailyList?: boolean;
}

export const PassengerCard: React.FC<PassengerCardProps> = ({
  passenger,
  driver,
  drivers,
  onEdit,
  onDelete,
  onSelectDriverManifest,
  onQuickAllocateDriver,
  onOpenAllocationModal,
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

  const handleCancelOrigin = () => {
    setOriginInput(passenger.origin);
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

  const handleCancelDestination = () => {
    setDestinationInput(passenger.destination);
    setIsEditingDestination(false);
  };

  return (
    <div
      id={`passenger-card-${passenger.id}`}
      className={`bg-white rounded-2xl border-2 transition-all p-3.5 sm:p-4 relative shadow-2xs hover:shadow-xs ${
        driver ? 'border-slate-300' : 'border-amber-400 bg-amber-50/25'
      }`}
    >
      {/* Header: Passenger Name and actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
              driver
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-100 border-amber-400 text-amber-800'
            }`}
          >
            {passenger.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {passenger.fullName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">Passageiro</span>
              {!driver && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-md border border-amber-300">
                  Aguardando Motorista
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onAddToDailyList && (
            <button
              onClick={() => onAddToDailyList(passenger.id)}
              title={isInDailyList ? 'Já adicionado à Lista do Dia' : 'Puxar para a Lista do Dia'}
              className={`p-1.5 rounded-lg transition cursor-pointer border-2 ${
                isInDailyList
                  ? 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold'
                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border-transparent hover:border-emerald-200'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleShareWhatsApp}
            title="Compartilhar detalhes no WhatsApp"
            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border-2 border-transparent hover:border-emerald-200"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(passenger)}
            title="Editar cadastro completo"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer border-2 border-transparent hover:border-slate-300"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(passenger.id)}
            title="Excluir passageiro da lista geral"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer border-2 border-transparent hover:border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campos Separados: Cidade de Origem e Cidade de Destino */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Campo 1: Cidade de Origem */}
        <div className="p-2.5 bg-emerald-50/40 rounded-xl border-2 border-emerald-300/80 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-emerald-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold">
                Cidade de Origem
              </span>
            </div>
            {!isEditingOrigin && (
              <button
                type="button"
                onClick={() => {
                  setOriginInput(passenger.origin);
                  setIsEditingOrigin(true);
                }}
                className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer transition"
                title="Alterar cidade de origem"
              >
                <Edit3 className="w-3 h-3 inline" />
              </button>
            )}
          </div>

          {isEditingOrigin ? (
            <form onSubmit={handleSaveOrigin} className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value.toUpperCase())}
                placeholder="Origem..."
                autoFocus
                className="text-xs px-2 py-1 bg-white border-2 border-emerald-500 rounded-md text-slate-900 font-semibold focus:outline-none w-full uppercase"
              />
              <button
                type="submit"
                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                title="Salvar origem"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleCancelOrigin}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
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
              className="font-bold text-slate-900 truncate block w-full text-left hover:text-emerald-700 hover:underline cursor-pointer text-xs"
              title="Clique para alterar a cidade de origem"
            >
              {passenger.origin}
            </button>
          )}
        </div>

        {/* Campo 2: Cidade de Destino */}
        <div className="p-2.5 bg-rose-50/40 rounded-xl border-2 border-rose-300/80 shadow-2xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 text-rose-800">
              <Flag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold">
                Cidade de Destino
              </span>
            </div>
            {!isEditingDestination && (
              <button
                type="button"
                onClick={() => {
                  setDestinationInput(passenger.destination);
                  setIsEditingDestination(true);
                }}
                className="text-slate-400 hover:text-rose-700 p-0.5 rounded cursor-pointer transition"
                title="Alterar cidade de destino"
              >
                <Edit3 className="w-3 h-3 inline" />
              </button>
            )}
          </div>

          {isEditingDestination ? (
            <form onSubmit={handleSaveDestination} className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value.toUpperCase())}
                placeholder="Destino..."
                autoFocus
                className="text-xs px-2 py-1 bg-white border-2 border-rose-500 rounded-md text-slate-900 font-semibold focus:outline-none w-full uppercase"
              />
              <button
                type="submit"
                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                title="Salvar destino"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleCancelDestination}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
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
              className="font-bold text-rose-950 truncate block w-full text-left hover:text-rose-700 hover:underline cursor-pointer text-xs"
              title="Clique para alterar a cidade de destino"
            >
              {passenger.destination}
            </button>
          )}
        </div>
      </div>

      {/* Seller info */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-1.5 flex-1 min-w-0">
          <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] text-slate-500 shrink-0">Vendedor:</span>

          {isEditingSeller ? (
            <form onSubmit={handleSaveSeller} className="flex items-center gap-1">
              <input
                type="text"
                value={sellerInput}
                onChange={(e) => setSellerInput(e.target.value.toUpperCase())}
                placeholder="Novo vendedor..."
                autoFocus
                className="text-xs px-2 py-0.5 bg-white border border-amber-500 rounded-md text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 uppercase"
              />
              <button
                type="submit"
                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                title="Salvar novo vendedor"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSellerInput(passenger.seller);
                  setIsEditingSeller(false);
                }}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-1">
              <span className="font-semibold text-slate-700 text-[11px] bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                {passenger.seller}
              </span>
              {onUpdateSeller && (
                <button
                  type="button"
                  onClick={() => {
                    setSellerInput(passenger.seller);
                    setIsEditingSeller(true);
                  }}
                  className="text-slate-400 hover:text-amber-800 p-0.5 rounded cursor-pointer transition"
                  title="Alterar vendedor desta passagem"
                >
                  <Edit3 className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Driver Allocation Section */}
      <div className="mt-2.5 pt-2.5 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 flex-1 min-w-0">
          <span className="text-slate-600 font-semibold shrink-0">Motorista:</span>
          {driver ? (
            <button
              onClick={() => onSelectDriverManifest && onSelectDriverManifest(driver.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-lg font-bold hover:bg-emerald-100 transition cursor-pointer truncate"
              title="Ver manifesto de passageiros deste motorista"
            >
              <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{driver.fullName}</span>
            </button>
          ) : (
            <span className="text-amber-800 font-semibold text-[11px] bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
              Ainda não destinado
            </span>
          )}
        </div>

        {/* Quick Driver Allocation selector or button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              value={passenger.driverId || ''}
              onChange={(e) => onQuickAllocateDriver(passenger.id, e.target.value)}
              className="text-xs font-semibold py-1 pl-2 pr-6 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Mudar ou retirar motorista deste passageiro (não exclui da Lista Geral)"
            >
              <option value="">{driver ? 'Retirar motorista' : 'Alocar motorista...'}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  Alocar: {d.fullName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          <button
            onClick={() => onOpenAllocationModal(passenger)}
            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-300 rounded-lg transition cursor-pointer"
            title="Abrir painel de alocação"
          >
            <UserCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
