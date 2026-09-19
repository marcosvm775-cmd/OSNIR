import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  TrendingUp,
  Users,
  Car,
  Tag,
  Award,
  DollarSign,
  FileDown,
  Filter,
  ArrowRight,
  ChevronRight,
  Percent,
  Settings,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Receipt,
} from 'lucide-react';
import { Passenger, Driver, Trip, FinancialConfig, SellerCommissionConfig, CompanyConfig, Expense } from '../types';
import {
  getStoredFinancialConfig,
  saveFinancialConfig,
  getStoredSellerCommissions,
  saveSellerCommissions,
  getStoredDestinationPrices,
  getTicketPriceForDestination,
  getStoredExpenses,
  DEFAULT_FINANCIAL_CONFIG,
} from '../utils/storage';
import { generateComprehensiveReportsPdf } from '../utils/pdfGenerator';

interface ReportsManagerProps {
  passengers: Passenger[];
  drivers: Driver[];
  trips: Trip[];
  dailyLists: Record<string, string[]>;
  onSelectPassengerFilter?: (sellerName: string) => void;
  companyConfig?: CompanyConfig;
}

type PeriodMode = 'current_month' | 'current_week' | 'specific_month' | 'all';
type ReportSection = 'financial' | 'driver_trips' | 'destinations' | 'top_clients' | 'commissions';

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  passengers,
  drivers,
  trips,
  dailyLists,
  onSelectPassengerFilter,
  companyConfig,
}) => {
  // Current real date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-11

  // Period filters
  const [periodMode, setPeriodMode] = useState<PeriodMode>('current_month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeSection, setActiveSection] = useState<ReportSection>('financial');

  // Driver filter for trips
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('all');

  // Financial and Commission configs
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(getStoredFinancialConfig);
  const [sellerCommissions, setSellerCommissions] = useState<SellerCommissionConfig>(getStoredSellerCommissions);
  const [destinationPrices, setDestinationPrices] = useState<Record<string, number>>(getStoredDestinationPrices);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configToast, setConfigToast] = useState<string | null>(null);

  // Editable commission inputs per seller
  const [customRates, setCustomRates] = useState<Record<string, string>>({});

  useEffect(() => {
    // Populate rates
    const initial: Record<string, string> = {};
    const sellers: string[] = Array.from(
      new Set(passengers.map((p) => p.seller.trim().toUpperCase()).filter(Boolean))
    );
    sellers.forEach((s: string) => {
      initial[s] = (sellerCommissions[s] !== undefined ? sellerCommissions[s] : financialConfig.defaultCommissionPercent).toString();
    });
    setCustomRates(initial);
    // Reload destination prices to ensure fresh closing rates
    setDestinationPrices(getStoredDestinationPrices());
  }, [passengers, sellerCommissions, financialConfig.defaultCommissionPercent]);

  const showFeedback = (msg: string) => {
    setConfigToast(msg);
    setTimeout(() => setConfigToast(null), 3000);
  };

  // Calculate Date Range for filtering
  const periodRange = useMemo(() => {
    if (periodMode === 'all') {
      return {
        start: '1970-01-01',
        end: '2099-12-31',
        label: 'TODO O HISTÓRICO',
      };
    }

    if (periodMode === 'current_week') {
      // 7 days window (from 6 days ago up to today)
      const endD = new Date(now);
      const startD = new Date(now);
      startD.setDate(endD.getDate() - 6);

      const startStr = startD.toISOString().substring(0, 10);
      const endStr = endD.toISOString().substring(0, 10);

      const sParts = startStr.split('-');
      const eParts = endStr.split('-');
      const label = `SEMANA ATUAL (${sParts[2]}/${sParts[1]} A ${eParts[2]}/${eParts[1]}/${eParts[0]})`;

      return { start: startStr, end: endStr, label };
    }

    // Month mode (current or specific)
    const m = periodMode === 'current_month' ? currentMonthIdx : selectedMonth;
    const y = periodMode === 'current_month' ? currentYear : selectedYear;

    const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    // Last day of month
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m]} DE ${y}`;

    return { start: startStr, end: endStr, label };
  }, [periodMode, selectedMonth, selectedYear]);

  // Driver dictionary for quick lookup
  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  // Helper to check if a date falls in range
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.substring(0, 10);
    return cleanDate >= periodRange.start && cleanDate <= periodRange.end;
  };

  // Filtered trips in period
  const periodTrips = useMemo(() => {
    return trips.filter((t) => {
      const tripDate = t.date || (t.createdAt ? t.createdAt.substring(0, 10) : '');
      return isDateInRange(tripDate);
    });
  }, [trips, periodRange]);

  // Filtered passengers for the period (either registered in period OR scheduled in dailyLists in period OR traveled in a period trip)
  const periodPassengerData = useMemo(() => {
    // Collect passenger IDs in dailyLists that fall within period
    const dailyPassengerIdsInPeriod = new Set<string>();
    (Object.entries(dailyLists) as [string, string[]][]).forEach(([dateKey, ids]) => {
      if (isDateInRange(dateKey) && Array.isArray(ids)) {
        ids.forEach((id) => dailyPassengerIdsInPeriod.add(id));
      }
    });

    // Collect passenger IDs in trips in period
    const tripPassengerIdsInPeriod = new Set<string>();
    periodTrips.forEach((t) => {
      t.passengerIds.forEach((id) => tripPassengerIdsInPeriod.add(id));
    });

    return passengers.filter((p) => {
      const regDate = p.createdAt ? p.createdAt.substring(0, 10) : '';
      const inRangeReg = isDateInRange(regDate);
      const inDaily = dailyPassengerIdsInPeriod.has(p.id);
      const inTrip = tripPassengerIdsInPeriod.has(p.id);

      return inRangeReg || inDaily || inTrip;
    });
  }, [passengers, periodRange, dailyLists, periodTrips]);

  // Distinct sellers from all passengers
  const allSellers = useMemo(() => {
    return Array.from(new Set(passengers.map((p) => p.seller.trim().toUpperCase()).filter(Boolean))).sort();
  }, [passengers]);

  // 1. VIAGENS POR MOTORISTA & QUANTAS VIAGENS CADA UM FEZ
  const driverStats = useMemo(() => {
    return drivers.map((driver) => {
      const tripsForDriver = periodTrips.filter((t) => t.driverId === driver.id);
      let passengersTransported = 0;
      tripsForDriver.forEach((t) => {
        passengersTransported += t.passengerIds.length;
      });

      // Total earnings for driver
      const totalPayout = tripsForDriver.length * financialConfig.driverTripPrice;

      return {
        driver,
        driverId: driver.id,
        driverName: driver.fullName,
        tripsCount: tripsForDriver.length,
        passengersCount: passengersTransported,
        trips: tripsForDriver,
        totalPayout,
      };
    }).sort((a, b) => b.tripsCount - a.tripsCount);
  }, [drivers, periodTrips, financialConfig.driverTripPrice]);

  // Filtered trips for the "Viagens por Motorista" tab based on driver selection
  const displayedDriverTrips = useMemo(() => {
    if (selectedDriverFilter === 'all') {
      return periodTrips;
    }
    return periodTrips.filter((t) => t.driverId === selectedDriverFilter);
  }, [periodTrips, selectedDriverFilter]);

  // 2. DESTINOS MAIS PROCURADOS & FATURAMENTO POR DESTINO
  const destinationStats = useMemo(() => {
    const destMap = new Map<string, { destination: string; count: number; origins: Set<string> }>();

    // Count from period passengers
    const sourceList = periodPassengerData.length > 0 ? periodPassengerData : passengers;
    sourceList.forEach((p) => {
      const dest = p.destination.trim().toUpperCase() || 'NÃO INFORMADO';
      const orig = p.origin.trim().toUpperCase();
      const current = destMap.get(dest) || { destination: dest, count: 0, origins: new Set<string>() };
      current.count += 1;
      if (orig) current.origins.add(orig);
      destMap.set(dest, current);
    });

    const totalCount = sourceList.length;
    return Array.from(destMap.values())
      .map((item) => {
        const ticketPrice = getTicketPriceForDestination(
          item.destination,
          destinationPrices,
          financialConfig.ticketPrice
        );
        const totalRevenue = item.count * ticketPrice;
        const hasCustomPrice = typeof destinationPrices[item.destination] === 'number';

        return {
          destination: item.destination,
          count: item.count,
          percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
          origins: Array.from(item.origins),
          ticketPrice,
          totalRevenue,
          hasCustomPrice,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.count - a.count);
  }, [periodPassengerData, passengers, destinationPrices, financialConfig.ticketPrice]);

  // 3. CLIENTES QUE MAIS VIAJAM COM A NOSSA EMPRESA
  const topClientsStats = useMemo(() => {
    const clientMap = new Map<
      string,
      {
        fullName: string;
        tripsCount: number;
        destinations: Map<string, number>;
        sellers: Map<string, number>;
        lastSeen: string;
      }
    >();

    // Count appearances in period trips
    periodTrips.forEach((trip) => {
      trip.passengerIds.forEach((pid) => {
        const p = passengers.find((item) => item.id === pid);
        if (p) {
          const key = p.fullName.trim().toUpperCase();
          const cur = clientMap.get(key) || {
            fullName: key,
            tripsCount: 0,
            destinations: new Map<string, number>(),
            sellers: new Map<string, number>(),
            lastSeen: trip.date || '',
          };
          cur.tripsCount += 1;

          const dst = p.destination.trim().toUpperCase();
          cur.destinations.set(dst, (cur.destinations.get(dst) || 0) + 1);

          const slr = p.seller.trim().toUpperCase();
          cur.sellers.set(slr, (cur.sellers.get(slr) || 0) + 1);

          if (!cur.lastSeen || trip.date > cur.lastSeen) {
            cur.lastSeen = trip.date;
          }
          clientMap.set(key, cur);
        }
      });
    });

    // If trips have low count, also count from general passengers created in this period
    if (clientMap.size === 0 && periodPassengerData.length > 0) {
      periodPassengerData.forEach((p) => {
        const key = p.fullName.trim().toUpperCase();
        const cur = clientMap.get(key) || {
          fullName: key,
          tripsCount: 0,
          destinations: new Map<string, number>(),
          sellers: new Map<string, number>(),
          lastSeen: p.createdAt ? p.createdAt.substring(0, 10) : '',
        };
        cur.tripsCount += 1;
        const dst = p.destination.trim().toUpperCase();
        cur.destinations.set(dst, (cur.destinations.get(dst) || 0) + 1);
        const slr = p.seller.trim().toUpperCase();
        cur.sellers.set(slr, (cur.sellers.get(slr) || 0) + 1);
        clientMap.set(key, cur);
      });
    }

    return Array.from(clientMap.values())
      .map((item) => {
        // Find most frequent destination
        let favDest = '-';
        let maxDest = 0;
        item.destinations.forEach((cnt, dst) => {
          if (cnt > maxDest) {
            maxDest = cnt;
            favDest = dst;
          }
        });

        // Find most frequent seller
        let favSeller = '-';
        let maxSeller = 0;
        item.sellers.forEach((cnt, slr) => {
          if (cnt > maxSeller) {
            maxSeller = cnt;
            favSeller = slr;
          }
        });

        return {
          name: item.fullName,
          tripsCount: item.tripsCount,
          favoriteDestination: favDest,
          favoriteSeller: favSeller,
          lastSeen: item.lastSeen,
        };
      })
      .sort((a, b) => b.tripsCount - a.tripsCount);
  }, [periodTrips, passengers, periodPassengerData]);

  // 4. FATURAMENTO E COMISSÕES DOS VENDEDORES (PUXANDO VALORES ESPECÍFICOS POR DESTINO)
  const sellerFinancialStats = useMemo(() => {
    const map = new Map<string, { seller: string; count: number; grossRevenue: number }>();

    // Calculate tickets and gross revenue per seller based on destination ticket price
    const list = periodPassengerData.length > 0 ? periodPassengerData : passengers;
    list.forEach((p) => {
      const key = p.seller.trim().toUpperCase() || 'SEM VENDEDOR';
      const cur = map.get(key) || { seller: key, count: 0, grossRevenue: 0 };
      const ticketPrice = getTicketPriceForDestination(
        p.destination,
        destinationPrices,
        financialConfig.ticketPrice,
        p.origin
      );
      cur.count += 1;
      cur.grossRevenue += ticketPrice;
      map.set(key, cur);
    });

    // Also include all known sellers even if 0 sales in period
    allSellers.forEach((sellerName) => {
      if (!map.has(sellerName)) {
        map.set(sellerName, { seller: sellerName, count: 0, grossRevenue: 0 });
      }
    });

    return Array.from(map.values())
      .map((item) => {
        const commissionPercent =
          sellerCommissions[item.seller] !== undefined
            ? sellerCommissions[item.seller]
            : financialConfig.defaultCommissionPercent;

        const commissionAmount = item.grossRevenue * (commissionPercent / 100);

        return {
          seller: item.seller,
          tickets: item.count,
          commissionPercent,
          grossRevenue: item.grossRevenue,
          commissionAmount,
        };
      })
      .sort((a, b) => b.grossRevenue - a.grossRevenue);
  }, [periodPassengerData, passengers, allSellers, sellerCommissions, financialConfig, destinationPrices]);

  // Period expenses
  const periodExpenses = useMemo(() => {
    const allExpenses = getStoredExpenses();
    return allExpenses.filter((e) => isDateInRange(e.date));
  }, [periodRange]);

  const totalPeriodExpenses = useMemo(() => {
    return periodExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [periodExpenses]);

  // CONSOLIDATED FINANCIAL TOTALS (FECHAMENTO BASEADO NOS VALORES POR DESTINO, DESPESAS E LUCRO REAL)
  const financialSummary = useMemo(() => {
    const list = periodPassengerData.length > 0 ? periodPassengerData : passengers;
    const totalTickets = list.length;
    const totalTrips = periodTrips.length;

    // Gross Revenue = sum of each passenger's destination price
    let totalRevenue = 0;
    list.forEach((p) => {
      totalRevenue += getTicketPriceForDestination(
        p.destination,
        destinationPrices,
        financialConfig.ticketPrice,
        p.origin
      );
    });

    // Total Seller Commission
    const totalSellerCommission = sellerFinancialStats.reduce((acc, s) => acc + s.commissionAmount, 0);

    // Total Driver Payout = total trips * driverTripPrice
    const totalDriverPayout = totalTrips * financialConfig.driverTripPrice;

    // Net Operating Result = Gross Revenue - Seller Commissions - Driver Payouts
    const netOperatingResult = totalRevenue - totalSellerCommission - totalDriverPayout;

    // Net Real Profit = Net Operating Result - Total Expenses
    const netRealProfit = netOperatingResult - totalPeriodExpenses;

    const averageTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : financialConfig.ticketPrice;

    return {
      totalRevenue,
      totalDriverPayout,
      totalSellerCommission,
      netOperatingResult,
      totalTickets,
      totalTrips,
      averageTicketPrice,
      totalExpenses: totalPeriodExpenses,
      netRealProfit,
    };
  }, [periodPassengerData, passengers, periodTrips, financialConfig, sellerFinancialStats, destinationPrices, totalPeriodExpenses]);

  // Handle saving custom commission for a seller
  const handleSaveCommissionRate = (sellerName: string, rateValue: number) => {
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
      showFeedback('Por favor, informe uma porcentagem válida entre 0% e 100%.');
      return;
    }

    const updated = {
      ...sellerCommissions,
      [sellerName]: rateValue,
    };
    setSellerCommissions(updated);
    saveSellerCommissions(updated);
    showFeedback(`Porcentagem de comissão de ${sellerName} definida para ${rateValue}%!`);
  };

  // Handle saving general financial configs
  const handleSaveFinancialConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFinancialConfig(financialConfig);
    setShowConfigModal(false);
    showFeedback('Configurações financeiras e valores salvos com sucesso!');
  };

  // Generate PDF Report
  const handleExportPDF = () => {
    generateComprehensiveReportsPdf(
      periodRange.label,
      financialSummary,
      sellerFinancialStats,
      driverStats,
      destinationStats,
      topClientsStats,
      companyConfig
    );
    showFeedback('Relatório completo em PDF gerado com sucesso!');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {configToast && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{configToast}</span>
          </div>
        </div>
      )}

      {/* Main Header & Period Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span>Central de Relatórios & Faturamento</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Osnir Turismo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Análise operacional detalhada: motoristas, destinos mais procurados, clientes VIPs e comissões por vendedor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300/80 transition cursor-pointer"
              title="Configurar valores padrão da passagem, diária dos motoristas e comissões"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Valores & Comissões</span>
            </button>

            <button
              type="button"
              id="btn-export-reports-pdf"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Baixar Relatório Completo em PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-200" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Period Filter Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Período:
            </span>

            <button
              type="button"
              onClick={() => setPeriodMode('current_month')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                periodMode === 'current_month'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Mês Atual ({MONTH_NAMES[currentMonthIdx]})
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('current_week')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                periodMode === 'current_week'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semana Atual (7 Dias)
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('specific_month')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                periodMode === 'specific_month'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Escolher Mês/Ano
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                periodMode === 'all'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todo o Histórico
            </button>
          </div>

          {/* Active Period Range Label */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>{periodRange.label}</span>
          </div>
        </div>

        {/* Specific Month / Year Pickers (if chosen) */}
        {periodMode === 'specific_month' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Mês:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Ano:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faturamento Bruto</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-emerald-800 mt-1">
            R$ {financialSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {financialSummary.totalTickets} passagens
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>Comissões Vendedores</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-amber-700 mt-1">
            - R$ {financialSummary.totalSellerCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {sellerFinancialStats.length} vendedores
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            <span>Repasse Motoristas</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-blue-700 mt-1">
            - R$ {financialSummary.totalDriverPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {financialSummary.totalTrips} viagens
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>Despesas do Período</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-rose-700 mt-1">
            - R$ {(financialSummary.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {periodExpenses.length} despesas lançadas
          </div>
        </div>

        <div className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border shadow-2xs ${
          (financialSummary.netRealProfit ?? financialSummary.netOperatingResult) >= 0
            ? 'bg-emerald-50/90 border-emerald-300'
            : 'bg-rose-50/90 border-rose-300'
        }`}>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            <span>Lucro Líquido Real</span>
          </div>
          <div className={`text-base sm:text-lg font-black mt-1 ${
            (financialSummary.netRealProfit ?? financialSummary.netOperatingResult) >= 0
              ? 'text-emerald-950'
              : 'text-rose-950'
          }`}>
            R$ {(financialSummary.netRealProfit ?? financialSummary.netOperatingResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-800 font-medium mt-0.5">
            Receita (-) Comissões (-) Despesas
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('financial')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            activeSection === 'financial'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Faturamento Mensal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('driver_trips')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            activeSection === 'driver_trips'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Viagens por Motorista</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('destinations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            activeSection === 'destinations'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Destinos Mais Procurados</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('top_clients')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            activeSection === 'top_clients'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Clientes Frequentes (VIP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('commissions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            activeSection === 'commissions'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Configurar % Vendedores</span>
        </button>
      </div>

      {/* SECTION 1: FATURAMENTO MENSAL (VENDEDORES E MOTORISTAS) */}
      {activeSection === 'financial' && (
        <div className="space-y-4">
          {/* Tabela de Faturamento dos Vendedores */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Faturamento & Comissões por Vendedor ({periodRange.label})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Passagem padrão: R$ {financialConfig.ticketPrice.toFixed(2)}
              </span>
            </div>

            {sellerFinancialStats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum registro de vendas de passagens encontrado para este período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4">VENDEDOR</th>
                      <th className="py-2.5 px-3 text-center">PASSAGENS VENDIDAS</th>
                      <th className="py-2.5 px-3 text-center">COMISSÃO (%)</th>
                      <th className="py-2.5 px-3 text-right">FATURAMENTO BRUTO</th>
                      <th className="py-2.5 px-4 text-right">COMISSÃO A RECEBER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellerFinancialStats.map((stat, idx) => (
                      <tr key={stat.seller} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{stat.seller}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {stat.tickets} {stat.tickets === 1 ? 'passagem' : 'passagens'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-700">
                          <span className="px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200/80">
                            {stat.commissionPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                          R$ {stat.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-800 text-sm">
                          R$ {stat.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/70 text-emerald-950 font-bold border-t border-emerald-200">
                      <td className="py-3 px-4">TOTAIS DE VENDAS</td>
                      <td className="py-3 px-3 text-center">{financialSummary.totalTickets} passagens</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-3 text-right">
                        R$ {financialSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-900 font-extrabold">
                        R$ {financialSummary.totalSellerCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Tabela de Faturamento dos Motoristas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Faturamento & Viagens por Motorista ({periodRange.label})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Diária/Viagem padrão: R$ {financialConfig.driverTripPrice.toFixed(2)}
              </span>
            </div>

            {driverStats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum motorista cadastrado no sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4">MOTORISTA</th>
                      <th className="py-2.5 px-3 text-center">VIAGENS REALIZADAS</th>
                      <th className="py-2.5 px-3 text-center">PASSAGEIROS TRANSPORTADOS</th>
                      <th className="py-2.5 px-4 text-right">FATURAMENTO DO MOTORISTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverStats.map((stat, idx) => (
                      <tr key={stat.driverId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{stat.driverName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {stat.tripsCount} {stat.tripsCount === 1 ? 'viagem' : 'viagens'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700">
                          {stat.passengersCount} passageiros
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-blue-800 text-sm">
                          R$ {stat.totalPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50/70 text-blue-950 font-bold border-t border-blue-200">
                      <td className="py-3 px-4">TOTAIS DE MOTORISTAS</td>
                      <td className="py-3 px-3 text-center">{financialSummary.totalTrips} viagens</td>
                      <td className="py-3 px-3 text-center">-</td>
                      <td className="py-3 px-4 text-right text-blue-900 font-extrabold">
                        R$ {financialSummary.totalDriverPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: VIAGENS POR MOTORISTA & QUANTAS FEZ */}
      {activeSection === 'driver_trips' && (
        <div className="space-y-4">
          {/* Driver Filter Selector */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filtrar Viagens por Motorista:
              </span>
              <span className="text-[11px] text-slate-500">
                {displayedDriverTrips.length} viagem(ns) no período
              </span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedDriverFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedDriverFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos os Motoristas ({periodTrips.length})
              </button>

              {drivers.map((drv) => {
                const count = periodTrips.filter((t) => t.driverId === drv.id).length;
                const isSelected = selectedDriverFilter === drv.id;
                return (
                  <button
                    key={drv.id}
                    type="button"
                    onClick={() => setSelectedDriverFilter(drv.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{drv.fullName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards de Resumo de Cada Motorista */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {driverStats.map((stat) => (
              <div
                key={stat.driverId}
                className={`bg-white rounded-2xl border p-4 shadow-2xs transition ${
                  selectedDriverFilter === stat.driverId
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {stat.driverName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {stat.tripsCount} {stat.tripsCount === 1 ? 'viagem' : 'viagens'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-medium block">Passageiros</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {stat.passengersCount}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-medium block">Faturamento</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      R$ {stat.totalPayout.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDriverFilter(stat.driverId)}
                  className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Ver {stat.tripsCount} viagem(ns) detalhada(s)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Lista Detalhada das Viagens Realizadas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Relação de Viagens do Período ({displayedDriverTrips.length})</span>
              </h3>
            </div>

            {displayedDriverTrips.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma viagem registrada para o filtro e período selecionados.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedDriverTrips.map((trip, idx) => {
                  const driver = driverMap.get(trip.driverId);
                  return (
                    <div key={trip.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                              {trip.origin} → {trip.destination}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                              {trip.date}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Motorista: <strong className="text-slate-700">{driver ? driver.fullName : 'Não alocado'}</strong></span>
                            <span>•</span>
                            <span>{trip.passengerIds.length} passageiro(s) a bordo</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                          R$ {financialConfig.driverTripPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: DESTINOS MAIS PROCURADOS */}
      {activeSection === 'destinations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Ranking dos Destinos Mais Procurados ({periodRange.label})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {destinationStats.length} destino(s) catalogado(s)
              </span>
            </div>

            {destinationStats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum destino registrado nos dados do período.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {destinationStats.map((dest, idx) => (
                  <div key={dest.destination} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">
                            {dest.destination}
                          </h4>
                          {dest.origins.length > 0 && (
                            <p className="text-[11px] text-slate-400">
                              Origens de partida: {dest.origins.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-emerald-800">
                          {dest.count} {dest.count === 1 ? 'passageiro' : 'passageiros'}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          {dest.percentage.toFixed(1)}% da procura
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(dest.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: CLIENTES QUE MAIS VIAJAM COM A NOSSA EMPRESA */}
      {activeSection === 'top_clients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Ranking de Passageiros Frequentes (Clientes VIP)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {topClientsStats.length} cliente(s) no ranking
              </span>
            </div>

            {topClientsStats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum passageiro encontrado para o período selecionado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topClientsStats.map((client, idx) => {
                  const isVipGold = client.tripsCount >= 4;
                  const isVipSilver = client.tripsCount >= 2;

                  return (
                    <div key={client.name} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900'
                              : idx === 2
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {client.name}
                            </h4>
                            {isVipGold ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                ⭐ CLIENTE VIP OURO
                              </span>
                            ) : isVipSilver ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                                VIP PRATA
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Destino mais procurado: <strong className="text-slate-700">{client.favoriteDestination}</strong></span>
                            <span>•</span>
                            <span>Vendedor habitual: <strong className="text-slate-700">{client.favoriteSeller}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {client.tripsCount} {client.tripsCount === 1 ? 'viagem' : 'viagens'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: CONFIGURAR % POR VENDEDOR & VALORES FINANCEIROS */}
      {activeSection === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-700" />
                <span>Configuração de Porcentagem (%) por Vendedor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina a comissão individual de cada vendedor por passagem vendida. As alterações afetam imediatamente os cálculos financeiros e relatórios da Osnir Turismo.
              </p>
            </div>

            {/* Quick General Commission Banner */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">
                Porcentagem Padrão para Novos Vendedores: <strong>{financialConfig.defaultCommissionPercent}%</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-emerald-800 font-bold underline hover:text-emerald-950 cursor-pointer"
              >
                Alterar Padrão
              </button>
            </div>

            {/* List of Sellers with inline commission editors */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {allSellers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhum vendedor cadastrado até o momento. Ao cadastrar um passageiro e informar o vendedor, ele aparecerá aqui automaticamente.
                </div>
              ) : (
                allSellers.map((sellerName) => {
                  const currentRate =
                    sellerCommissions[sellerName] !== undefined
                      ? sellerCommissions[sellerName]
                      : financialConfig.defaultCommissionPercent;

                  const tempInput = customRates[sellerName] !== undefined ? customRates[sellerName] : currentRate.toString();

                  return (
                    <div
                      key={sellerName}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          {sellerName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Comissão atual: <strong className="text-emerald-700">{currentRate}%</strong> por passagem
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={tempInput}
                            onChange={(e) => {
                              setCustomRates({
                                ...customRates,
                                [sellerName]: e.target.value,
                              });
                            }}
                            className="w-24 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-800 text-center pr-6 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            %
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(tempInput);
                            handleSaveCommissionRate(sellerName, val);
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO FINANCEIRA GLOBAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm sm:text-base font-extrabold">
                  Configurações Financeiras da Empresa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFinancialConfig} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Estes valores são utilizados para gerar com exatidão os balanços mensais, relatórios de faturamento e repasses da Osnir Turismo.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Valor Médio Padrão da Passagem (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={financialConfig.ticketPrice}
                    onChange={(e) =>
                      setFinancialConfig({
                        ...financialConfig,
                        ticketPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Valor cobrado por passageiro para cálculo do faturamento bruto.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Valor Padrão Repassado por Viagem ao Motorista (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={financialConfig.driverTripPrice}
                    onChange={(e) =>
                      setFinancialConfig({
                        ...financialConfig,
                        driverTripPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Diária ou valor fixo pago ao motorista por viagem realizada.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Porcentagem Padrão de Comissão do Vendedor (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={financialConfig.defaultCommissionPercent}
                    onChange={(e) =>
                      setFinancialConfig({
                        ...financialConfig,
                        defaultCommissionPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Taxa aplicada aos vendedores que não tiverem comissão personalizada.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
