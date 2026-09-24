import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  Calendar,
  RefreshCw,
  Phone,
  MessageCircle,
} from 'lucide-react';
import {
  getMachineFingerprint,
  validateProductKey,
  activateProduct,
  getStoredLicense,
  getTrialStatus,
  revokeLicense,
  exportLicenseCertificate,
  getLicenseExpiryDetails,
} from '../utils/license';
import { ProductLicense } from '../types';
import { AdminLicenseGenerator } from './AdminLicenseGenerator';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseUpdated?: (license: ProductLicense | null) => void;
  initialShowGenerator?: boolean;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onLicenseUpdated,
  initialShowGenerator = false,
}) => {
  const [activeLicense, setActiveLicense] = useState<ProductLicense | null>(null);
  const [machineId, setMachineId] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [slotNumber, setSlotNumber] = useState<1 | 2 | 3>(1);
  const [machineLabel, setMachineLabel] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminClickCount, setAdminClickCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  const trialStatus = getTrialStatus();

  useEffect(() => {
    if (isOpen) {
      const lic = getStoredLicense();
      setActiveLicense(lic);
      const hwid = getMachineFingerprint();
      setMachineId(hwid);
      setErrorMessage('');
      setSuccessMessage('');
      setIsAdminUnlocked(false);
      setShowAdminPinPrompt(false);
      setIsRenewing(false);
      if (lic) {
        setClientName(lic.licenseeName);
        setInputKey('');
        setSlotNumber(lic.currentSlot);
      }
    }
  }, [isOpen, initialShowGenerator]);

  if (!isOpen) return null;

  const expiryDetails = getLicenseExpiryDetails(activeLicense);

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleShieldHeaderClick = () => {
    const next = adminClickCount + 1;
    setAdminClickCount(next);
    if (next >= 5) {
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
      alert('Senha mestra incorreta.');
    }
  };

  const handleActivate = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!inputKey.trim()) {
      setErrorMessage('Por favor, informe a chave de produto.');
      return;
    }

    const validation = validateProductKey(inputKey);
    if (!validation.valid) {
      setErrorMessage(validation.message);
      return;
    }

    const result = activateProduct(
      inputKey,
      clientName || 'Empresa Licenciada',
      slotNumber,
      machineLabel || `Computador Instalação #${slotNumber}`
    );

    if (result.success && result.license) {
      setActiveLicense(result.license);
      setSuccessMessage(result.message);
      setIsRenewing(false);
      if (onLicenseUpdated) onLicenseUpdated(result.license);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleRevoke = () => {
    if (window.confirm('Tem certeza que deseja desvincular a licença deste computador? Esta máquina voltará a ficar bloqueada até ser inserida uma nova chave.')) {
      revokeLicense();
      setActiveLicense(null);
      setInputKey('');
      setSuccessMessage('Licença desvinculada com sucesso desta máquina.');
      if (onLicenseUpdated) onLicenseUpdated(null);
    }
  };

  const handleApplyGeneratedKey = (key: string, name: string) => {
    setInputKey(key);
    setClientName(name);
    setIsAdminUnlocked(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              onClick={handleShieldHeaderClick}
              title="OSNIR TURISMO"
              className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 cursor-default select-none active:scale-95 transition"
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Licença do Sistema
                {activeLicense ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {expiryDetails.planLabel}
                  </span>
                ) : trialStatus.isTrialActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Demonstração: {trialStatus.daysRemaining} de {trialStatus.totalDays} dias restantes
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    Demonstração Expirada (Bloqueado)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300">
                Gerenciamento de Ativação, Periodicidade e Máquinas Autorizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Identificador da Máquina */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <Laptop className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Código deste Dispositivo (Hardware ID):
                </span>
                <code className="text-xs font-mono font-extrabold text-slate-800">
                  {machineId}
                </code>
              </div>
            </div>
            <button
              onClick={handleCopyMachineId}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer self-start sm:self-auto"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId ? 'Copiado!' : 'Copiar ID'}</span>
            </button>
          </div>

          {/* Cartão de Suporte Oficial / Pedido de Chave */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold block text-slate-900">Suporte Oficial & Emissão de Chaves</span>
                <span className="text-[11px] text-amber-900">WhatsApp: <strong className="font-bold text-slate-900">(37) 9 9124-3101</strong></span>
              </div>
            </div>
            <a
              href={`https://wa.me/5537991243101?text=${encodeURIComponent(
                `Olá! Preciso de uma chave de ativação para o Osnir Turismo. Código da minha máquina: ${machineId}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition self-start sm:self-auto text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar pelo WhatsApp</span>
            </a>
          </div>

          {/* Se o produto já estiver ativado e NÃO estiver no modo de renovação */}
          {activeLicense && !isRenewing ? (
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-950">
                    Software Licenciado & Totalmente Liberado!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Licença ativa para uso comercial oficial da sua agência ou guichê.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-semibold">EMPRESA LICENCIADA:</span>
                  <span className="text-slate-900 font-extrabold text-sm">{activeLicense.licenseeName}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-semibold">SLOT DESTA MÁQUINA:</span>
                  <span className="text-emerald-700 font-extrabold text-sm">
                    Instalação {activeLicense.currentSlot} de {activeLicense.maxInstallations} Computadores
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-semibold">PLANO CONTRATADO:</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {expiryDetails.planLabel}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-semibold">VALIDADE DA LICENÇA:</span>
                  {activeLicense.expiresAt ? (
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {expiryDetails.formattedExpiry} ({expiryDetails.daysRemaining} dias restantes)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-extrabold text-sm">Permanente / Vitalícia</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs">
                <span className="text-slate-400 block text-[10px] font-semibold mb-0.5">CHAVE DE ATIVAÇÃO REGISTRADA:</span>
                <code className="font-mono font-black text-slate-800 text-sm tracking-wide">
                  {activeLicense.productKey}
                </code>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => setIsRenewing(true)}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renovar ou Inserir Nova Chave</span>
                </button>

                <button
                  onClick={exportLicenseCertificate}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Certificado (.json)</span>
                </button>

                <button
                  onClick={handleRevoke}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Desvincular deste Computador</span>
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Ativação / Renovação */
            <div className="space-y-4">
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center justify-between text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    {isRenewing ? 'Renovação de Licença' : 'Ativação Oficial do Software'}
                  </span>
                  {isRenewing && (
                    <button
                      type="button"
                      onClick={() => setIsRenewing(false)}
                      className="text-xs text-slate-600 hover:underline font-normal cursor-pointer"
                    >
                      Cancelar renovação
                    </button>
                  )}
                </div>
                <p>
                  Insira a chave oficial fornecida na compra (Planos <strong>Mensal</strong>, <strong>Semestral</strong>, <strong>Anual</strong> ou <strong>Vitalícia</strong>). Cada chave autoriza até 3 máquinas simultâneas.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Chave do Produto (Product Key):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                      placeholder="OT26M-XXXX-YYYY-ZZZZ-3S"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal uppercase"
                    />
                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nome da Empresa Compradora:
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: OSNIR TURISMO"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Qual computador é este? (1 a 3):
                    </label>
                    <select
                      value={slotNumber}
                      onChange={(e) => setSlotNumber(parseInt(e.target.value) as 1 | 2 | 3)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-sm font-semibold text-slate-900 bg-white"
                    >
                      <option value={1}>Computador 1 de 3 (Principal / Servidor)</option>
                      <option value={2}>Computador 2 de 3 (Agência / Vendas)</option>
                      <option value={3}>Computador 3 de 3 (Guichê / Terminal)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Identificação desta Máquina (Opcional):
                  </label>
                  <input
                    type="text"
                    value={machineLabel}
                    onChange={(e) => setMachineLabel(e.target.value)}
                    placeholder="Ex: Notebook da Recepção"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-sm text-slate-900"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                onClick={handleActivate}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isRenewing ? 'SALVAR E APLICAR RENOVAÇÃO' : 'ATIVAR PRODUTO NESTE COMPUTADOR'}</span>
              </button>
            </div>
          )}

          {/* Prompt de Senha do Administrador (apenas se clicar 5x no ícone do escudo) */}
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
                  placeholder="PIN Mestre"
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
              <AdminLicenseGenerator onApplyKey={handleApplyGeneratedKey} />
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Sistema OSNIR TURISMO • Licenciamento V2.5</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
