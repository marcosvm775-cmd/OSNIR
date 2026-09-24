import React from 'react';
import {
  Bus,
  Users,
  ShieldCheck,
  UserCheck,
  CalendarDays,
  Compass,
  Tag,
  DollarSign,
  Car,
  BarChart3,
  Settings,
  Sliders,
  Receipt,
  Database,
  KeyRound,
  Menu,
  Smartphone,
} from 'lucide-react';
import { ActiveTab, CompanyConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  passengerCount: number;
  driverCount: number;
  dailyCount?: number;
  tripCount?: number;
  sellerCount?: number;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
  onOpenDriverModal: () => void;
  onResetData: () => void;
  companyConfig?: CompanyConfig;
  onOpenLicenseModal?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenKeyGenerator?: () => void;
  onOpenPhoneSimulator?: () => void;
  onOpenMobileMenu?: () => void;
  isLicenseActive?: boolean;
  trialDaysRemaining?: number;
}

export const Header: React.FC<HeaderProps> = ({
  passengerCount,
  driverCount,
  dailyCount = 0,
  tripCount = 0,
  sellerCount = 0,
  activeTab,
  onChangeTab,
  onOpenDriverModal,
  companyConfig,
  onOpenLicenseModal,
  onOpenDatabaseModal,
  onOpenKeyGenerator,
  onOpenPhoneSimulator,
  onOpenMobileMenu,
  isLicenseActive = false,
  trialDaysRemaining = 10,
}) => {
  const currentPrimaryColor = companyConfig?.primaryColor || '#065f46';
  const currentSecondaryColor = companyConfig?.secondaryColor || '#047857';
  const companyName = companyConfig?.companyName || 'OSNIR TURISMO';

  return (
    <header
      id="app-header"
      className="text-white shadow-md sticky top-0 z-30 border-b border-black/10 backdrop-blur-md transition-colors duration-200"
      style={{ backgroundColor: currentPrimaryColor }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        {/* Top Header Bar: Brand + Quick Actions */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Logo & Brand Info + Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {/* Botão Menu Lateral Esquerdo (Lista de Guias no Celular e Tablets) */}
            {onOpenMobileMenu && (
              <button
                id="header-mobile-menu-btn"
                type="button"
                onClick={onOpenMobileMenu}
                className="p-1.5 sm:p-2 -ml-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center shrink-0 border border-white/40 cursor-pointer shadow-xs transition"
                title="Abrir Menu de Guias do Lado Esquerdo (Lista)"
                aria-label="Abrir Menu de Guias"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            )}

            {companyConfig?.logoUrl ? (
              <div className="h-8 w-10 sm:h-10 sm:w-13 bg-white rounded-xl p-0.5 sm:p-1 border-2 border-white/60 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img
                  src={companyConfig.logoUrl}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-sm shrink-0">
                <Bus className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-xl font-black tracking-tight text-white leading-tight uppercase truncate">
                  {companyName}
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/25 text-white border border-white/30 shrink-0 hidden xs:inline">
                  SISTEMA
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-white/80 font-medium truncate">
                {companyConfig?.phone
                  ? `Contato: ${companyConfig.phone}`
                  : 'Controle de Passageiros'}
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Botão Instalar App no Celular / PWA (apenas em telas maiores que mobile para não poluir o topo no celular) */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="header" />
            </div>

            {/* Botão Banco de Dados */}
            {onOpenDatabaseModal && (
              <button
                id="header-database-btn"
                onClick={onOpenDatabaseModal}
                className="hidden sm:inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold rounded-xl shadow-xs transition border border-white/30 text-white cursor-pointer"
                title="Banco de Dados Local & Backup"
              >
                <Database className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-300" />
                <span className="hidden lg:inline text-[11px] ml-1">Banco</span>
              </button>
            )}

            {/* Botão Gerador de Chaves (Acesso Direto e Rápido) */}
            {onOpenKeyGenerator && (
              <button
                id="header-key-generator-btn"
                onClick={onOpenKeyGenerator}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-xs font-black rounded-xl shadow-xs transition text-slate-950 cursor-pointer border border-amber-300"
                title="Gerador de Chaves Válidas do Sistema (Painel do Proprietário)"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-900" />
                <span className="hidden sm:inline text-[11px] font-black">Gerador</span>
              </button>
            )}

            {/* Botão Simulador de Celular no Sistema */}
            {onOpenPhoneSimulator && (
              <button
                id="header-phone-simulator-btn"
                onClick={onOpenPhoneSimulator}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 active:scale-95 text-xs font-black rounded-xl shadow-xs transition cursor-pointer border border-emerald-300/50"
                title="Simulador de Celular (Ver como roda no smartphone)"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline text-[11px] font-bold">Simulador</span>
              </button>
            )}

            {/* Botão Licença & Ativação */}
            {onOpenLicenseModal && (
              <button
                id="header-license-btn"
                onClick={onOpenLicenseModal}
                className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-2 active:scale-95 text-xs font-bold rounded-xl shadow-xs transition border cursor-pointer ${
                  isLicenseActive
                    ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-400/50 text-emerald-200'
                    : trialDaysRemaining > 0
                    ? 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-300/60 text-amber-100'
                    : 'bg-rose-500/30 hover:bg-rose-500/40 border-rose-300/60 text-rose-100 animate-pulse'
                }`}
                title={
                  isLicenseActive
                    ? 'Software Licenciado'
                    : trialDaysRemaining > 0
                    ? `Período de Demonstração: ${trialDaysRemaining} dia(s) restante(s)`
                    : 'Demonstração Expirada - Ativar Licença'
                }
              >
                <ShieldCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline ml-1 text-[11px] font-extrabold">
                  {isLicenseActive ? 'Licenciado' : trialDaysRemaining > 0 ? `Demo (${trialDaysRemaining}d)` : 'Bloqueado'}
                </span>
              </button>
            )}

            <button
              id="header-add-driver-btn"
              onClick={onOpenDriverModal}
              className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-bold rounded-xl shadow-xs transition border-2 border-white/40 text-white cursor-pointer"
              title="Cadastrar Novo Motorista"
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-[11px] sm:text-xs">+ Mot.</span>
            </button>

            <button
              id="header-settings-quick-btn"
              onClick={() => onChangeTab?.('settings')}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer border-2 ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 border-white shadow-xs'
                  : 'bg-white/15 text-white border-white/40 hover:bg-white/30'
              }`}
              title="Configuração do Aplicativo & Identidade Visual"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs: Equal width grid (1/7 each) with prominent thick borders */}
        {onChangeTab && activeTab && (
          <nav
            id="header-top-navigation-bar"
            className="hidden md:grid grid-cols-8 gap-1.5 w-full mt-3 p-1.5 bg-black/25 rounded-2xl border-2 border-white/40 shadow-inner"
          >
            {/* Tab 1: Clientes (Lista Geral) */}
            <button
              id="header-tab-passengers"
              onClick={() => onChangeTab('passengers')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'passengers' || activeTab === 'new-passenger'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Clientes</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold border-2 shrink-0 ${
                  activeTab === 'passengers' || activeTab === 'new-passenger'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-black/40 text-white border-white/30'
                }`}
              >
                {passengerCount}
              </span>
            </button>

            {/* Tab 2: Lista do Dia */}
            <button
              id="header-tab-daily-list"
              onClick={() => onChangeTab('daily-list')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'daily-list'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="truncate">Lista do Dia</span>
              {dailyCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold border-2 shrink-0 ${
                    activeTab === 'daily-list'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-black/40 text-white border-white/30'
                  }`}
                >
                  {dailyCount}
                </span>
              )}
            </button>

            {/* Tab 3: Viagens */}
            <button
              id="header-tab-trips"
              onClick={() => onChangeTab('trips')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'trips'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="truncate">Viagens</span>
              {tripCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold border-2 shrink-0 ${
                    activeTab === 'trips'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-black/40 text-white border-white/30'
                  }`}
                >
                  {tripCount}
                </span>
              )}
            </button>

            {/* Tab 4: Fechamento das Viagens (NOVA GUIA SOLICITADA) */}
            <button
              id="header-tab-closing"
              onClick={() => onChangeTab('closing')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'closing'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
              title="Fechamento das Viagens, Despesas e Apuração de Lucro"
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span className="truncate">Fechamento</span>
            </button>

            {/* Tab 5: Valores de Passagens & Comissões */}
            <button
              id="header-tab-pricing"
              onClick={() => onChangeTab('pricing')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'pricing'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
              title="Tabela de Valores de Passagens por Destino e Comissões"
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span className="truncate">Valores</span>
            </button>

            {/* Tab 6: Motoristas */}
            <button
              id="header-tab-drivers"
              onClick={() => onChangeTab('drivers')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'drivers'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span className="truncate">Motoristas</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold border-2 shrink-0 ${
                  activeTab === 'drivers'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-black/40 text-white border-white/30'
                }`}
              >
                {driverCount}
              </span>
            </button>

            {/* Tab 7: Relatórios */}
            <button
              id="header-tab-reports"
              onClick={() => onChangeTab('reports')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="truncate">Relatórios</span>
            </button>

            {/* Tab 8: Configuração */}
            <button
              id="header-tab-settings"
              onClick={() => onChangeTab('settings')}
              className={`w-full h-11 flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-xl transition cursor-pointer border-2 text-xs text-center select-none ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 border-white shadow-md font-black ring-1 ring-black/10'
                  : 'text-white/95 border-white/40 bg-black/20 hover:bg-white/20 hover:border-white/80 font-bold'
              }`}
              title="Configuração do Aplicativo, Logomarca, Cores e Banco de Dados"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">Configuração</span>
            </button>
          </nav>
        )}

        {/* Quick KPI stats strip with thicker borders */}
        <div className="mt-3 pt-2.5 border-t-2 border-white/25 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
          <div className="bg-black/25 rounded-xl px-3 py-1.5 flex items-center justify-between border-2 border-white/30">
            <div className="flex items-center space-x-1.5 text-white/95">
              <Users className="w-3.5 h-3.5 text-white/80" />
              <span className="font-semibold">Passageiros</span>
            </div>
            <span className="font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full text-xs border-2 border-white/20">
              {passengerCount}
            </span>
          </div>

          <div className="bg-black/25 rounded-xl px-3 py-1.5 flex items-center justify-between border-2 border-white/30">
            <div className="flex items-center space-x-1.5 text-white/95">
              <CalendarDays className="w-3.5 h-3.5 text-white/80" />
              <span className="font-semibold">Na Lista do Dia</span>
            </div>
            <span className="font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full text-xs border-2 border-white/20">
              {dailyCount}
            </span>
          </div>

          <div className="bg-black/25 rounded-xl px-3 py-1.5 flex items-center justify-between border-2 border-white/30">
            <div className="flex items-center space-x-1.5 text-white/95">
              <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
              <span className="font-semibold">Motoristas</span>
            </div>
            <span className="font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full text-xs border-2 border-white/20">
              {driverCount}
            </span>
          </div>

          <div className="bg-black/25 rounded-xl px-3 py-1.5 flex items-center justify-between border-2 border-white/30">
            <div className="flex items-center space-x-1.5 text-white/95">
              <Compass className="w-3.5 h-3.5 text-white/80" />
              <span className="font-semibold">Viagens</span>
            </div>
            <span className="font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full text-xs border-2 border-white/20">
              {tripCount}
            </span>
          </div>

          <div className="hidden lg:flex bg-black/25 rounded-xl px-3 py-1.5 items-center justify-between border-2 border-white/30">
            <div className="flex items-center space-x-1.5 text-white/95">
              <Tag className="w-3.5 h-3.5 text-white/80" />
              <span className="font-semibold">Vendedores</span>
            </div>
            <span className="font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full text-xs border-2 border-white/20">
              {sellerCount}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
