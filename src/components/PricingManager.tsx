import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  MapPin,
  Flag,
  PlusCircle,
  Search,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  TrendingUp,
  Tag,
  ArrowRight,
  Info,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Percent,
  Car,
  Users,
  Sliders,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';
import {
  Passenger,
  Trip,
  Driver,
  CompanyConfig,
  FinancialConfig,
  SellerCommissionConfig,
  DriverCommissionConfig,
} from '../types';
import {
  getStoredDestinationPrices,
  saveDestinationPrices,
  getStoredFinancialConfig,
  saveFinancialConfig,
  getStoredSellerCommissions,
  saveSellerCommissions,
  getStoredDriverCommissions,
  saveDriverCommissions,
  normalizeDestination,
  getTicketPriceForDestination,
  DEFAULT_DESTINATION_PRICES,
} from '../utils/storage';

interface PricingManagerProps {
  passengers: Passenger[];
  trips: Trip[];
  drivers?: Driver[];
  companyConfig?: CompanyConfig;
  onPricesChanged?: () => void;
  initialTab?: 'routes' | 'sellers' | 'drivers' | 'base';
}

export const PricingManager: React.FC<PricingManagerProps> = ({
  passengers,
  trips,
  drivers = [],
  companyConfig,
  onPricesChanged,
  initialTab = 'routes',
}) => {
  const primaryColor = companyConfig?.primaryColor || '#065f46';

  // Sub-tabs in Pricing Manager
  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'sellers' | 'drivers' | 'base'>(initialTab);

  // Destination/Route Prices state
  const [destinationPrices, setDestinationPrices] = useState<Record<string, number>>(getStoredDestinationPrices);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(getStoredFinancialConfig);
  const [sellerCommissions, setSellerCommissions] = useState<SellerCommissionConfig>(getStoredSellerCommissions);
  const [driverCommissions, setDriverCommissions] = useState<DriverCommissionConfig>(getStoredDriverCommissions);

  // Form State for Adding / Editing a Route Price
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Seller commission inputs (temp inputs for editing)
  const [sellerInputs, setSellerInputs] = useState<Record<string, string>>({});
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPercent, setNewSellerPercent] = useState('');

  // Driver commission inputs (temp inputs for editing)
  const [driverInputs, setDriverInputs] = useState<
    Record<string, { type: 'fixed' | 'percent'; value: string }>
  >({});

  // Base values editing
  const [baseTicketPriceInput, setBaseTicketPriceInput] = useState(financialConfig.ticketPrice.toString());
  const [baseDriverTripPriceInput, setBaseDriverTripPriceInput] = useState(financialConfig.driverTripPrice.toString());
  const [baseDriverPaymentType, setBaseDriverPaymentType] = useState<'fixed' | 'percent'>(
    financialConfig.driverPaymentType || 'fixed'
  );
  const [baseDriverCommissionPercentInput, setBaseDriverCommissionPercentInput] = useState(
    (financialConfig.driverCommissionPercent || 15).toString()
  );
  const [baseDefaultCommissionInput, setBaseDefaultCommissionInput] = useState(
    financialConfig.defaultCommissionPercent.toString()
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Discover distinct origins used across passengers & trips
  const systemDetectedOrigins = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.origin && p.origin.trim()) {
        set.add(normalizeDestination(p.origin));
      }
    });
    trips.forEach((t) => {
      if (t.origin && t.origin.trim()) {
        set.add(normalizeDestination(t.origin));
      }
    });
    return Array.from(set).sort();
  }, [passengers, trips]);

  // Discover distinct destinations used across passengers & trips
  const systemDetectedDestinations = useMemo(() => {
    const set = new Set<string>();
    passengers.forEach((p) => {
      if (p.destination && p.destination.trim()) {
        set.add(normalizeDestination(p.destination));
      }
    });
    trips.forEach((t) => {
      if (t.destination && t.destination.trim()) {
        set.add(normalizeDestination(t.destination));
      }
    });
    return Array.from(set).sort();
  }, [passengers, trips]);

  // Distinct passenger routes (Origin -> Destination)
  const systemDetectedRoutes = useMemo(() => {
    const routeMap = new Map<string, { origin: string; destination: string; count: number }>();
    passengers.forEach((p) => {
      const orig = normalizeDestination(p.origin);
      const dest = normalizeDestination(p.destination);
      if (dest) {
        const key = orig ? `${orig} → ${dest}` : dest;
        const current = routeMap.get(key) || { origin: orig, destination: dest, count: 0 };
        current.count += 1;
        routeMap.set(key, current);
      }
    });
    return Array.from(routeMap.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));
  }, [passengers]);

  // Detected routes that don't have an exact price configured yet
  const unconfiguredRoutes = useMemo(() => {
    return systemDetectedRoutes.filter((item) => {
      return typeof destinationPrices[item.key] !== 'number' && typeof destinationPrices[item.destination] !== 'number';
    });
  }, [systemDetectedRoutes, destinationPrices]);

  // Sorted list of configured destination/route prices
  const configuredList = useMemo(() => {
    return Object.entries(destinationPrices)
      .map(([key, price]) => {
        let origin = '';
        let destination = key;
        if (key.includes('→')) {
          const parts = key.split('→').map((s) => s.trim());
          origin = parts[0] || '';
          destination = parts[1] || '';
        }
        return {
          key,
          origin,
          destination,
          price,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [destinationPrices]);

  // Filtered configured routes by search query
  const filteredConfiguredList = useMemo(() => {
    if (!searchQuery.trim()) return configuredList;
    const q = searchQuery.toLowerCase().trim();
    return configuredList.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q)
    );
  }, [configuredList, searchQuery]);

  // Discover all distinct sellers and their sales count
  const allSellers = useMemo(() => {
    const map = new Map<string, number>();
    passengers.forEach((p) => {
      const s = (p.seller || '').trim();
      if (s) {
        map.set(s, (map.get(s) || 0) + 1);
      }
    });
    // Also include any sellers with stored custom commission
    Object.keys(sellerCommissions).forEach((s) => {
      if (s && !map.has(s)) {
        map.set(s, 0);
      }
    });
    return Array.from(map.entries())
      .map(([seller, count]) => ({ seller, count }))
      .sort((a, b) => b.count - a.count || a.seller.localeCompare(b.seller));
  }, [passengers, sellerCommissions]);

  // Driver trips count
  const driverTripsCount = useMemo(() => {
    const map = new Map<string, number>();
    trips.forEach((t) => {
      if (t.driverId) {
        map.set(t.driverId, (map.get(t.driverId) || 0) + 1);
      }
    });
    return map;
  }, [trips]);

  // Handle Save / Update Route Price
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDest = normalizeDestination(destinationInput);
    const cleanOrig = normalizeDestination(originInput);
    const parsedPrice = parseFloat(priceInput.replace(',', '.'));

    if (!cleanDest) {
      showToast('Por favor, informe ao menos a Cidade de Destino.', 'error');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showToast('Por favor, informe um valor de passagem válido maior que zero.', 'error');
      return;
    }

    const key = cleanOrig ? `${cleanOrig} → ${cleanDest}` : cleanDest;
    const updated = { ...destinationPrices };

    if (editingKey && editingKey !== key) {
      delete updated[editingKey];
    }

    updated[key] = parsedPrice;
    setDestinationPrices(updated);
    saveDestinationPrices(updated);
    onPricesChanged?.();

    setOriginInput('');
    setDestinationInput('');
    setPriceInput('');
    setEditingKey(null);

    showToast(`Tarifa para "${key}" salva com sucesso: R$ ${parsedPrice.toFixed(2)}`);
  };

  const handleEditPrice = (key: string, origin: string, destination: string, price: number) => {
    setEditingKey(key);
    setOriginInput(origin);
    setDestinationInput(destination);
    setPriceInput(price.toString());
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setOriginInput('');
    setDestinationInput('');
    setPriceInput('');
  };

  const handleDeletePrice = (key: string) => {
    const updated = { ...destinationPrices };
    delete updated[key];
    setDestinationPrices(updated);
    saveDestinationPrices(updated);
    onPricesChanged?.();
    showToast(`Tarifa para "${key}" removida com sucesso.`);
  };

  const handleQuickAddRoute = (origin: string, destination: string) => {
    setOriginInput(origin);
    setDestinationInput(destination);
    setPriceInput(financialConfig.ticketPrice.toString());
    setEditingKey(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja carregar a tabela padrão sugerida de origens, destinos e preços?')) {
      const merged = { ...DEFAULT_DESTINATION_PRICES, ...destinationPrices };
      setDestinationPrices(merged);
      saveDestinationPrices(merged);
      onPricesChanged?.();
      showToast('Tabela de tarifas atualizada com os valores sugeridos!');
    }
  };

  // --- SELLER COMMISSIONS HANDLERS ---
  const handleSaveSellerCommission = (sellerName: string, rateValue: number) => {
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
      showToast('Por favor, informe uma porcentagem válida entre 0% e 100%.', 'error');
      return;
    }

    const updated = {
      ...sellerCommissions,
      [sellerName]: rateValue,
    };
    setSellerCommissions(updated);
    saveSellerCommissions(updated);
    onPricesChanged?.();
    showToast(`Comissão de ${sellerName} definida para ${rateValue}%!`);
  };

  const handleAddNewSeller = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSellerName.trim();
    const parsedPercent = parseFloat(newSellerPercent.replace(',', '.'));

    if (!cleanName) {
      showToast('Informe o nome do vendedor.', 'error');
      return;
    }

    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      showToast('Informe uma porcentagem válida entre 0% e 100%.', 'error');
      return;
    }

    const updated = {
      ...sellerCommissions,
      [cleanName]: parsedPercent,
    };
    setSellerCommissions(updated);
    saveSellerCommissions(updated);
    setNewSellerName('');
    setNewSellerPercent('');
    onPricesChanged?.();
    showToast(`Vendedor "${cleanName}" cadastrado com ${parsedPercent}% de comissão!`);
  };

  // --- DRIVER COMMISSIONS / REMUNERATION HANDLERS ---
  const handleSaveDriverRate = (
    driverId: string,
    driverName: string,
    type: 'fixed' | 'percent',
    val: number
  ) => {
    if (isNaN(val) || val <= 0) {
      showToast('Por favor, informe um valor válido maior que zero.', 'error');
      return;
    }

    const updated: DriverCommissionConfig = {
      ...driverCommissions,
      [driverId]: {
        type,
        value: val,
      },
    };
    setDriverCommissions(updated);
    saveDriverCommissions(updated);
    onPricesChanged?.();
    showToast(
      `Remuneração de ${driverName} salva: ${
        type === 'fixed' ? `R$ ${val.toFixed(2)} por viagem` : `${val}% da receita da viagem`
      }!`
    );
  };

  // --- GLOBAL BASE VALUES HANDLER ---
  const handleSaveGlobalBaseValues = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketP = parseFloat(baseTicketPriceInput.replace(',', '.'));
    const driverP = parseFloat(baseDriverTripPriceInput.replace(',', '.'));
    const driverPercent = parseFloat(baseDriverCommissionPercentInput.replace(',', '.'));
    const commP = parseFloat(baseDefaultCommissionInput.replace(',', '.'));

    if (isNaN(ticketP) || ticketP <= 0) {
      showToast('Informe um valor de passagem padrão válido maior que zero.', 'error');
      return;
    }
    if (isNaN(driverP) || driverP <= 0) {
      showToast('Informe um valor padrão do motorista válido maior que zero.', 'error');
      return;
    }
    if (isNaN(commP) || commP < 0 || commP > 100) {
      showToast('Informe uma comissão padrão para vendedores entre 0% e 100%.', 'error');
      return;
    }

    const updatedConfig: FinancialConfig = {
      ...financialConfig,
      ticketPrice: ticketP,
      driverTripPrice: driverP,
      driverPaymentType: baseDriverPaymentType,
      driverCommissionPercent: isNaN(driverPercent) ? 15 : driverPercent,
      defaultCommissionPercent: commP,
    };

    setFinancialConfig(updatedConfig);
    saveFinancialConfig(updatedConfig);
    onPricesChanged?.();
    showToast('Configurações e valores base salvos com sucesso!');
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border-2 shadow-sm transition ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* TOP HERO BANNER: Gestão Central de Valores e Comissões */}
      <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border-2 border-white/40 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Tabela de Valores, Tarifas & Comissões
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
                  Gestão Centralizada
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Centralize o cadastro de tarifas de passagens por trajeto (Origem → Destino), porcentagens de comissões dos vendedores e a remuneração por viagem dos motoristas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Carregar sugestões de trajetos populares"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sugerir Trajetos</span>
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION: 4 DISTINCT AREAS */}
        <div className="mt-4 pt-3 sm:mt-5 sm:pt-4 border-t-2 border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Tab 1: Tarifas de Passagens */}
          <button
            type="button"
            onClick={() => setActiveSubTab('routes')}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2 sm:gap-2.5 text-left ${
              activeSubTab === 'routes'
                ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <MapPin
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === 'routes' ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-black block truncate text-slate-900">
                Tarifas Rotas
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                {configuredList.length} cadastradas
              </span>
            </div>
          </button>

          {/* Tab 2: Comissões Vendedores */}
          <button
            type="button"
            onClick={() => setActiveSubTab('sellers')}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2 sm:gap-2.5 text-left ${
              activeSubTab === 'sellers'
                ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Percent
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === 'sellers' ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-black block truncate text-slate-900">
                Vendedores
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                {allSellers.length} vendedor(es)
              </span>
            </div>
          </button>

          {/* Tab 3: Remuneração Motoristas */}
          <button
            type="button"
            onClick={() => setActiveSubTab('drivers')}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2.5 text-left ${
              activeSubTab === 'drivers'
                ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Car
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === 'drivers' ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-black block truncate text-slate-900">
                Motoristas
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                {drivers.length} motorista(s)
              </span>
            </div>
          </button>

          {/* Tab 4: Valores Base */}
          <button
            type="button"
            onClick={() => setActiveSubTab('base')}
            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-2.5 text-left ${
              activeSubTab === 'base'
                ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Sliders
              className={`w-4 h-4 shrink-0 ${
                activeSubTab === 'base' ? 'text-emerald-700' : 'text-slate-400'
              }`}
            />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-black block truncate text-slate-900">
                Valores Base
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                R$ {financialConfig.ticketPrice} padrão
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: TARIFAS DE PASSAGENS POR TRAJETO (ORIGEM & DESTINO) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'routes' && (
        <div className="space-y-6">
          {/* Quick Detected Routes Alert */}
          {unconfiguredRoutes.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 shadow-xs">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    Trajetos identificados nos passageiros sem preço cadastrado ({unconfiguredRoutes.length})
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    O sistema detectou clientes viajando nos trajetos abaixo. Clique em um trajeto para definir o valor exato:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {unconfiguredRoutes.slice(0, 8).map((route) => (
                      <button
                        key={route.key}
                        type="button"
                        onClick={() => handleQuickAddRoute(route.origin, route.destination)}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 border-2 border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition active:scale-95 cursor-pointer flex items-center space-x-1"
                      >
                        <span>{route.key}</span>
                        <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 rounded-full">
                          {route.count} pass.
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form to Add / Edit Route Price */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {editingKey ? 'Editar Tarifa do Trajeto' : 'Cadastrar Nova Tarifa por Trajeto'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Defina a origem e o destino para fixar o valor da passagem
                  </span>
                </div>
              </div>

              {editingKey && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSavePrice} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Cidade de Origem */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cidade de Origem:
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      placeholder="Ex: SÃO PAULO - SP"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl uppercase focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  {systemDetectedOrigins.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-bold">Origens:</span>
                      {systemDetectedOrigins.slice(0, 3).map((orig) => (
                        <button
                          key={orig}
                          type="button"
                          onClick={() => setOriginInput(orig)}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
                        >
                          {orig}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Cidade de Destino */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cidade de Destino: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Flag className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      placeholder="Ex: RIO DE JANEIRO - RJ"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl uppercase focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  {systemDetectedDestinations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-bold">Destinos:</span>
                      {systemDetectedDestinations.slice(0, 3).map((dest) => (
                        <button
                          key={dest}
                          type="button"
                          onClick={() => setDestinationInput(dest)}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer"
                        >
                          {dest}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Valor da Passagem (R$) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Valor da Passagem (R$): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-black text-emerald-900 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                {editingKey && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border-2 border-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingKey ? 'Salvar Alterações na Rota' : 'Cadastrar Tarifa do Trajeto'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Configured Routes */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Tarifas Cadastradas ({configuredList.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Tabela ativa para precificação automática de passagens e relatórios
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cidade, trajeto..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {filteredConfiguredList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhum trajeto encontrado</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Utilize o formulário acima para cadastrar a Origem, o Destino e o Preço da passagem.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredConfiguredList.map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border-2 border-slate-200 transition flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {item.origin ? `${item.origin} → ` : ''}{item.destination}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {item.origin ? 'Trajeto de ponto a ponto' : 'Tarifa geral por destino'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-sm font-black text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300">
                        {formatCurrency(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditPrice(item.key, item.origin, item.destination, item.price)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition cursor-pointer"
                        title="Editar tarifa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrice(item.key)}
                        className="p-1.5 text-rose-500 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 rounded-xl transition cursor-pointer"
                        title="Excluir tarifa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: COMISSÕES DOS VENDEDORES (%)                      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'sellers' && (
        <div className="space-y-6">
          {/* Quick Default Banner */}
          <div className="bg-emerald-50 rounded-3xl border-2 border-emerald-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Percent className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-black text-emerald-950">
                  Porcentagem Padrão de Comissão: {financialConfig.defaultCommissionPercent}%
                </h3>
              </div>
              <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                Esta porcentagem é aplicada automaticamente a qualquer vendedor que não tenha uma comissão individual customizada.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('base')}
              className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-100 border-2 border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
            >
              Alterar Padrão ({financialConfig.defaultCommissionPercent}%)
            </button>
          </div>

          {/* Add / Register New Seller Commission */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Cadastrar Nova Porcentagem para Vendedor</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastre um vendedor manualmente ou altere a porcentagem dos vendedores existentes abaixo:
            </p>

            <form onSubmit={handleAddNewSeller} className="mt-4 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nome do Vendedor / Agência:
                </label>
                <input
                  type="text"
                  required
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  placeholder="Ex: Carlos Representações"
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Porcentagem (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={newSellerPercent}
                    onChange={(e) => setNewSellerPercent(e.target.value)}
                    placeholder="10"
                    className="w-full pl-3 pr-7 py-2 text-xs sm:text-sm font-black text-emerald-900 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Fixar Comissão</span>
              </button>
            </form>
          </div>

          {/* List of All Sellers with inline % editors */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Vendedores Identificados no Sistema ({allSellers.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Ajuste a porcentagem (%) individual de cada vendedor
                </span>
              </div>
            </div>

            {allSellers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Percent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhum vendedor registrado até o momento</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ao cadastrar clientes com vendedor informado ou utilizar o formulário acima, os vendedores aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allSellers.map(({ seller, count }) => {
                  const currentRate =
                    sellerCommissions[seller] !== undefined
                      ? sellerCommissions[seller]
                      : financialConfig.defaultCommissionPercent;

                  const inputVal =
                    sellerInputs[seller] !== undefined ? sellerInputs[seller] : currentRate.toString();

                  const numVal = parseFloat(inputVal) || 0;
                  const sampleTicketPrice = 150;
                  const estimatedComm = (sampleTicketPrice * numVal) / 100;

                  return (
                    <div
                      key={seller}
                      className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border-2 border-slate-200 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{seller}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                            {count} passagem(ns) vendida(s)
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">
                          Comissão atual: <strong className="text-emerald-800 font-extrabold">{currentRate}%</strong>
                          {' '}(ex: ganho de {formatCurrency(estimatedComm)} em uma passagem de R$ 150)
                        </span>
                      </div>

                      {/* Percentage Input + Preset Chips + Save Button */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1">
                          {[5, 8, 10, 12, 15].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setSellerInputs({ ...sellerInputs, [seller]: preset.toString() });
                                handleSaveSellerCommission(seller, preset);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                currentRate === preset
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          {/* Direct input */}
                          <div className="relative w-20 sm:w-24">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={inputVal}
                              onChange={(e) =>
                                setSellerInputs({ ...sellerInputs, [seller]: e.target.value })
                              }
                              className="w-full pl-2 pr-6 py-1.5 text-xs font-black text-center border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              %
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseFloat(inputVal);
                              handleSaveSellerCommission(seller, parsed);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Salvar
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

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: REMUNERAÇÃO & COMISSÕES DOS MOTORISTAS (R$ ou %)  */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'drivers' && (
        <div className="space-y-6">
          {/* Quick Default Banner */}
          <div className="bg-blue-50 rounded-3xl border-2 border-blue-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-blue-800" />
                <h3 className="text-sm font-black text-blue-950">
                  Remuneração Padrão de Motorista: {financialConfig.driverPaymentType === 'percent'
                    ? `${financialConfig.driverCommissionPercent || 15}% da receita da viagem`
                    : `R$ ${financialConfig.driverTripPrice.toFixed(2)} por viagem`}
                </h3>
              </div>
              <p className="text-xs text-blue-800 mt-1 max-w-xl">
                Configuração aplicada por padrão quando o motorista não possui uma regra individual específica de repasse.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('base')}
              className="px-3.5 py-2 bg-white text-blue-900 hover:bg-blue-100 border-2 border-blue-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
            >
              Configurar Regra Padrão
            </button>
          </div>

          {/* List of Drivers with Individual Remuneration Setup */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Remuneração por Motorista ({drivers.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Defina se o motorista recebe valor fixo em R$ por viagem ou porcentagem (%) do faturamento da viagem
                </span>
              </div>
            </div>

            {drivers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhum motorista cadastrado</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cadastre motoristas na guia <strong>Motoristas</strong> para definir os valores de repasse.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {drivers.map((drv) => {
                  const custom = driverCommissions[drv.id];
                  const currentType = custom?.type || financialConfig.driverPaymentType || 'fixed';
                  const currentValue =
                    custom?.value !== undefined
                      ? custom.value
                      : currentType === 'percent'
                      ? financialConfig.driverCommissionPercent || 15
                      : financialConfig.driverTripPrice;

                  const inputState = driverInputs[drv.id] || {
                    type: currentType,
                    value: currentValue.toString(),
                  };

                  const completedTrips = driverTripsCount.get(drv.id) || 0;

                  return (
                    <div
                      key={drv.id}
                      className="p-4 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border-2 border-slate-200 transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{drv.fullName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full border border-blue-200">
                            {completedTrips} viagem(ns) realizada(s)
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">
                          Remuneração atual:{' '}
                          <strong className="text-blue-900 font-extrabold">
                            {currentType === 'fixed'
                              ? `R$ ${currentValue.toFixed(2)} por viagem`
                              : `${currentValue}% da receita da viagem`}
                          </strong>
                          {drv.phone ? ` • Tel: ${drv.phone}` : ''}
                        </span>
                      </div>

                      {/* Controls: Type Toggle, Value Input, Presets, Save */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        {/* Type toggle */}
                        <div className="flex items-center p-0.5 sm:p-1 bg-white border-2 border-slate-300 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              const newType = 'fixed';
                              setDriverInputs({
                                ...driverInputs,
                                [drv.id]: {
                                  type: newType,
                                  value:
                                    inputState.type === 'fixed'
                                      ? inputState.value
                                      : financialConfig.driverTripPrice.toString(),
                                },
                              });
                            }}
                            className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              inputState.type === 'fixed'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            R$ Fixo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newType = 'percent';
                              setDriverInputs({
                                ...driverInputs,
                                [drv.id]: {
                                  type: newType,
                                  value:
                                    inputState.type === 'percent'
                                      ? inputState.value
                                      : (financialConfig.driverCommissionPercent || 15).toString(),
                                },
                              });
                            }}
                            className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition cursor-pointer ${
                              inputState.type === 'percent'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            % Viagem
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1">
                          {inputState.type === 'fixed'
                            ? [250, 300, 350, 400, 500].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    setDriverInputs({
                                      ...driverInputs,
                                      [drv.id]: { type: 'fixed', value: preset.toString() },
                                    });
                                    handleSaveDriverRate(drv.id, drv.fullName, 'fixed', preset);
                                  }}
                                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    currentType === 'fixed' && currentValue === preset
                                      ? 'bg-blue-700 text-white border-blue-800'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))
                            : [10, 12, 15, 20].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    setDriverInputs({
                                      ...driverInputs,
                                      [drv.id]: { type: 'percent', value: preset.toString() },
                                    });
                                    handleSaveDriverRate(drv.id, drv.fullName, 'percent', preset);
                                  }}
                                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    currentType === 'percent' && currentValue === preset
                                      ? 'bg-blue-700 text-white border-blue-800'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {preset}%
                                </button>
                              ))}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
                          {/* Value Input */}
                          <div className="relative w-22 sm:w-28">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              {inputState.type === 'fixed' ? 'R$' : '%'}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step={inputState.type === 'fixed' ? '10' : '0.5'}
                              value={inputState.value}
                              onChange={(e) =>
                                setDriverInputs({
                                  ...driverInputs,
                                  [drv.id]: {
                                    type: inputState.type,
                                    value: e.target.value,
                                  },
                                })
                              }
                              className="w-full pl-6 sm:pl-7 pr-2 py-1.5 text-xs font-black text-center border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                            />
                          </div>

                          {/* Save Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseFloat(inputState.value);
                              handleSaveDriverRate(drv.id, drv.fullName, inputState.type, parsed);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Salvar
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

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: VALORES BASE GLOBAIS DA EMPRESA                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'base' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              <span>Configuração dos Valores Base Globais</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Estes parâmetros globais são aplicados automaticamente quando passagens ou motoristas não possuem valores específicos cadastrados nas outras abas.
            </p>

            <form onSubmit={handleSaveGlobalBaseValues} className="mt-5 space-y-4 max-w-xl">
              {/* 1. Preço Base de Passagem */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Valor Base da Passagem (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={baseTicketPriceInput}
                    onChange={(e) => setBaseTicketPriceInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-black border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Utilizado como fallback quando o trajeto ou destino não tiver preço cadastrado na aba "Tarifas por Trajeto".
                </span>
              </div>

              {/* 2. Repasse ao Motorista Padrão */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Valor Padrão Pago ao Motorista por Viagem (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={baseDriverTripPriceInput}
                    onChange={(e) => setBaseDriverTripPriceInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-black border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Valor padrão repassado aos motoristas quando não houver taxa específica definida.
                </span>
              </div>

              {/* 3. Porcentagem Padrão dos Vendedores */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Porcentagem Padrão de Comissão dos Vendedores (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={baseDefaultCommissionInput}
                    onChange={(e) => setBaseDefaultCommissionInput(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-black border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Taxa padrão para vendedores sem comissão personalizada na aba "Comissão Vendedores".
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Todos os Valores Base</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
