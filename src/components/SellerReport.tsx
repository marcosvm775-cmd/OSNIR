import React, { useState } from 'react';
import { Tag, TrendingUp, Users, Award, FileDown, ArrowRight, UserCheck } from 'lucide-react';
import { Passenger, Driver } from '../types';
import { generateSellerReportPdf } from '../utils/pdfGenerator';

interface SellerReportProps {
  passengers: Passenger[];
  drivers: Driver[];
  onSelectPassengerFilter?: (sellerName: string) => void;
}

export const SellerReport: React.FC<SellerReportProps> = ({
  passengers,
  drivers,
  onSelectPassengerFilter,
}) => {
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

  // Group passengers by seller
  const sellerStats = React.useMemo(() => {
    const map = new Map<string, { seller: string; count: number; passengers: Passenger[] }>();

    passengers.forEach((p) => {
      const sellerKey = p.seller.trim();
      const current = map.get(sellerKey) || { seller: sellerKey, count: 0, passengers: [] };
      current.count += 1;
      current.passengers.push(p);
      map.set(sellerKey, current);
    });

    // Sort by sales descending
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [passengers]);

  const totalSales = passengers.length;
  const topSeller = sellerStats.length > 0 ? sellerStats[0] : null;

  // Generate PDF of Seller Sales Report
  const handleGeneratePdf = () => {
    generateSellerReportPdf(sellerStats, totalSales);
  };

  const driverMap = React.useMemo(() => {
    const map = new Map<string, string>();
    drivers.forEach((d) => map.set(d.id, d.fullName));
    return map;
  }, [drivers]);

  return (
    <div className="space-y-4">
      {/* Header with Title and PDF button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Relatório de Vendedores
          </h2>
          <p className="text-xs text-slate-500">
            Quantitativo de passagens emitidas por vendedor
          </p>
        </div>
        <button
          id="btn-generate-seller-pdf"
          onClick={handleGeneratePdf}
          disabled={passengers.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          title="Baixar Relatório em PDF"
        >
          <FileDown className="w-3.5 h-3.5 text-emerald-200" />
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Vendido</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {totalSales} <span className="text-xs font-normal text-slate-500">passagens</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Vendedores Ativos</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {sellerStats.length}
          </div>
        </div>

        {topSeller && (
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Maior Vendedor</span>
            </div>
            <div className="text-sm font-bold text-emerald-950 mt-1 truncate">
              {topSeller.seller}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              {topSeller.count} passagens ({totalSales > 0 ? Math.round((topSeller.count / totalSales) * 100) : 0}%)
            </div>
          </div>
        )}
      </div>

      {/* Seller Rankings List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Desempenho por Vendedor
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {sellerStats.length} vendedor(es)
          </span>
        </div>

        {sellerStats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma passagem registrada para exibir no relatório.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sellerStats.map((stat, idx) => {
              const isSelected = selectedSeller === stat.seller;
              const percentage = totalSales > 0 ? Math.round((stat.count / totalSales) * 100) : 0;

              return (
                <div key={stat.seller} className="transition-colors hover:bg-slate-50/80">
                  <div
                    onClick={() => setSelectedSeller(isSelected ? null : stat.seller)}
                    className="p-3.5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}º
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {stat.seller}
                        </div>
                        <div className="w-32 sm:w-44 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-800">
                          {stat.count} <span className="text-xs font-normal text-slate-500">{stat.count === 1 ? 'passagem' : 'passagens'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {percentage}% do total
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
                      >
                        {isSelected ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded list of passengers for this seller */}
                  {isSelected && (
                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          Clientes deste vendedor ({stat.passengers.length})
                        </span>
                        {onSelectPassengerFilter && (
                          <button
                            onClick={() => onSelectPassengerFilter(stat.seller)}
                            className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                          >
                            Filtrar na Lista Geral →
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {stat.passengers.map((p) => {
                          const driverName = p.driverId ? driverMap.get(p.driverId) : null;
                          return (
                            <div
                              key={p.id}
                              className="bg-white p-2 rounded-lg border border-slate-200/80 text-xs flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{p.fullName}</span>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>{p.origin}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                                  <span className="font-medium text-slate-700">{p.destination}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {driverName ? (
                                  <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    {driverName}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                                    Aguardando motorista
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
