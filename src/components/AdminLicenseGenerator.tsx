import React, { useState } from 'react';
import { KeyRound, Copy, Check, ShieldCheck, Sparkles, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { generateProductKey } from '../utils/license';

interface AdminLicenseGeneratorProps {
  onClose?: () => void;
  onApplyKey?: (key: string, clientName: string) => void;
}

export const AdminLicenseGenerator: React.FC<AdminLicenseGeneratorProps> = ({ onClose, onApplyKey }) => {
  const [clientName, setClientName] = useState('AGÊNCIA DE TURISMO');
  const [planType, setPlanType] = useState<'lifetime' | 'annual'>('lifetime');
  const [seats, setSeats] = useState<number>(3);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const key = generateProductKey(clientName, planType, seats);
    setGeneratedKey(key);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWhatsAppText = () => {
    if (!generatedKey) return;
    const msg = `*CHAVE DE ATIVAÇÃO DO SISTEMA OSNIR TURISMO*\n\n` +
      `🏢 Cliente: *${clientName}*\n` +
      `🔑 Chave do Produto: *${generatedKey}*\n` +
      `💻 Instalações Permitidas: *Até ${seats} Computadores Simultâneos*\n` +
      `⏳ Licença: *${planType === 'lifetime' ? 'Vitalícia (Sem mensalidades)' : 'Anual (12 Meses)'}*\n\n` +
      `*Como Ativar:*\n` +
      `1. Abra o programa OSNIR TURISMO no computador;\n` +
      `2. Na tela de ativação, cole a chave acima;\n` +
      `3. Escolha o número da máquina (Computador 1, 2 ou 3) e clique em ATIVAR.\n\n` +
      `Suporte técnico à disposição!`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Gerador de Chaves de Produto
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Painel do Vendedor
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Gere chaves oficiais para vender o aplicativo para empresas e agências
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Nome da Empresa / Cliente Comprador:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value.toUpperCase())}
            placeholder="Ex: EXPRESSO TURISMO LTDA"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Tipo de Licença:</label>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value as 'lifetime' | 'annual')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="lifetime">Vitalícia (Sem expiração)</option>
            <option value="annual">Anual (12 Meses)</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">Limite de Computadores por Chave:</span>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/30">
            {seats} Instalações (Padrão solicitado)
          </span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>Gerar Chave Oficial para o Cliente</span>
      </button>

      {generatedKey && (
        <div className="bg-slate-950 p-4 rounded-xl border-2 border-amber-500/50 space-y-3">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Chave Gerada Criptograficamente:
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <code className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-wider select-all">
              {generatedKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1 transition cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopyWhatsAppText}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Copiar Mensagem Pronta p/ WhatsApp</span>
            </button>

            {onApplyKey && (
              <button
                onClick={() => onApplyKey(generatedKey, clientName)}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ativar Nesta Máquina</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-400 space-y-1 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
        <p className="font-semibold text-slate-300">💡 Como funciona para o seu comprador:</p>
        <p>• O cliente pode usar esta <strong>mesma chave em até 3 computadores</strong> diferentes da empresa dele (ex: Caixa, Escritório e Balcão).</p>
        <p>• Cada máquina registra seu slot (Instalação 1 de 3, 2 de 3 e 3 de 3).</p>
      </div>
    </div>
  );
};
