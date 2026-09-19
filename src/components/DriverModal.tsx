import React, { useState } from 'react';
import { X, UserCheck, CheckCircle2 } from 'lucide-react';
import { Driver } from '../types';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDriver: (driver: Driver) => void;
  existingDrivers: Driver[];
}

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  onClose,
  onSaveDriver,
  existingDrivers,
}) => {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError('Por favor, informe o nome completo do motorista.');
      return;
    }

    if (trimmed.length < 3) {
      setError('O nome do motorista deve conter ao menos 3 caracteres.');
      return;
    }

    const alreadyExists = existingDrivers.some(
      (d) => d.fullName.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setError('Já existe um motorista cadastrado com este nome.');
      return;
    }

    const newDriver: Driver = {
      id: `drv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: trimmed.toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    onSaveDriver(newDriver);
    setSuccessMsg('Motorista cadastrado com sucesso!');
    setFullName('');
    setError('');

    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  return (
    <div
      id="driver-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="driver-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-modal-title"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="bg-emerald-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <UserCheck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 id="driver-modal-title" className="font-bold text-base leading-tight">
                Cadastro de Motorista
              </h2>
              <p className="text-xs text-emerald-100/80">
                Informe o nome completo do motorista
              </p>
            </div>
          </div>
          <button
            id="driver-modal-close-btn"
            onClick={onClose}
            className="text-emerald-200 hover:text-white hover:bg-emerald-600/60 rounded-lg p-1.5 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div
              id="driver-modal-error"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              id="driver-modal-success"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="driver-fullname-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Nome Completo do Motorista *
            </label>
            <input
              id="driver-fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Roberto Carlos de Oliveira"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-800 placeholder-slate-400"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Obrigatório para destinar os passageiros nas viagens.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              id="driver-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="driver-modal-save-btn"
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Salvar Motorista</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
