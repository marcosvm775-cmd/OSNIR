import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Laptop,
  Copy,
  Check,
  Phone,
  AlertCircle,
  Clock,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { getMachineFingerprint, validateProductKey, activateProduct, getStoredLicense, getLicenseExpiryDetails } from '../utils/license';
import { ProductLicense } from '../types';
import { AdminLicenseGenerator } from './AdminLicenseGenerator';

interface TrialExpiredLockProps {
  onLicenseActivated: (license: ProductLicense) => void;
  companyName?: string;
  supportPhone?: string;
}

export const TrialExpiredLock: React.FC<TrialExpiredLockProps> = ({
  onLicenseActivated,
  companyName = 'OSNIR TURISMO',
  supportPhone = '(37) 99124-3101',
}) => {
  const machineId = getMachineFingerprint();
  const [productKey, setProductKey] = useState('');
  const [licenseeName, setLicenseeName] = useState(companyName);
  const [slotNumber, setSlotNumber] = useState<1 | 2 | 3>(1);
  const [machineLabel, setMachineLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Verifica se o usuário tinha uma licença que expirou
  const rawLicense = (() => {
    try {
      const raw = localStorage.getItem('sys_product_license_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const expiryDetails = getLicenseExpiryDetails(rawLicense);
  const isExpiredPlan = rawLicense && rawLicense.expiresAt && expiryDetails.isExpired;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  const handleCadeadoClick = () => {
    const nextCount = adminClickCount + 1;
    setAdminClickCount(nextCount);
    if (nextCount >= 5) {
      setShowAdminPinPrompt(true);
      setAdminClickCount(0);
    }
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'osnir2026' || adminPin === 'admin2026') {
      setIsAdminUnlocked(true);
      setShowAdminPinPrompt(false);
      setAdminPin('');
    } else {
      alert('Senha mestra de administrador incorreta.');
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!productKey.trim()) {
      setErrorMessage('Por favor, digite a Chave de Ativação do produto.');
      return;
    }

    const validation = validateProductKey(productKey);
    if (!validation.valid) {
      setErrorMessage(validation.message);
      return;
    }

    const result = activateProduct(
      productKey,
      licenseeName || companyName,
      slotNumber,
      machineLabel || `Computador #${slotNumber}`
    );

    if (result.success && result.license) {
      onLicenseActivated(result.license);
    } else {
      setErrorMessage(result.message || 'Falha ao ativar a chave.');
    }
  };

  const handleApplyFromAdmin = (key: string, name: string) => {
    setProductKey(key);
    if (name) setLicenseeName(name);
    setIsAdminUnlocked(false);
  };

  // Limpa caracteres do telefone para link do WhatsApp
  const rawDigits = (supportPhone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.length >= 10 ? rawDigits : '37991243101';
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá! Preciso de uma chave de ativação para o Osnir Turismo. Código da minha máquina: ${machineId}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-4 border-rose-500 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Danger / Lock Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-800 text-white p-5 sm:p-6 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div
            onClick={handleCadeadoClick}
            title="OSNIR TURISMO"
            className="w-16 h-16 bg-white/15 border-2 border-white/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md cursor-default select-none active:scale-95 transition"
          >
            <Lock className="w-9 h-9 text-white animate-bounce" />
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 border border-white/30 text-rose-200 text-xs font-black tracking-wide uppercase mb-1">
            <Clock className="w-3.5 h-3.5" /> {isExpiredPlan ? 'Licença Periódica Expirada' : 'Período de Demonstração Expirado'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            {isExpiredPlan ? `Plano ${expiryDetails.planLabel} Expirado` : 'Demonstração de 10 Dias Encerrada'}
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-md mx-auto">
            {isExpiredPlan
              ? `Sua assinatura expirou em ${expiryDetails.formattedExpiry}. Para continuar utilizando o sistema, insira sua nova chave de renovação.`
              : 'O período gratuito de testes de 10 dias deste computador expirou. Para continuar utilizando o sistema, insira sua chave de ativação oficial.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Machine HWID Box */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <Laptop className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                  Código Deste Computador / Celular:
                </span>
                <code className="text-xs font-mono font-black text-slate-900 truncate block">
                  {machineId}
                </code>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyHwid}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition shrink-0 flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
            >
              {copiedHwid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHwid ? 'Copiado!' : 'Copiar ID'}</span>
            </button>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3.5">
            <div>
              <label className="text-xs font-black text-slate-800 uppercase block mb-1">
                Chave de Ativação / Renovação:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={productKey}
                  onChange={(e) => setProductKey(e.target.value.toUpperCase())}
                  placeholder="OT26M-XXXX-YYYY-ZZZZ-3S"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 font-mono font-black text-slate-900 uppercase text-sm placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Aceita chaves dos planos: <strong>Mensal</strong>, <strong>Semestral</strong>, <strong>Anual</strong> ou <strong>Vitalícia</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome da Empresa / Cliente:
                </label>
                <input
                  type="text"
                  value={licenseeName}
                  onChange={(e) => setLicenseeName(e.target.value)}
                  placeholder="Ex: OSNIR TURISMO"
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 focus:border-rose-500 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Qual Computador é Este? (1 a 3):
                </label>
                <select
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 focus:border-rose-500 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value={1}>Computador #1 (Principal)</option>
                  <option value={2}>Computador #2 (Agência / Vendas)</option>
                  <option value={3}>Computador #3 (Guichê / Terminal)</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Desbloquear e Ativar Sistema</span>
            </button>
          </form>

          {/* Quick instructions & Contact WhatsApp */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
            <div className="font-extrabold flex items-center justify-between text-amber-950">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>Precisa adquirir ou renovar sua chave?</span>
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {companyName}
              </span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Entre em contato com o suporte comercial para receber sua chave oficial nos planos <strong>Mensal</strong>, <strong>Semestral</strong> ou <strong>Anual</strong>.
            </p>
            <div className="pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar Chave pelo WhatsApp ({supportPhone || '(37) 99124-3101'})</span>
              </a>
            </div>
          </div>

          {/* Secret Master PIN Prompt (Aparece somente após 5 cliques secretos no cadeado) */}
          {showAdminPinPrompt && (
            <form onSubmit={handleUnlockAdmin} className="p-3 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-700">
              <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>Painel Técnico do Desenvolvedor</span>
                <button
                  type="button"
                  onClick={() => setShowAdminPinPrompt(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="PIN Mestre de Administrador"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </form>
          )}

          {isAdminUnlocked && (
            <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-amber-500/40">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400">Modo de Manutenção do Dono</span>
                <button
                  type="button"
                  onClick={() => setIsAdminUnlocked(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Fechar
                </button>
              </div>
              <AdminLicenseGenerator onApplyKey={handleApplyFromAdmin} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
