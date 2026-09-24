import React, { useEffect } from 'react';
import {
  Users,
  CalendarDays,
  Compass,
  Receipt,
  DollarSign,
  Car,
  BarChart3,
  Sliders,
  X,
  PlusCircle,
  UserCheck,
  Database,
  KeyRound,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Bus,
} from 'lucide-react';
import { ActiveTab, CompanyConfig } from '../types';

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  passengerCount: number;
  driverCount: number;
  dailyCount?: number;
  tripCount?: number;
  sellerCount?: number;
  companyConfig?: CompanyConfig;
  onOpenDriverModal?: () => void;
  onOpenDatabaseModal?: () => void;
  onOpenLicenseModal?: () => void;
  onOpenKeyGenerator?: () => void;
  onOpenPhoneSimulator?: () => void;
  isLicenseActive?: boolean;
  trialDaysRemaining?: number;
}

export const MobileSideMenu: React.FC<MobileSideMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  passengerCount,
  driverCount,
  dailyCount = 0,
  tripCount = 0,
  sellerCount = 0,
  companyConfig,
  onOpenDriverModal,
  onOpenDatabaseModal,
  onOpenLicenseModal,
  onOpenKeyGenerator,
  onOpenPhoneSimulator,
  isLicenseActive = false,
  trialDaysRemaining = 10,
}) => {
  const primaryColor = companyConfig?.primaryColor || '#065f46';
  const companyName = companyConfig?.companyName || 'OSNIR TURISMO';

  // Fechar com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evitar rolagem do fundo quando o menu estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTab = (tab: ActiveTab) => {
    onChangeTab(tab);
    onClose();
  };

  const navItems = [
    {
      id: 'passengers' as ActiveTab,
      label: 'Clientes (Lista Geral)',
      description: 'Cadastro geral e controle de passageiros',
      icon: Users,
      badge: passengerCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'daily-list' as ActiveTab,
      label: 'Lista do Dia',
      description: 'Passageiros na escala de embarque de hoje',
      icon: CalendarDays,
      badge: dailyCount,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      id: 'trips' as ActiveTab,
      label: 'Viagens',
      description: 'Roteiros, ônibus, escalas e lotação',
      icon: Compass,
      badge: tripCount,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'closing' as ActiveTab,
      label: 'Fechamento das Viagens',
      description: 'Despesas, comissão do motorista e apuração de lucro',
      icon: Receipt,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'pricing' as ActiveTab,
      label: 'Valores & Comissões',
      description: 'Tabela de preços por destino e comissões',
      icon: DollarSign,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'drivers' as ActiveTab,
      label: 'Motoristas',
      description: 'Frota, motoristas e veículos cadastrados',
      icon: Car,
      badge: driverCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Relatórios Financeiros',
      description: 'Estatísticas, totais e gráficos gerenciais',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Configurações',
      description: 'Identidade visual, logomarca, cores e sistema',
      icon: Sliders,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop transparente com blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Lateral Deslizante (Gaveta do Lado Esquerdo) */}
      <div
        id="mobile-side-menu-drawer"
        className="relative w-80 max-w-[85vw] h-full bg-slate-900 text-slate-100 flex flex-col shadow-2xl border-r border-slate-700/80 z-10 animate-in slide-in-from-left duration-300 ease-out"
      >
        {/* Cabeçalho do Menu Lateral */}
        <div
          className="p-4 border-b border-slate-800 flex items-center justify-between text-white shrink-0 shadow-xs"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {companyConfig?.logoUrl ? (
              <div className="h-9 w-11 bg-white rounded-xl p-0.5 border-2 border-white/60 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img
                  src={companyConfig.logoUrl}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-sm shrink-0">
                <Bus className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black uppercase tracking-tight truncate leading-tight text-white">
                {companyName}
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-white/90 border border-white/20">
                Menu de Guias
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white border border-white/20 active:scale-95 transition cursor-pointer shrink-0"
            title="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Guias em Formato Vertical */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-2 pt-1 pb-1.5 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <span>Guias do Sistema</span>
            <span className="text-[10px] lowercase text-slate-500">toque para abrir</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id || (item.id === 'passengers' && activeTab === 'new-passenger');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left border ${
                  isCurrent
                    ? 'bg-gradient-to-r from-emerald-950 to-slate-800 text-white border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-xs'
                        : 'bg-slate-700/70 text-slate-300 border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-black truncate leading-tight ${
                        isCurrent ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition ${
                      isCurrent ? 'text-emerald-400 translate-x-0.5' : 'text-slate-500'
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {/* Seção de Ações Rápidas */}
          <div className="pt-3 border-t border-slate-800 space-y-1.5">
            <div className="px-2 pt-1 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Ações Rápidas
            </div>

            <button
              type="button"
              onClick={() => handleSelectTab('new-passenger')}
              className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Novo Passageiro</span>
            </button>

            {onOpenDriverModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenDriverModal();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700 active:scale-98"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>+ Cadastrar Novo Motorista</span>
              </button>
            )}

            {onOpenDatabaseModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenDatabaseModal();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700 active:scale-98"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Banco de Dados Local & Backup</span>
              </button>
            )}

            {onOpenLicenseModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenLicenseModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700 active:scale-98"
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Licença do Sistema</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {isLicenseActive ? 'Ativo' : `${trialDaysRemaining}d teste`}
                </span>
              </button>
            )}

            {onOpenKeyGenerator && (
              <button
                type="button"
                onClick={() => {
                  onOpenKeyGenerator();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition cursor-pointer border border-amber-500/30 active:scale-98"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Gerador de Chaves (Proprietário)</span>
              </button>
            )}

            {onOpenPhoneSimulator && (
              <button
                type="button"
                onClick={() => {
                  onOpenPhoneSimulator();
                  onClose();
                }}
                className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition cursor-pointer border border-emerald-500/40 active:scale-98"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>📱 Simulador de Celular no Sistema</span>
              </button>
            )}
          </div>
        </div>

        {/* Rodapé Informativo do Menu */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Smartphone className="w-3 h-3" />
              100% Offline no Celular
            </span>
            <span className="text-slate-500">v2.5.0</span>
          </div>
          <p className="text-slate-500 text-[9px] leading-tight">
            Banco gravado localmente na memória interna.
          </p>
        </div>
      </div>
    </div>
  );
};
