import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  FileJson,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getDatabaseStatistics,
  exportDatabaseBackupFile,
  restoreDatabaseFromFile,
  initializeLocalDatabase,
} from '../utils/database';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [stats, setStats] = useState(getDatabaseStatistics());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStats(getDatabaseStatistics());
      setStatusMessage('');
      setIsError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackup = () => {
    try {
      exportDatabaseBackupFile();
      setStatusMessage('Arquivo de backup do banco de dados gerado e baixado com sucesso!');
      setIsError(false);
      setStats(getDatabaseStatistics());
    } catch {
      setStatusMessage('Falha ao gerar arquivo de backup.');
      setIsError(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      const res = restoreDatabaseFromFile(content);
      if (res.success) {
        setStatusMessage(res.message);
        setIsError(false);
        setStats(getDatabaseStatistics());
        if (onDataRestored) onDataRestored();
      } else {
        setStatusMessage(res.message);
        setIsError(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReinit = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja reinicializar o banco de dados? Isso recriará a estrutura padrão do sistema. Recomendamos fazer um backup antes!'
      )
    ) {
      const res = initializeLocalDatabase();
      setStatusMessage(`Banco reinicializado: ${res.message}`);
      setIsError(false);
      setStats(getDatabaseStatistics());
      if (onDataRestored) onDataRestored();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Banco de Dados Local
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Status: Saudável / Ativo
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Criado automaticamente na instalação • Armazenamento isolado no computador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Técnicas do Banco */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">ID da Instância:</span>
              <span className="text-slate-900 font-extrabold font-mono text-xs truncate block">
                {stats.metadata.databaseId}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Versão do Schema:</span>
              <span className="text-slate-900 font-bold text-xs">{stats.metadata.version}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Espaço Ocupado:</span>
              <span className="text-blue-700 font-extrabold text-xs">{stats.storageSizeFormatted}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Registros:</span>
              <span className="text-emerald-700 font-extrabold text-xs">{stats.counts.totalRecords} itens</span>
            </div>
          </div>

          {/* Contagem por Tabela */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              Tabelas e Registros Criados na Instalação:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Passageiros:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.passengers}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Viagens:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.trips}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Motoristas:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.drivers}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Despesas:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.expenses}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tarifas / Destinos:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.destinations}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Fechamentos:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {stats.counts.tripClosings}
                </span>
              </div>
            </div>
          </div>

          {/* Mensagens de Feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Ações de Backup e Restauração */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-500" />
              Rotinas de Segurança & Backup
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBackup}
                className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition flex items-center space-x-3 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-800 block">Fazer Backup Agora</span>
                  <span className="text-[11px] text-slate-500 block">
                    Exporta arquivo .json completo com todos os dados para pen drive ou nuvem
                  </span>
                </div>
              </button>

              <label className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center space-x-3 text-left cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-800 block">Restaurar Backup</span>
                  <span className="text-[11px] text-slate-500 block">
                    Importa arquivo de backup (.json) para recuperar os dados nesta máquina
                  </span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleReinit}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Verificar integridade / Reinicializar tabelas</span>
            </button>
            <span className="text-[10px] text-slate-400">
              Última validação: {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Banco de Dados Local OSNIR TURISMO</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
