import React from 'react';
import { Users, DollarSign, Car, Compass, CalendarDays, BarChart3, Sliders, Receipt } from 'lucide-react';
import { ActiveTab, CompanyConfig } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  passengerCount: number;
  driverCount: number;
  dailyCount?: number;
  tripCount?: number;
  sellerCount?: number;
  companyConfig?: CompanyConfig;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  passengerCount,
  driverCount,
  dailyCount = 0,
  tripCount = 0,
  companyConfig,
}) => {
  const primaryColor = companyConfig?.primaryColor || '#065f46';

  return (
    <nav
      id="app-bottom-nav"
      aria-label="Navegação Principal"
      className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 z-40 shadow-xl pb-safe md:hidden"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none px-1.5 py-1 gap-1">
        {/* Tab 1: Clientes (Lista Geral) */}
        <button
          id="nav-tab-passengers"
          onClick={() => onChangeTab('passengers')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'passengers' || activeTab === 'new-passenger'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'passengers' || activeTab === 'new-passenger' ? { color: primaryColor } : undefined}
        >
          <div className="relative">
            <Users className="w-4 h-4" />
            {passengerCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 text-white text-[8px] font-bold px-1 rounded-full min-w-3 text-center leading-3 border border-white"
                style={{ backgroundColor: primaryColor }}
              >
                {passengerCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Clientes</span>
          {(activeTab === 'passengers' || activeTab === 'new-passenger') && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 2: Lista do Dia */}
        <button
          id="nav-tab-daily-list"
          onClick={() => onChangeTab('daily-list')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'daily-list'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'daily-list' ? { color: primaryColor } : undefined}
        >
          <div className="relative">
            <CalendarDays className="w-4 h-4" />
            {dailyCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 text-white text-[8px] font-bold px-1 rounded-full min-w-3 text-center leading-3 border border-white"
                style={{ backgroundColor: primaryColor }}
              >
                {dailyCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Dia</span>
          {activeTab === 'daily-list' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 3: Guia de Viagem */}
        <button
          id="nav-tab-trips"
          onClick={() => onChangeTab('trips')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'trips'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'trips' ? { color: primaryColor } : undefined}
        >
          <div className="relative">
            <Compass className="w-4 h-4" />
            {tripCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 text-white text-[8px] font-bold px-1 rounded-full min-w-3 text-center leading-3 border border-white"
                style={{ backgroundColor: primaryColor }}
              >
                {tripCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Viagem</span>
          {activeTab === 'trips' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 4: Fechamento das Viagens */}
        <button
          id="nav-tab-closing"
          onClick={() => onChangeTab('closing')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'closing'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'closing' ? { color: primaryColor } : undefined}
          title="Fechamento de Viagem, Despesas e Lucro"
        >
          <div className="relative">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Fecham.</span>
          {activeTab === 'closing' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 5: Tabela de Valores por Destino & Comissões */}
        <button
          id="nav-tab-pricing"
          onClick={() => onChangeTab('pricing')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'pricing'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'pricing' ? { color: primaryColor } : undefined}
          title="Tabela de Valores de Passagens por Destino"
        >
          <div className="relative">
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Valores</span>
          {activeTab === 'pricing' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 6: Motoristas */}
        <button
          id="nav-tab-drivers"
          onClick={() => onChangeTab('drivers')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'drivers'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'drivers' ? { color: primaryColor } : undefined}
        >
          <div className="relative">
            <Car className="w-4 h-4" />
            {driverCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-slate-700 text-white text-[8px] font-bold px-1 rounded-full min-w-3 text-center leading-3 border border-white">
                {driverCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap">Motoristas</span>
          {activeTab === 'drivers' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 7: Relatórios */}
        <button
          id="nav-tab-reports"
          onClick={() => onChangeTab('reports')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'reports'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'reports' ? { color: primaryColor } : undefined}
        >
          <div className="relative">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap">Relat.</span>
          {activeTab === 'reports' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>

        {/* Tab 8: Configuração */}
        <button
          id="nav-tab-settings"
          onClick={() => onChangeTab('settings')}
          className={`flex-1 min-w-[50px] py-1 flex flex-col items-center justify-center relative transition-all cursor-pointer rounded-xl border ${
            activeTab === 'settings'
              ? 'bg-slate-100/90 border-slate-300 font-extrabold shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          style={activeTab === 'settings' ? { color: primaryColor } : undefined}
          title="Configuração do Aplicativo & Identidade Visual"
        >
          <div className="relative">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 whitespace-nowrap font-semibold">Config.</span>
          {activeTab === 'settings' && (
            <span
              className="absolute bottom-0.5 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </button>
      </div>
    </nav>
  );
};
