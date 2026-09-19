import React, { useState } from 'react';
import { X, Car, UserCheck, Check, AlertCircle } from 'lucide-react';
import { Passenger, Driver } from '../types';

interface DriverAllocationModalProps {
  passenger: Passenger | null;
  drivers: Driver[];
  isOpen: boolean;
  onClose: () => void;
  onAllocateDriver: (passengerId: string, driverId: string) => void;
  onOpenAddDriver: () => void;
}

export const DriverAllocationModal: React.FC<DriverAllocationModalProps> = ({
  passenger,
  drivers,
  isOpen,
  onClose,
  onAllocateDriver,
  onOpenAddDriver,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  React.useEffect(() => {
    if (passenger) {
      setSelectedDriverId(passenger.driverId || '');
    }
  }, [passenger, isOpen]);

  if (!isOpen || !passenger) return null;

  const handleSave = () => {
    onAllocateDriver(passenger.id, selectedDriverId);
    onClose();
  };

  return (
    <div
      id="driver-allocation-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="driver-allocation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-allocation-title"
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="bg-emerald-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 border border-emerald-500/30 flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 id="driver-allocation-title" className="font-bold text-sm leading-tight">
                Alocar Motorista
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-medium truncate max-w-[200px]">
                {passenger.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg p-1.5 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Passenger details card summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Passageiro:</span>
              <span className="font-bold text-slate-900">{passenger.fullName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Origem:</span>
              <span className="font-semibold text-slate-800">{passenger.origin}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Destino:</span>
              <span className="font-semibold text-slate-800">{passenger.destination}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="text-slate-500 font-medium">Vendedor:</span>
              <span className="font-semibold text-slate-800">{passenger.seller}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Selecione o Motorista da Viagem:
            </label>

            {drivers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                <p>Nenhum motorista cadastrado no momento.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddDriver();
                  }}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cadastrar Motorista Agora
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDriverId('')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    selectedDriverId === ''
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="italic">Sem motorista alocado (Aguardando)</span>
                  {selectedDriverId === '' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>

                {drivers.map((driver) => {
                  const isSelected = selectedDriverId === driver.id;
                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{driver.fullName}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            Confirmar Alocação
          </button>
        </div>
      </div>
    </div>
  );
};
