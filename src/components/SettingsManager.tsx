import React, { useState, useRef } from 'react';
import {
  Settings,
  Building2,
  Image as ImageIcon,
  Palette,
  Upload,
  Trash2,
  AlertTriangle,
  Download,
  Database,
  Users,
  Car,
  Compass,
  CalendarDays,
  CheckCircle2,
  ShieldAlert,
  Info,
  X,
  FileCheck,
  RotateCcw,
  Sparkles,
  Phone,
  FileText,
  Save,
  Eye,
  KeyRound,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Passenger, Driver, Trip, FinancialConfig, CompanyConfig } from '../types';
import { getAllDataExport, DEFAULT_COMPANY_CONFIG } from '../utils/storage';
import { AdminLicenseGenerator } from './AdminLicenseGenerator';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsManagerProps {
  passengers: Passenger[];
  drivers: Driver[];
  trips: Trip[];
  dailyLists: Record<string, string[]>;
  financialConfig: FinancialConfig;
  companyConfig: CompanyConfig;
  onSaveCompanyConfig: (config: CompanyConfig) => void;
  onClearAllData: (resetFinancial: boolean) => void;
  onOpenLicenseModal?: () => void;
  onOpenDatabaseModal?: () => void;
}

const COLOR_PRESETS = [
  {
    name: 'Esmeralda Turismo (Padrão)',
    primary: '#065f46',
    secondary: '#047857',
    accent: '#10b981',
  },
  {
    name: 'Azul Real Executivo',
    primary: '#1e3a8a',
    secondary: '#1d4ed8',
    accent: '#38bdf8',
  },
  {
    name: 'Vinho Nobre & Ouro',
    primary: '#831843',
    secondary: '#9d174d',
    accent: '#f59e0b',
  },
  {
    name: 'Grafite Executivo',
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#64748b',
  },
  {
    name: 'Terracota Transporte',
    primary: '#9a3412',
    secondary: '#c2410c',
    accent: '#ea580c',
  },
  {
    name: 'Marrom & Âmbar Elegance',
    primary: '#78350f',
    secondary: '#92400e',
    accent: '#d97706',
  },
];

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  passengers,
  drivers,
  trips,
  dailyLists,
  financialConfig,
  companyConfig,
  onSaveCompanyConfig,
  onClearAllData,
  onOpenLicenseModal,
  onOpenDatabaseModal,
}) => {
  // Company configuration form state
  const [companyName, setCompanyName] = useState(companyConfig?.companyName || 'Osnir Turismo');
  const [logoUrl, setLogoUrl] = useState(companyConfig?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(companyConfig?.primaryColor || '#065f46');
  const [secondaryColor, setSecondaryColor] = useState(companyConfig?.secondaryColor || '#047857');
  const [accentColor, setAccentColor] = useState(companyConfig?.accentColor || '#10b981');
  const [phone, setPhone] = useState(companyConfig?.phone || '');
  const [cnpjOrCpf, setCnpjOrCpf] = useState(companyConfig?.cnpjOrCpf || '');

  // Clear data confirmation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationWord, setConfirmationWord] = useState('');
  const [resetFinancial, setResetFinancial] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dailyDatesCount = Object.keys(dailyLists).filter(
    (k) => Array.isArray(dailyLists[k]) && dailyLists[k].length > 0
  ).length;

  const showFeedback = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Handle Logo Upload from Local File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP ou SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
      showFeedback('Logomarca carregada com sucesso! Clique em "Salvar Configurações" para gravar.');
    };
    reader.onerror = () => {
      showFeedback('Falha ao ler o arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showFeedback('Logomarca removida. Clique em "Salvar Configurações" para confirmar.');
  };

  const handleApplyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    showFeedback(`Paleta "${preset.name}" selecionada! Clique em salvar.`);
  };

  const handleSaveAllCompanyConfig = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = companyName.trim() || 'Osnir Turismo';
    const newConfig: CompanyConfig = {
      companyName: trimmedName,
      logoUrl: logoUrl.trim(),
      primaryColor: primaryColor.trim() || '#065f46',
      secondaryColor: secondaryColor.trim() || '#047857',
      accentColor: accentColor.trim() || '#10b981',
      phone: phone.trim(),
      cnpjOrCpf: cnpjOrCpf.trim(),
    };

    onSaveCompanyConfig(newConfig);
    showFeedback('Configurações salvas! Nome, logomarca e cores aplicados ao app e a todos os PDFs.');
  };

  const handleRestoreDefaultBranding = () => {
    setCompanyName(DEFAULT_COMPANY_CONFIG.companyName);
    setLogoUrl(DEFAULT_COMPANY_CONFIG.logoUrl);
    setPrimaryColor(DEFAULT_COMPANY_CONFIG.primaryColor);
    setSecondaryColor(DEFAULT_COMPANY_CONFIG.secondaryColor);
    setAccentColor(DEFAULT_COMPANY_CONFIG.accentColor || '#10b981');
    setPhone(DEFAULT_COMPANY_CONFIG.phone || '');
    setCnpjOrCpf(DEFAULT_COMPANY_CONFIG.cnpjOrCpf || '');

    onSaveCompanyConfig(DEFAULT_COMPANY_CONFIG);
    showFeedback('Configurações visuais restauradas para os padrões originais!');
  };

  const handleExportBackup = () => {
    try {
      const data = getAllDataExport();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const today = new Date().toISOString().substring(0, 10);
      const safeName = (companyName || 'transporte').toLowerCase().replace(/\s+/g, '_');
      downloadAnchor.setAttribute('download', `backup_${safeName}_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showFeedback('Backup completo de todos os dados baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar backup', error);
      showFeedback('Não foi possível gerar o arquivo de backup.');
    }
  };

  const handleOpenModal = () => {
    setConfirmationWord('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmationWord('');
  };

  const isConfirmedValid = confirmationWord.trim().toUpperCase() === 'ZERAR';

  const handleExecuteClearAll = () => {
    if (!isConfirmedValid) return;
    onClearAllData(resetFinancial);
    handleCloseModal();
    showFeedback('Todos os dados foram zerados com sucesso!');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Configuração do Aplicativo & Identidade Visual
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  Personalização
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre o nome da empresa, logomarca oficial e as cores personalizadas que serão aplicadas no aplicativo e em todas as guias emitidas em PDF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenDatabaseModal && (
              <button
                type="button"
                id="btn-settings-database"
                onClick={onOpenDatabaseModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition active:scale-95 cursor-pointer"
                title="Status do banco de dados local"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Banco de Dados</span>
              </button>
            )}

            {onOpenLicenseModal && (
              <button
                type="button"
                id="btn-settings-license"
                onClick={onOpenLicenseModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition active:scale-95 cursor-pointer"
                title="Ativar ou Gerenciar Chave de Produto (Até 3 PCs)"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Ativação & Licença (3 PCs)</span>
              </button>
            )}

            <button
              type="button"
              id="btn-export-backup-top"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Exportar backup completo de todos os dados"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Fazer Backup (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO ESPECIAL DO ADMINISTRADOR / VENDEDOR: GERADOR DE CHAVES OFICIAIS */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Gerador de Chaves de Ativação do Sistema
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
                  Painel do Proprietário
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gere chaves oficiais autênticas para ativar e vender o software para seus clientes (cada chave autoriza até 3 computadores).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenLicenseModal && (
              <button
                type="button"
                onClick={onOpenLicenseModal}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ver Status da Licença</span>
              </button>
            )}
            {onOpenDatabaseModal && (
              <button
                type="button"
                onClick={onOpenDatabaseModal}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-600 flex items-center space-x-1.5 cursor-pointer"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Banco Local</span>
              </button>
            )}
          </div>
        </div>

        {/* Gerador de Chaves Embutido Diretamente na Tela */}
        <AdminLicenseGenerator />
      </div>

      {/* SEÇÃO 1: CADASTRO DA EMPRESA, LOGOMARCA E CORES */}
      <form
        onSubmit={handleSaveAllCompanyConfig}
        className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden"
      >
        {/* Form Title Strip */}
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                1. Dados da Empresa & Identidade Visual
              </h3>
              <p className="text-[11px] text-slate-500">
                Essas informações aparecem no cabeçalho do sistema e em todos os relatórios impressos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaultBranding}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200 cursor-pointer"
              title="Restaurar nome e cores padrão do sistema"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="submit"
              id="btn-save-company-config"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Row 1: Nome da Empresa, Telefone e CNPJ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <label htmlFor="company-name-input" className="block text-xs font-extrabold text-slate-800">
                Nome da Empresa / Fantasia <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="company-name-input"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: OSNIR TURISMO"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-bold text-slate-900 transition"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Aparece em destaque no topo do app e no título dos PDFs.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company-phone-input" className="block text-xs font-extrabold text-slate-800">
                Telefone / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="company-phone-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-8888"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 transition"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Contato exibido no rodapé ou cabeçalho dos relatórios.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company-doc-input" className="block text-xs font-extrabold text-slate-800">
                CNPJ ou CPF (Opcional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="company-doc-input"
                  type="text"
                  value={cnpjOrCpf}
                  onChange={(e) => setCnpjOrCpf(e.target.value)}
                  placeholder="Ex: 00.000.000/0001-00"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 transition"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Identificação fiscal nos relatórios oficiais.
              </p>
            </div>
          </div>

          {/* Row 2: Logomarca da Empresa (Upload & URL) */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Logomarca da Empresa</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Upload file + Direct URL input */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="logo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border-2 border-slate-300 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Carregar Imagem do Computador/Celular</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remover Logo</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="logo-url-input" className="block text-[11px] font-semibold text-slate-600">
                    Ou cole o link (URL) direto da imagem:
                  </label>
                  <input
                    id="logo-url-input"
                    type="text"
                    value={logoUrl.startsWith('data:') ? '(Imagem carregada via arquivo)' : logoUrl}
                    onChange={(e) => {
                      if (!e.target.value.startsWith('(Imagem')) {
                        setLogoUrl(e.target.value);
                      }
                    }}
                    placeholder="https://exemplo.com/sua-logo.png"
                    disabled={logoUrl.startsWith('data:')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-700 disabled:opacity-60"
                  />
                  <p className="text-[11px] text-slate-400">
                    Formatos aceitos: PNG, JPG, JPEG, SVG ou WEBP. A imagem será desenhada no canto superior esquerdo de todas as guias em PDF.
                  </p>
                </div>
              </div>

              {/* Logo Live Box Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex flex-col items-center justify-center text-center min-h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Pré-visualização da Logo
                </span>
                {logoUrl ? (
                  <div className="relative group p-2 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-full">
                    <img
                      src={logoUrl}
                      alt="Logomarca da Empresa"
                      className="max-h-16 max-w-44 object-contain mx-auto"
                      onError={() => {
                        showFeedback('Erro ao carregar a imagem. Verifique o arquivo ou link.');
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-200/80 flex items-center justify-center mb-1 text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      Nenhuma logomarca cadastrada
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Será utilizado o ícone padrão de transporte)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Cores do Aplicativo */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>Cores do Aplicativo e dos Relatórios PDF</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Escolha códigos Hexadecimais ou clique em uma das paletas prontas
              </span>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                Paletas Recomendadas de Transporte & Turismo (1 clique):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                    secondaryColor.toLowerCase() === preset.secondary.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2 rounded-xl text-left border-2 transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-800 truncate leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Cor Primária */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label htmlFor="input-primary-color" className="block text-xs font-bold text-slate-800">
                  Cor Primária
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="input-primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#065f46"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Barra superior do app e faixas principais do PDF.
                </p>
              </div>

              {/* Cor Secundária */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label htmlFor="input-secondary-color" className="block text-xs font-bold text-slate-800">
                  Cor Secundária
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="input-secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#047857"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Cabeçalhos de tabelas, cartões e divisões dos PDFs.
                </p>
              </div>

              {/* Cor de Destaque */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label htmlFor="input-accent-color" className="block text-xs font-bold text-slate-800">
                  Cor de Destaque
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="input-accent-color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#10b981"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Badges de status, realces e botões secundários.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-800 mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Simulação Visual ao Vivo (Como ficará no App e no PDF)</span>
            </h4>

            <div className="rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs">
              {/* Simulated Header */}
              <div
                className="px-4 py-3 text-white transition-colors duration-200"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {logoUrl ? (
                      <div className="h-9 w-12 bg-white/95 rounded-lg p-1 flex items-center justify-center shadow-xs">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm">
                        🚍
                      </div>
                    )}
                    <div>
                      <h5 className="font-black text-sm uppercase tracking-wide leading-none">
                        {companyName || 'NOME DA EMPRESA'}
                      </h5>
                      <span className="text-[10px] text-white/80 font-medium">
                        {phone ? `Contato: ${phone}` : 'Transporte e Turismo Profissional'}
                        {cnpjOrCpf ? ` • ${cnpjOrCpf}` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-2xs"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Exemplo no Cabeçalho
                  </span>
                </div>
              </div>

              {/* Simulated PDF Table bar */}
              <div
                className="px-4 py-2 text-white text-xs font-bold flex items-center justify-between transition-colors duration-200"
                style={{ backgroundColor: secondaryColor }}
              >
                <span>Relatório Oficial em PDF • Lista de Passageiros</span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded font-bold"
                  style={{ backgroundColor: accentColor, color: '#000000' }}
                >
                  Cor de Destaque
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRestoreDefaultBranding}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Restaurar Configurações Originais
            </button>

            <button
              type="submit"
              id="btn-save-company-config-bottom"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Todas as Configurações</span>
            </button>
          </div>
        </div>
      </form>

      {/* SEÇÃO 2: BANCO DE DADOS & ZONA DE SEGURANÇA */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              2. Armazenamento de Dados & Backup
            </h3>
            <p className="text-[11px] text-slate-500">
              Métricas do banco de dados local e ferramentas de segurança do sistema
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Current System Records Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Passageiros Salvos</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {passengers.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Na Lista Geral
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Viagens Registradas</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {trips.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Histórico de rotas
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Car className="w-3.5 h-3.5 text-amber-600" />
                <span>Motoristas Cadastrados</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {drivers.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Condutores ativos
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Listas Diárias</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {dailyDatesCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Datas com escalas
              </div>
            </div>
          </div>

          {/* VERSÃO PARA CELULAR (ANDROID & IPHONE) - BANCO 100% OFFLINE */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl border-2 border-emerald-500/40 p-5 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      Versão para Celular (Android & iOS)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                      100% Offline
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Banco de dados gravado diretamente na memória interna do seu smartphone, sem necessidade de sinal de internet.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="font-bold text-emerald-300 mb-1">📱 Celular Android (Chrome)</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Abra no Chrome, toque nos 3 pontinhos e selecione <strong>"Instalar Aplicativo"</strong>. O app ganha ícone próprio na sua tela inicial.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="font-bold text-emerald-300 mb-1">🍏 iPhone / iPad (Safari)</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Abra no Safari, toque em <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong> para usar como app nativo.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="font-bold text-emerald-300 mb-1">💾 Memória do Aparelho</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Todos os passageiros, motoristas, viagens e PDFs ficam guardados no próprio celular. Funciona no meio da estrada e em áreas rurais.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <PWAInstallButton variant="card" />
            </div>
          </div>

          {/* DANGER ZONE: ZERAR DADOS DO APP */}
          <div className="bg-rose-50/60 rounded-2xl border-2 border-rose-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-rose-950">
                    Zona de Segurança: Zerar Todos os Dados do Aplicativo
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wider">
                    Proteção Anti-Erro
                  </span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Esta área foi isolada nesta guia de <strong>Configuração</strong> para <strong>proteger suas informações contra cliques acidentais</strong>.
                  Ao acionar esta limpeza, todos os registros de passageiros, viagens, motoristas e listas diárias serão excluídos.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Faça o download do backup antes de zerar para não perder seus dados.</span>
              </div>

              <button
                type="button"
                id="btn-open-clear-data-modal"
                onClick={handleOpenModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar Todos os Dados do Aplicativo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO COM PROTEÇÃO ANTIERRO (SEM WINDOW.CONFIRM) */}
      {isModalOpen && (
        <div
          id="clear-data-confirmation-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-rose-900">
                <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">Confirmar Exclusão de Todos os Dados</h4>
                  <p className="text-[11px] text-rose-700 font-medium">Esta operação não pode ser desfeita</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Os seguintes registros serão completamente apagados:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li><strong>{passengers.length}</strong> passageiro(s) na Lista Geral</li>
                  <li><strong>{trips.length}</strong> viagem(ns) no histórico</li>
                  <li><strong>{drivers.length}</strong> motorista(s) cadastrado(s)</li>
                  <li><strong>{dailyDatesCount}</strong> data(s) com Lista do Dia</li>
                </ul>
              </div>

              {/* Reset Financial Configs Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={resetFinancial}
                  onChange={(e) => setResetFinancial(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <div className="text-[11px] text-slate-700 leading-tight">
                  <span className="font-bold block text-slate-800">Redefinir também valores e comissões</span>
                  Restaura o preço da passagem (R$ 120), diária do motorista (R$ 350) e comissões para o padrão.
                </div>
              </label>

              {/* Security Verification Input */}
              <div className="space-y-2 pt-1">
                <label className="block font-extrabold text-slate-800 text-xs">
                  Para confirmar, digite a palavra <span className="text-rose-700 uppercase font-black bg-rose-100 px-1.5 py-0.5 rounded">ZERAR</span> abaixo:
                </label>
                <input
                  type="text"
                  id="input-confirm-clear-all"
                  value={confirmationWord}
                  onChange={(e) => setConfirmationWord(e.target.value)}
                  placeholder="Digite ZERAR para desbloquear o botão"
                  autoFocus
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold uppercase placeholder:normal-case placeholder:font-normal text-rose-900"
                />
                {!isConfirmedValid && confirmationWord.length > 0 && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    A palavra digitada deve ser exatamente ZERAR.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar e Manter Dados
              </button>

              <button
                type="button"
                id="btn-confirm-clear-all-final"
                onClick={handleExecuteClearAll}
                disabled={!isConfirmedValid}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  isConfirmedValid
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={isConfirmedValid ? 'Zerar todos os dados agora' : 'Digite ZERAR para habilitar'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Zerar Tudo Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
