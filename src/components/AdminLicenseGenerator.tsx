import React, { useState } from 'react';
import { KeyRound, Copy, Check, ShieldCheck, Sparkles, MessageCircle, AlertCircle, RefreshCw, Clock, RotateCcw, Download, Smartphone, ExternalLink, HelpCircle } from 'lucide-react';
import { generateProductKey, simulateTrialExpiry, resetTrialForTesting } from '../utils/license';

interface AdminLicenseGeneratorProps {
  onClose?: () => void;
  onApplyKey?: (key: string, clientName: string) => void;
}

export const AdminLicenseGenerator: React.FC<AdminLicenseGeneratorProps> = ({ onClose, onApplyKey }) => {
  const [clientName, setClientName] = useState('AGÊNCIA DE TURISMO');
  const [planType, setPlanType] = useState<'monthly' | 'semiannual' | 'annual' | 'lifetime'>('monthly');
  const [seats, setSeats] = useState<number>(3);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getPlanLabel = (type: 'monthly' | 'semiannual' | 'annual' | 'lifetime') => {
    switch (type) {
      case 'monthly':
        return 'Mensal (30 Dias)';
      case 'semiannual':
        return 'Semestral (6 Meses)';
      case 'annual':
        return 'Anual (12 Meses)';
      case 'lifetime':
        return 'Vitalícia (Sem mensalidades)';
    }
  };

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
      `⏳ Plano / Validade: *${getPlanLabel(planType)}*\n\n` +
      `*Como Ativar no Programa:*\n` +
      `1. Abra o programa OSNIR TURISMO no computador ou celular;\n` +
      `2. Na tela de ativação, cole ou digite a chave acima;\n` +
      `3. Escolha o número da máquina (Computador 1, 2 ou 3) e clique em DESBLOQUEAR.\n\n` +
      `Suporte técnico WhatsApp: (37) 9 9124-3101 à disposição!`;

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
          <label className="text-xs font-semibold text-slate-300">Periodicidade / Plano:</label>
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value as 'monthly' | 'semiannual' | 'annual' | 'lifetime')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
          >
            <option value="monthly">🗓️ Mensal (30 Dias)</option>
            <option value="semiannual">🗓️ Semestral (6 Meses / 180 Dias)</option>
            <option value="annual">🗓️ Anual (12 Meses / 365 Dias)</option>
            <option value="lifetime">♾️ Vitalícia (Permanente)</option>
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
        <p>• O sistema roda por <strong>10 dias livres como demonstração</strong> sem nenhuma trava.</p>
        <p>• Após os 10 dias, ele trava e exige a Chave de Ativação oficial.</p>
        <p>• O comprador pode usar a <strong>mesma chave em até 3 computadores</strong> da empresa dele.</p>
      </div>

      {/* Ferramentas de Teste do Administrador */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            simulateTrialExpiry();
            window.location.reload();
          }}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          title="Simula 11 dias passados para testar a tela de bloqueio do trial"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Simular Expiração dos 10 Dias (Travar)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetTrialForTesting();
            window.location.reload();
          }}
          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          title="Reinicia a contagem dos 10 dias de demonstração a partir de hoje"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar Demonstração (10d)</span>
        </button>
      </div>

      {/* ÁREA EXCLUSIVA DE DESENVOLVEDOR: GERAR APK NO WEB INTO APP */}
      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 rounded-xl text-white space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
              Gerar APK Android no WebIntoApp (Área Dev)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Dica do Criador
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Sim! O <strong>WebIntoApp.com</strong> é uma excelente opção para empacotar o sistema em um <strong>APK instalável</strong> para Android. 
        </p>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-2 text-[11px]">
          <p className="font-bold text-amber-300">Como resolver erro na hora de gerar no WebIntoApp:</p>
          <div className="space-y-1.5 text-slate-300">
            <p>
              <strong>1. O tamanho do arquivo está perfeito:</strong> O ZIP gerado tem apenas <strong>~650 KB</strong> (o WebIntoApp aceita até 20 MB, então não é o tamanho).
            </p>
            <p>
              <strong>2. Erro de "Package Name já existente":</strong> Se você já gerou um app antes com <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">com.osnirturismo.app</code>, o WebIntoApp trava porque não deixa criar um novo com o mesmo identificador. <strong>Mude para <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">com.osnirturismo.v2</code></strong> na tela do WebIntoApp!
            </p>
            <p>
              <strong>3. Baixe o ZIP Atualizado:</strong> Clique no botão amarelo abaixo para baixar o ZIP com as últimas atualizações (incluindo o novo Menu Lateral Esquerdo).
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <a
            href="/webintoapp_pacote.zip"
            download="osnir_turismo_webintoapp.zip"
            className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 shadow cursor-pointer text-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar ZIP Puro Offline (~648 KB)</span>
          </a>

          <a
            href="https://www.webintoapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir WebIntoApp.com</span>
          </a>

          <button
            type="button"
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              alert('URL do app copiada com sucesso! Cole no WebIntoApp: ' + url);
            }}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>Copiar URL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
