import React, { useState } from 'react';
import { UserCheck, Car, Users, PlusCircle, Trash2, FileText, FileDown, RotateCcw } from 'lucide-react';
import { Driver, Passenger, CompanyConfig } from '../types';
import { generateDriverTripPdf } from '../utils/pdfGenerator';

interface DriverListProps {
  drivers: Driver[];
  passengers: Passenger[];
  onOpenAddDriver: () => void;
  onDeleteDriver: (id: string) => void;
  onClearDriverPassengers: (driverId: string) => void;
  onViewManifest: (driver: Driver) => void;
  companyConfig?: CompanyConfig;
}

export const DriverList: React.FC<DriverListProps> = ({
  drivers,
  passengers,
  onOpenAddDriver,
  onDeleteDriver,
  onClearDriverPassengers,
  onViewManifest,
  companyConfig,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [driverToClear, setDriverToClear] = useState<Driver | null>(null);

  const getPassengerCountForDriver = (driverId: string) => {
    return passengers.filter((p) => p.driverId === driverId).length;
  };

  const handleDownloadPdf = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    generateDriverTripPdf(driver, passengers, companyConfig);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Guia do Motorista
          </h2>
          <p className="text-xs text-slate-500">
            Gerencie motoristas e gere o PDF com a lista de passageiros
          </p>
        </div>
        <button
          id="driver-list-add-btn"
          onClick={onOpenAddDriver}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer border-2 border-emerald-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Motorista</span>
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Nenhum motorista cadastrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-4">
            Cadastre um motorista com o nome completo para destinar os passageiros e emitir o PDF da viagem.
          </p>
          <button
            onClick={onOpenAddDriver}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer border-2 border-emerald-700"
          >
            <UserCheck className="w-4 h-4" />
            <span>Cadastrar Primeiro Motorista</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {drivers.map((driver) => {
            const count = getPassengerCountForDriver(driver.id);
            const isConfirming = confirmDeleteId === driver.id;

            return (
              <div
                key={driver.id}
                id={`driver-row-${driver.id}`}
                className="bg-white rounded-2xl border-2 border-slate-300 shadow-2xs p-4 flex flex-col gap-3 hover:border-slate-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border-2 border-emerald-300">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {driver.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border-2 border-slate-200 px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{count} {count === 1 ? 'passageiro' : 'passageiros'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for delete */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border-2 border-rose-300">
                      <button
                        onClick={() => {
                          onDeleteDriver(driver.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 bg-rose-600 text-white text-[11px] font-bold rounded hover:bg-rose-700 transition cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-slate-600 text-[11px] hover:text-slate-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(driver.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border-2 border-transparent hover:border-rose-200"
                      title="Excluir motorista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Primary Button Bar: PDF generator, View manifest, and Zerar Passageiros */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t-2 border-slate-200">
                  <button
                    id={`btn-generate-pdf-${driver.id}`}
                    onClick={(e) => handleDownloadPdf(driver, e)}
                    className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer border-2 border-emerald-900"
                    title="Baixar PDF da viagem com nome completo, origem, destino e vendedor da passagem"
                  >
                    <FileDown className="w-4 h-4 text-emerald-200" />
                    <span>Gerar PDF</span>
                  </button>

                  <button
                    onClick={() => onViewManifest(driver)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer border-2 border-slate-300"
                    title="Ver manifesto na tela"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ver</span>
                  </button>

                  <button
                    id={`btn-clear-passengers-${driver.id}`}
                    onClick={() => setDriverToClear(driver)}
                    disabled={count === 0}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer border-2 ${
                      count === 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200/60 cursor-not-allowed opacity-60'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 active:scale-95'
                    }`}
                    title={
                      count === 0
                        ? 'Nenhum passageiro vinculado a este motorista no momento'
                        : 'Zerar passageiros deste motorista (mantém clientes na Lista Geral e no histórico de viagens)'
                    }
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Zerar Passageiros</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal to Clear Driver Passengers */}
      {driverToClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Zerar Passageiros do Motorista
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Motorista: <strong className="text-slate-800">{driverToClear.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
              <p className="text-slate-700 leading-relaxed">
                Esta ação irá desvincular os <strong>{getPassengerCountForDriver(driverToClear.id)} passageiro(s)</strong> deste motorista para liberá-lo para uma nova escala de viagem.
              </p>

              <div className="pt-2 border-t border-slate-200 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-start gap-1.5 text-emerald-800">
                  <span className="font-bold text-emerald-600 shrink-0">✓</span>
                  <span><strong>Lista Geral Preservada:</strong> Os clientes NÃO serão excluídos do sistema. Eles continuarão disponíveis na Lista Geral para novas destinações.</span>
                </div>
                <div className="flex items-start gap-1.5 text-emerald-800">
                  <span className="font-bold text-emerald-600 shrink-0">✓</span>
                  <span><strong>Histórico de Viagens Preservado:</strong> Todas as viagens já cadastradas na guia Viagens continuarão salvas com seus passageiros para relatórios e controle.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDriverToClear(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-clear-passengers"
                onClick={() => {
                  onClearDriverPassengers(driverToClear.id);
                  setDriverToClear(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sim, Zerar Passageiros</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

