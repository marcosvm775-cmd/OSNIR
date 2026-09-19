import React, { useState } from 'react';
import { X, Car, User, MapPin, Tag, Copy, Check, Share2, FileDown, UserMinus, RotateCcw } from 'lucide-react';
import { Driver, Passenger, CompanyConfig } from '../types';
import { generateDriverTripPdf } from '../utils/pdfGenerator';

interface DriverManifestModalProps {
  driver: Driver | null;
  passengers: Passenger[];
  isOpen: boolean;
  onClose: () => void;
  onUnallocatePassenger?: (passengerId: string) => void;
  onClearDriverPassengers?: (driverId: string) => void;
  companyConfig?: CompanyConfig;
}

export const DriverManifestModal: React.FC<DriverManifestModalProps> = ({
  driver,
  passengers,
  isOpen,
  onClose,
  onUnallocatePassenger,
  onClearDriverPassengers,
  companyConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen || !driver) return null;

  const driverPassengers = passengers.filter((p) => p.driverId === driver.id);

  const generateManifestText = () => {
    let text = `🚐 *MANIFESTO DE EMBARQUE*\n`;
    text += `👤 *Motorista:* ${driver.fullName}\n`;
    text += `👥 *Total de Passageiros:* ${driverPassengers.length}\n`;
    text += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `-------------------------------\n`;

    if (driverPassengers.length === 0) {
      text += `Nenhum passageiro vinculado a esta viagem ainda.\n`;
    } else {
      driverPassengers.forEach((p, idx) => {
        text += `\n*${idx + 1}. ${p.fullName}*\n`;
        text += `   📍 Origem: ${p.origin}\n`;
        text += `   🏁 Destino: ${p.destination}\n`;
        text += `   🏷️ Vendedor: ${p.seller}\n`;
      });
    }

    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateManifestText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar texto', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateManifestText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    generateDriverTripPdf(driver, passengers, companyConfig);
  };

  return (
    <div
      id="driver-manifest-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="driver-manifest-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manifest-title"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-emerald-800 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Car className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 id="manifest-title" className="font-bold text-base leading-tight">
                Manifesto de Viagem
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                Motorista: <span className="text-white font-bold">{driver.fullName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-lg transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar inside modal */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-semibold text-slate-700">
            {driverPassengers.length} {driverPassengers.length === 1 ? 'passageiro' : 'passageiros'} nesta viagem
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              title="Baixar em PDF oficial"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition active:scale-95 cursor-pointer"
              title="Copiar lista para colar"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Passenger list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {driverPassengers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhum passageiro vinculado</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Na Lista Geral, aloque os passageiros para <strong>{driver.fullName}</strong> para que apareçam neste manifesto.
              </p>
            </div>
          ) : (
            driverPassengers.map((p, index) => (
              <div
                key={p.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{p.fullName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-medium">
                      Vendedor: {p.seller}
                    </span>
                    {onUnallocatePassenger && (
                      <button
                        type="button"
                        onClick={() => onUnallocatePassenger(p.id)}
                        className="inline-flex items-center gap-1 text-[10px] text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded font-semibold cursor-pointer transition"
                        title="Retirar passageiro deste motorista (permanece seguro na Lista Geral)"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Desalocar</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-600 block">Origem:</span>
                    <span className="font-medium text-slate-800">{p.origin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-600 block">Destino:</span>
                    <span className="font-medium text-slate-800">{p.destination}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onClearDriverPassengers && driverPassengers.length > 0 && (
              isConfirmingClear ? (
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300">
                  <span className="text-[11px] font-semibold text-amber-900">Zerar passageiros deste motorista?</span>
                  <button
                    onClick={() => {
                      onClearDriverPassengers(driver.id);
                      setIsConfirmingClear(false);
                      onClose();
                    }}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded cursor-pointer transition"
                  >
                    Sim, Zerar
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-2 py-0.5 text-slate-600 hover:text-slate-800 text-[11px] font-medium cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition active:scale-95 cursor-pointer"
                  title="Desvincular todos os passageiros deste motorista (permanecem salvos na Lista Geral e no histórico de Viagens)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Zerar Passageiros</span>
                </button>
              )
            )}
            <p className="text-[11px] text-slate-500 italic hidden sm:block">
              * Desvincular passageiros mantém os dados salvos na Lista Geral e nas Viagens.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer ml-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
