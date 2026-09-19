import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Fuel,
  Utensils,
  Wrench,
  BedDouble,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Car,
  Users,
  PlusCircle,
  Filter,
  Search,
  Trash2,
  Edit3,
  Printer,
  Share2,
  ArrowRight,
  Percent,
  MapPin,
  Flag,
  HelpCircle,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Trip,
  Passenger,
  Driver,
  Expense,
  TripClosing,
  CompanyConfig,
  FinancialConfig,
  SellerCommissionConfig,
  DriverCommissionConfig,
} from '../types';
import {
  getStoredExpenses,
  saveExpenses,
  getStoredTripClosings,
  saveTripClosings,
  getStoredFinancialConfig,
  getStoredDestinationPrices,
  getStoredSellerCommissions,
  getStoredDriverCommissions,
  getTicketPriceForDestination,
  calculateDriverTripPayout,
  normalizeDestination,
} from '../utils/storage';

interface TripClosingManagerProps {
  trips: Trip[];
  passengers: Passenger[];
  drivers: Driver[];
  companyConfig?: CompanyConfig;
  onNavigateToPricing?: () => void;
  onExpensesChanged?: () => void;
}

export const TripClosingManager: React.FC<TripClosingManagerProps> = ({
  trips,
  passengers,
  drivers,
  companyConfig,
  onNavigateToPricing,
  onExpensesChanged,
}) => {
  const primaryColor = companyConfig?.primaryColor || '#065f46';
  const companyName = companyConfig?.companyName || 'OSNIR TURISMO';

  // Storage states
  const [expenses, setExpenses] = useState<Expense[]>(getStoredExpenses);
  const [tripClosings, setTripClosings] = useState<Record<string, TripClosing>>(getStoredTripClosings);
  const [financialConfig] = useState<FinancialConfig>(getStoredFinancialConfig);
  const [destinationPrices] = useState<Record<string, number>>(getStoredDestinationPrices);
  const [sellerCommissions] = useState<SellerCommissionConfig>(getStoredSellerCommissions);
  const [driverCommissions] = useState<DriverCommissionConfig>(getStoredDriverCommissions);

  // Active view tab inside Closing: 'trips-closing' | 'expenses-list'
  const [activeSubTab, setActiveSubTab] = useState<'trips-closing' | 'expenses-list'>('trips-closing');

  // Filter by Month / Period
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'settled'>('all');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseTripId, setExpenseTripId] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('combustivel');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Trip Closing Detail / Receipt Modal
  const [receiptTrip, setReceiptTrip] = useState<Trip | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Drivers lookup map
  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  // Passengers lookup map
  const passengerMap = useMemo(() => {
    const map = new Map<string, Passenger>();
    passengers.forEach((p) => map.set(p.id, p));
    return map;
  }, [passengers]);

  // Available distinct months from trips & expenses
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    trips.forEach((t) => {
      if (t.date && t.date.length >= 7) months.add(t.date.substring(0, 7));
    });
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) months.add(e.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [trips, expenses]);

  // Filter trips by period
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (selectedPeriod !== 'all') {
        if (!t.date || !t.date.startsWith(selectedPeriod)) return false;
      }
      const closing = tripClosings[t.id];
      const currentStatus = closing?.status || 'open';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const drv = driverMap.get(t.driverId)?.fullName.toLowerCase() || '';
        const orig = (t.origin || '').toLowerCase();
        const dest = (t.destination || '').toLowerCase();
        const dt = (t.date || '').toLowerCase();
        if (!drv.includes(query) && !orig.includes(query) && !dest.includes(query) && !dt.includes(query)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [trips, selectedPeriod, statusFilter, searchQuery, tripClosings, driverMap]);

  // Filter expenses by period
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedPeriod !== 'all') {
        if (!e.date || !e.date.startsWith(selectedPeriod)) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const notes = (e.notes || '').toLowerCase();
        if (!desc.includes(query) && !cat.includes(query) && !notes.includes(query)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [expenses, selectedPeriod, searchQuery]);

  // Calculate detailed financial metrics for each trip
  const tripFinancialsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        grossRevenue: number;
        sellerCommissions: number;
        driverPayout: number;
        expensesTotal: number;
        netProfit: number;
        profitMargin: number;
        passengersCount: number;
        expensesList: Expense[];
        closingStatus: 'open' | 'closed' | 'settled';
      }
    >();

    trips.forEach((trip) => {
      const tripPassengers = passengers.filter((p) => trip.passengerIds.includes(p.id));
      const passengersCount = tripPassengers.length;

      // 1. Gross Revenue (Passagens)
      let grossRevenue = 0;
      let totalSellerCommissions = 0;

      tripPassengers.forEach((p) => {
        const price = getTicketPriceForDestination(
          p.destination,
          destinationPrices,
          financialConfig.ticketPrice,
          p.origin
        );
        grossRevenue += price;

        // Seller commission
        const sellerRate =
          p.seller && sellerCommissions[p.seller] !== undefined
            ? sellerCommissions[p.seller]
            : financialConfig.defaultCommissionPercent;
        totalSellerCommissions += (price * sellerRate) / 100;
      });

      // 2. Driver Payout
      const closing = tripClosings[trip.id];
      const driverPayout = calculateDriverTripPayout(
        trip,
        passengers,
        destinationPrices,
        financialConfig,
        driverCommissions,
        closing
      );

      // 3. Expenses linked to this trip
      const tripExpenses = expenses.filter((e) => e.tripId === trip.id);
      const expensesTotal = tripExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // 4. Net Profit & Margin
      const netProfit = grossRevenue - totalSellerCommissions - driverPayout - expensesTotal;
      const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

      map.set(trip.id, {
        grossRevenue,
        sellerCommissions: totalSellerCommissions,
        driverPayout,
        expensesTotal,
        netProfit,
        profitMargin,
        passengersCount,
        expensesList: tripExpenses,
        closingStatus: closing?.status || 'open',
      });
    });

    return map;
  }, [trips, passengers, destinationPrices, financialConfig, sellerCommissions, driverCommissions, tripClosings, expenses]);

  // Consolidated Financial Totals for selected period
  const periodConsolidated = useMemo(() => {
    let totalGrossRevenue = 0;
    let totalSellerCommissions = 0;
    let totalDriverPayouts = 0;
    let totalTripExpenses = 0;
    let totalGeneralExpenses = 0;

    filteredTrips.forEach((t) => {
      const fin = tripFinancialsMap.get(t.id);
      if (fin) {
        totalGrossRevenue += fin.grossRevenue;
        totalSellerCommissions += fin.sellerCommissions;
        totalDriverPayouts += fin.driverPayout;
        totalTripExpenses += fin.expensesTotal;
      }
    });

    // General expenses not linked to any trip in the period
    filteredExpenses.forEach((e) => {
      if (!e.tripId) {
        totalGeneralExpenses += Number(e.amount) || 0;
      }
    });

    const totalAllExpenses = totalTripExpenses + totalGeneralExpenses;
    const netProfit = totalGrossRevenue - totalSellerCommissions - totalDriverPayouts - totalAllExpenses;
    const profitMargin = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;

    return {
      tripsCount: filteredTrips.length,
      totalGrossRevenue,
      totalSellerCommissions,
      totalDriverPayouts,
      totalTripExpenses,
      totalGeneralExpenses,
      totalAllExpenses,
      netProfit,
      profitMargin,
    };
  }, [filteredTrips, filteredExpenses, tripFinancialsMap]);

  // Expenses totals by category
  const expensesByCategory = useMemo(() => {
    const catMap: Record<Expense['category'], { label: string; total: number; count: number }> = {
      combustivel: { label: 'Combustível', total: 0, count: 0 },
      pedagio: { label: 'Pedágio', total: 0, count: 0 },
      alimentacao: { label: 'Alimentação', total: 0, count: 0 },
      manutencao: { label: 'Manutenção / Oficina', total: 0, count: 0 },
      hospedagem: { label: 'Hospedagem', total: 0, count: 0 },
      diaria: { label: 'Diárias Extras', total: 0, count: 0 },
      outro: { label: 'Outras Despesas', total: 0, count: 0 },
    };

    filteredExpenses.forEach((e) => {
      const cat = e.category in catMap ? e.category : 'outro';
      catMap[cat].total += Number(e.amount) || 0;
      catMap[cat].count += 1;
    });

    return Object.entries(catMap).map(([key, val]) => ({
      category: key as Expense['category'],
      ...val,
    }));
  }, [filteredExpenses]);

  // Save Expense (Create or Edit)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount.replace(',', '.'));

    if (!expenseDescription.trim()) {
      showToast('Informe a descrição da despesa.', 'error');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Informe um valor de despesa válido maior que zero.', 'error');
      return;
    }

    if (editingExpenseId) {
      const updated = expenses.map((item) =>
        item.id === editingExpenseId
          ? {
              ...item,
              tripId: expenseTripId || undefined,
              category: expenseCategory,
              description: expenseDescription.trim(),
              amount: parsedAmount,
              date: expenseDate,
              notes: expenseNotes.trim() || undefined,
            }
          : item
      );
      setExpenses(updated);
      saveExpenses(updated);
      showToast('Despesa atualizada com sucesso!');
    } else {
      const newExpense: Expense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tripId: expenseTripId || undefined,
        category: expenseCategory,
        description: expenseDescription.trim(),
        amount: parsedAmount,
        date: expenseDate,
        notes: expenseNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [newExpense, ...expenses];
      setExpenses(updated);
      saveExpenses(updated);
      showToast('Despesa lançada com sucesso!');
    }

    onExpensesChanged?.();
    handleCloseExpenseModal();
  };

  const handleOpenNewExpenseModal = (tripId?: string) => {
    setEditingExpenseId(null);
    setExpenseTripId(tripId || '');
    setExpenseCategory('combustivel');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseNotes('');
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseTripId(expense.tripId || '');
    setExpenseCategory(expense.category);
    setExpenseDescription(expense.description);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.date);
    setExpenseNotes(expense.notes || '');
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta despesa?')) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveExpenses(updated);
      onExpensesChanged?.();
      showToast('Despesa excluída com sucesso.');
    }
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpenseId(null);
  };

  // Change Trip Closing Status
  const handleUpdateTripStatus = (tripId: string, status: 'open' | 'closed' | 'settled') => {
    const existing = tripClosings[tripId] || { tripId, status: 'open' };
    const updated = {
      ...tripClosings,
      [tripId]: {
        ...existing,
        status,
        closedAt: status !== 'open' ? new Date().toISOString() : undefined,
      },
    };
    setTripClosings(updated);
    saveTripClosings(updated);
    showToast(`Status da viagem atualizado para: ${status === 'settled' ? 'Liquidada' : status === 'closed' ? 'Fechada' : 'Em Aberto'}`);
  };

  // Helper for Category Icon & Badge
  const getCategoryDetails = (category: Expense['category']) => {
    switch (category) {
      case 'combustivel':
        return { label: 'Combustível', icon: Fuel, color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'pedagio':
        return { label: 'Pedágio', icon: Receipt, color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'alimentacao':
        return { label: 'Alimentação', icon: Utensils, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'manutencao':
        return { label: 'Manutenção', icon: Wrench, color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'hospedagem':
        return { label: 'Hospedagem', icon: BedDouble, color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'diaria':
        return { label: 'Diária Extra', icon: DollarSign, color: 'bg-orange-100 text-orange-900 border-orange-300' };
      default:
        return { label: 'Outro', icon: FileText, color: 'bg-slate-100 text-slate-900 border-slate-300' };
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Format date
  const formatDateBR = (dtStr: string) => {
    if (!dtStr) return '-';
    const parts = dtStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dtStr;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border-2 shadow-sm transition ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HERO BANNER: Fechamento das Viagens e Apuração de Lucro */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border-2 border-white/40 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Fechamento das Viagens & Apuração de Lucro
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
                  DRE Operacional
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Controle o faturamento bruto de cada viagem, deduza as comissões de vendedores, o custo do motorista e as <strong>despesas operacionais (combustível, pedágios, etc.)</strong> para saber o lucro real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewExpenseModal()}
              className="px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Adicionar Despesa</span>
            </button>
            {onNavigateToPricing && (
              <button
                type="button"
                onClick={onNavigateToPricing}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ajustar Valores & Comissões</span>
              </button>
            )}
          </div>
        </div>

        {/* PERIOD SELECTOR & QUICK STATS */}
        <div className="mt-5 pt-4 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Filtrar Período:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="all">Todas as Viagens e Despesas</option>
              {availableMonths.map((m) => {
                const [ano, mes] = m.split('-');
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                const label = `${monthNames[parseInt(mes, 10) - 1]} / ${ano}`;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sub-tab switcher: Fechamento de Viagens vs. Despesas */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border-2 border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('trips-closing')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeSubTab === 'trips-closing'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fechamento por Viagem ({filteredTrips.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('expenses-list')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeSubTab === 'expenses-list'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Despesas Cadastradas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-extrabold">
                {filteredExpenses.length}
              </span>
            </button>
          </div>
        </div>

        {/* 5 CONSOLIDATED KPI CARDS (DRE) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {/* Card 1: Faturamento Bruto */}
          <div className="bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Faturamento Bruto
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {formatCurrency(periodConsolidated.totalGrossRevenue)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              {periodConsolidated.tripsCount} viagem(ns)
            </span>
          </div>

          {/* Card 2: Comissões Vendedores */}
          <div className="bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              (-) Comissões Vendedores
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-800 mt-0.5">
              {formatCurrency(periodConsolidated.totalSellerCommissions)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              devido aos vendedores
            </span>
          </div>

          {/* Card 3: Motoristas */}
          <div className="bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">
              (-) Custo Motoristas
            </span>
            <div className="text-lg sm:text-xl font-black text-blue-900 mt-0.5">
              {formatCurrency(periodConsolidated.totalDriverPayouts)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              diárias / comissões
            </span>
          </div>

          {/* Card 4: Despesas Totais */}
          <div className="bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">
                (-) Despesas Totais
              </span>
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-800 mt-0.5">
              {formatCurrency(periodConsolidated.totalAllExpenses)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              diesel, pedágio, etc.
            </span>
          </div>

          {/* Card 5: LUCRO LÍQUIDO REAL */}
          <div
            className={`col-span-2 sm:col-span-1 rounded-2xl p-3 border-2 shadow-2xs ${
              periodConsolidated.netProfit >= 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wide block">
                (=) Lucro Líquido
              </span>
              {periodConsolidated.netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-700" />
              )}
            </div>
            <div
              className={`text-lg sm:text-xl font-black mt-0.5 ${
                periodConsolidated.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {formatCurrency(periodConsolidated.netProfit)}
            </div>
            <span className="text-[10px] font-bold block mt-0.5">
              Margem: {periodConsolidated.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: FECHAMENTO DE VIAGENS INDIVIDUAIS */}
      {activeSubTab === 'trips-closing' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Status do Fechamento:</span>
              <div className="flex items-center gap-1">
                {(['all', 'open', 'closed', 'settled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'all'
                      ? 'Todos'
                      : st === 'open'
                      ? 'Em Aberto'
                      : st === 'closed'
                      ? 'Fechadas'
                      : 'Liquidadas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar viagem, motorista ou rota..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          {/* Trips Closing Cards List */}
          {filteredTrips.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma viagem encontrada para este filtro</p>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre ou importe viagens na guia <strong>Viagens</strong> para realizar o fechamento e apurar o lucro.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTrips.map((trip) => {
                const fin = tripFinancialsMap.get(trip.id) || {
                  grossRevenue: 0,
                  sellerCommissions: 0,
                  driverPayout: 0,
                  expensesTotal: 0,
                  netProfit: 0,
                  profitMargin: 0,
                  passengersCount: 0,
                  expensesList: [],
                  closingStatus: 'open' as const,
                };
                const driver = driverMap.get(trip.driverId);
                const isExpanded = expandedTripId === trip.id;

                return (
                  <div
                    key={trip.id}
                    className={`bg-white rounded-2xl border-2 transition shadow-2xs overflow-hidden ${
                      fin.closingStatus === 'settled'
                        ? 'border-emerald-300'
                        : fin.closingStatus === 'closed'
                        ? 'border-blue-300'
                        : 'border-slate-300'
                    }`}
                  >
                    {/* Top Row: Trip summary info */}
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50/50">
                      {/* Left: Date, Route, Driver */}
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-900 text-white text-center shrink-0 min-w-14">
                          <span className="text-[10px] uppercase font-bold block text-slate-300">Data</span>
                          <span className="text-xs font-black block">{formatDateBR(trip.date)}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 truncate">
                              {trip.origin ? `${trip.origin} → ` : ''}{trip.destination}
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                fin.closingStatus === 'settled'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : fin.closingStatus === 'closed'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {fin.closingStatus === 'settled'
                                ? '✓ Liquidada'
                                : fin.closingStatus === 'closed'
                                ? 'Fechada'
                                : 'Em Aberto'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                            <span className="flex items-center gap-1 font-semibold">
                              <Car className="w-3.5 h-3.5 text-slate-500" />
                              {driver ? driver.fullName : 'Sem motorista'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              {fin.passengersCount} passageiro(s)
                            </span>
                            {fin.expensesList.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-bold text-rose-700">
                                  <Receipt className="w-3.5 h-3.5" />
                                  {fin.expensesList.length} despesa(s)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                        {/* Add Expense shortcut */}
                        <button
                          type="button"
                          onClick={() => handleOpenNewExpenseModal(trip.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Lançar despesa nesta viagem (combustível, pedágio, etc.)"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Despesa</span>
                        </button>

                        {/* Status Toggle Dropdown */}
                        <select
                          value={fin.closingStatus}
                          onChange={(e) =>
                            handleUpdateTripStatus(
                              trip.id,
                              e.target.value as 'open' | 'closed' | 'settled'
                            )
                          }
                          className="px-2.5 py-1.5 text-xs font-bold bg-white border-2 border-slate-300 rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="open">Em Aberto</option>
                          <option value="closed">Fechada</option>
                          <option value="settled">Liquidada</option>
                        </select>

                        {/* Receipt / Print Modal */}
                        <button
                          type="button"
                          onClick={() => setReceiptTrip(trip)}
                          className="p-1.5 text-slate-700 bg-white hover:bg-slate-100 border-2 border-slate-300 rounded-xl transition cursor-pointer"
                          title="Visualizar Comprovante de Fechamento da Viagem"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Expand / Collapse Details */}
                        <button
                          type="button"
                          onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-300 rounded-xl transition cursor-pointer"
                          title={isExpanded ? 'Recolher detalhes' : 'Ver detalhes e despesas'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Financial Numbers Strip */}
                    <div className="p-3.5 bg-white border-t-2 border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {/* Receita */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Receita Bruta</span>
                        <span className="font-extrabold text-slate-900 block mt-0.5">
                          {formatCurrency(fin.grossRevenue)}
                        </span>
                      </div>

                      {/* Vendedores */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-amber-700 font-bold block uppercase">(-) Comissões</span>
                        <span className="font-extrabold text-amber-800 block mt-0.5">
                          {formatCurrency(fin.sellerCommissions)}
                        </span>
                      </div>

                      {/* Motorista */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-blue-700 font-bold block uppercase">(-) Motorista</span>
                        <span className="font-extrabold text-blue-900 block mt-0.5">
                          {formatCurrency(fin.driverPayout)}
                        </span>
                      </div>

                      {/* Despesas */}
                      <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200">
                        <span className="text-[10px] text-rose-700 font-bold block uppercase">(-) Despesas</span>
                        <span className="font-extrabold text-rose-800 block mt-0.5">
                          {formatCurrency(fin.expensesTotal)}
                        </span>
                      </div>

                      {/* Lucro Líquido */}
                      <div
                        className={`col-span-2 sm:col-span-1 p-2 rounded-xl border ${
                          fin.netProfit >= 0
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-300 text-rose-950'
                        }`}
                      >
                        <span className="text-[10px] font-black block uppercase">(=) Lucro Líquido</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span
                            className={`font-black text-sm ${
                              fin.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
                            }`}
                          >
                            {formatCurrency(fin.netProfit)}
                          </span>
                          <span className="text-[10px] font-bold">
                            {fin.profitMargin.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED SECTION: List of Expenses for this Trip & Action Buttons */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 border-t-2 border-slate-200 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-slate-600" />
                            <span>Despesas Lançadas nesta Viagem ({fin.expensesList.length})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleOpenNewExpenseModal(trip.id)}
                            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Adicionar mais despesas</span>
                          </button>
                        </div>

                        {fin.expensesList.length === 0 ? (
                          <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                            Nenhuma despesa vinculada a esta viagem até o momento. Clique em <strong>"+ Adicionar mais despesas"</strong> para lançar combustível, pedágio ou refeição.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {fin.expensesList.map((exp) => {
                              const cat = getCategoryDetails(exp.category);
                              const CatIcon = cat.icon;
                              return (
                                <div
                                  key={exp.id}
                                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className={`p-1.5 rounded-lg border shrink-0 ${cat.color}`}>
                                      <CatIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-slate-800 block truncate">
                                        {exp.description}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {cat.label} • {formatDateBR(exp.date)}
                                        {exp.notes ? ` • ${exp.notes}` : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className="font-extrabold text-rose-700">
                                      {formatCurrency(exp.amount)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleEditExpense(exp)}
                                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                      title="Editar despesa"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExpense(exp.id)}
                                      className="p-1 text-rose-400 hover:text-rose-700 cursor-pointer"
                                      title="Excluir despesa"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LISTA DE DESPESAS (COM FILTROS & TOTALIZADORES) */}
      {activeSubTab === 'expenses-list' && (
        <div className="space-y-4">
          {/* Categories Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {expensesByCategory.map((cat) => {
              const details = getCategoryDetails(cat.category);
              const Icon = details.icon;
              return (
                <div key={cat.category} className="bg-white p-2.5 rounded-2xl border-2 border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 truncate">{details.label}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 mt-1">
                    {formatCurrency(cat.total)}
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {cat.count} registro(s)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Table of all Expenses */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Todas as Despesas Lançadas ({filteredExpenses.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Despesas de viagens e custos operacionais gerais
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenNewExpenseModal()}
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Nova Despesa</span>
                </button>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhuma despesa cadastrada neste período</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Utilize o botão acima para cadastrar gastos como combustível, pedágio ou manutenção.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryDetails(exp.category);
                  const CatIcon = cat.icon;
                  const linkedTrip = exp.tripId ? trips.find((t) => t.id === exp.tripId) : null;
                  const tripDriver = linkedTrip ? driverMap.get(linkedTrip.driverId) : null;

                  return (
                    <div
                      key={exp.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border-2 border-slate-200 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${cat.color}`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                              {exp.description}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {cat.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span>Data: <strong>{formatDateBR(exp.date)}</strong></span>
                            {linkedTrip ? (
                              <>
                                <span>•</span>
                                <span className="text-emerald-800 font-bold">
                                  Viagem: {linkedTrip.origin ? `${linkedTrip.origin} → ` : ''}{linkedTrip.destination}
                                  {tripDriver ? ` (${tripDriver.fullName})` : ''}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 italic">Despesa Geral da Frota</span>
                              </>
                            )}
                            {exp.notes && (
                              <>
                                <span>•</span>
                                <span>Obs: {exp.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <span className="text-base font-black text-rose-700">
                          {formatCurrency(exp.amount)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditExpense(exp)}
                            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition cursor-pointer"
                            title="Editar despesa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 rounded-xl transition cursor-pointer"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR DESPESA */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className="px-5 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm sm:text-base font-black">
                  {editingExpenseId ? 'Editar Despesa' : 'Lançar Nova Despesa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseExpenseModal}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              {/* Trip Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Vincular a uma Viagem (Opcional):
                </label>
                <select
                  value={expenseTripId}
                  onChange={(e) => setExpenseTripId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="">Despesa Geral / Operacional (Não vinculada a uma viagem)</option>
                  {trips.map((t) => {
                    const drv = driverMap.get(t.driverId);
                    return (
                      <option key={t.id} value={t.id}>
                        {formatDateBR(t.date)} - {t.origin ? `${t.origin} → ` : ''}{t.destination} ({drv ? drv.fullName : 'Sem motorista'})
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Selecione a viagem para que o valor seja deduzido diretamente do lucro dela.
                </span>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Categoria da Despesa: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="combustivel">⛽ Combustível (Diesel / Gasolina)</option>
                    <option value="pedagio">🛣️ Pedágio</option>
                    <option value="alimentacao">🍽️ Alimentação / Refeição</option>
                    <option value="manutencao">🔧 Manutenção / Oficina / Pneu</option>
                    <option value="hospedagem">🏨 Hospedagem / Pernoite</option>
                    <option value="diaria">💵 Diária Extra / Ajudante</option>
                    <option value="outro">📋 Outras Despesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Valor da Despesa (R$): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-black text-rose-700 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Descrição da Despesa: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Ex: Abastecimento Posto Graal km 120"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Data: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Observações / N° do Recibo (Opcional):
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Ex: Nota Fiscal 1234, pago via Pix pelo motorista"
                  className="w-full px-3 py-2 text-xs border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseExpenseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border-2 border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editingExpenseId ? 'Salvar Alterações' : 'Lançar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / RECIBO DE FECHAMENTO DA VIAGEM */}
      {receiptTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div
              className="px-6 py-4 text-white flex items-center justify-between shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm sm:text-base font-black">
                  Demonstrativo de Fechamento da Viagem
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptTrip(null)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 space-y-4 overflow-y-auto" id="printable-closing-receipt">
              {/* Company Banner */}
              <div className="text-center pb-4 border-b-2 border-slate-200">
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                  {companyName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {companyConfig?.phone ? `Telefone: ${companyConfig.phone} • ` : ''}
                  Fechamento Operacional e Financeiro de Viagem
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border">
                  Viagem: {formatDateBR(receiptTrip.date)} - {receiptTrip.origin ? `${receiptTrip.origin} → ` : ''}{receiptTrip.destination}
                </div>
              </div>

              {(() => {
                const fin = tripFinancialsMap.get(receiptTrip.id);
                const drv = driverMap.get(receiptTrip.driverId);
                const tripPassengers = passengers.filter((p) => receiptTrip.passengerIds.includes(p.id));

                if (!fin) return null;

                return (
                  <div className="space-y-4 text-xs">
                    {/* Basic Trip Info */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Motorista:</span>
                        <span className="font-extrabold text-slate-900">{drv ? drv.fullName : 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Passageiros:</span>
                        <span className="font-extrabold text-slate-900">{tripPassengers.length} clientes a bordo</span>
                      </div>
                    </div>

                    {/* DRE Breakdown */}
                    <div className="border-2 border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                      <div className="p-3 bg-slate-100 flex items-center justify-between font-bold text-slate-800">
                        <span>Descrição</span>
                        <span>Valor (R$)</span>
                      </div>

                      {/* 1. Receita Bruta */}
                      <div className="p-3 flex items-center justify-between bg-emerald-50/40 font-bold text-emerald-950">
                        <span>(+) Faturamento Bruto ({tripPassengers.length} passagens)</span>
                        <span>{formatCurrency(fin.grossRevenue)}</span>
                      </div>

                      {/* 2. Deduções: Comissões */}
                      <div className="p-3 flex items-center justify-between text-amber-900">
                        <span>(-) Comissões dos Vendedores</span>
                        <span className="font-bold">{formatCurrency(fin.sellerCommissions)}</span>
                      </div>

                      {/* 3. Deduções: Motorista */}
                      <div className="p-3 flex items-center justify-between text-blue-900">
                        <span>(-) Remuneração do Motorista</span>
                        <span className="font-bold">{formatCurrency(fin.driverPayout)}</span>
                      </div>

                      {/* 4. Deduções: Despesas detalhadas */}
                      <div className="p-3 bg-rose-50/40">
                        <div className="flex items-center justify-between text-rose-900 font-bold">
                          <span>(-) Total de Despesas da Viagem</span>
                          <span>{formatCurrency(fin.expensesTotal)}</span>
                        </div>
                        {fin.expensesList.length > 0 && (
                          <div className="mt-2 space-y-1 pl-3 border-l-2 border-rose-300 text-[11px] text-slate-600">
                            {fin.expensesList.map((exp) => (
                              <div key={exp.id} className="flex items-center justify-between">
                                <span>• {exp.description} ({getCategoryDetails(exp.category).label})</span>
                                <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 5. Lucro Líquido Final */}
                      <div
                        className={`p-3.5 flex items-center justify-between font-black text-sm ${
                          fin.netProfit >= 0
                            ? 'bg-emerald-100 text-emerald-950'
                            : 'bg-rose-100 text-rose-950'
                        }`}
                      >
                        <span>(=) LUCRO LÍQUIDO FINAL</span>
                        <span>{formatCurrency(fin.netProfit)} ({fin.profitMargin.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-6 grid grid-cols-2 gap-6 text-center text-[10px] text-slate-500">
                      <div>
                        <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                          {drv ? drv.fullName : 'Motorista'}
                        </div>
                        <span>Assinatura do Motorista</span>
                      </div>
                      <div>
                        <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                          {companyName}
                        </div>
                        <span>Responsável pelo Fechamento</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setReceiptTrip(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Demonstrativo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
