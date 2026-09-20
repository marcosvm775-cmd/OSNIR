import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, PlusSquare, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'badge';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAppInfoModal, setShowAppInfoModal] = useState(false);

  // If already running in standalone mode (already installed as an app)
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Aplicativo Instalado no Aparelho</p>
            <p className="text-emerald-700">Operando em modo aplicativo nativo com banco de dados 100% offline na memória do dispositivo.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* 1. Android / Chrome / Edge flow with automatic install prompt */}
      {isInstallable ? (
        variant === 'header' ? (
          <button
            onClick={install}
            title="Instalar aplicativo no seu celular ou computador"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition active:scale-95 ${className}`}
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>Instalar no Celular</span>
          </button>
        ) : (
          <button
            onClick={install}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition active:scale-[0.98] ${className}`}
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicativo no Celular (Modo Offline)</span>
          </button>
        )
      ) : isIOS ? (
        /* 2. iOS Safari instructions flow */
        variant === 'header' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Instalar no iPhone / iPad"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 ${className}`}
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>Instalar no iPhone</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-md transition active:scale-[0.98] ${className}`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar no iPhone / iPad (Safari)</span>
          </button>
        )
      ) : (
        /* 3. Generic Mobile Helper Button (when prompt is not yet triggered or on standard browser) */
        variant === 'card' && (
          <button
            onClick={() => setShowAppInfoModal(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold shadow transition active:scale-[0.98] ${className}`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Como Instalar no Celular (Android ou iPhone)</span>
          </button>
        )
      )}

      {/* Modal: iOS Safari Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  📱
                </div>
                <h3 className="text-base font-bold text-slate-800">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  No navegador <strong>Safari</strong>, toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima <Share className="w-3.5 h-3.5 inline text-blue-600" />).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" />).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  Toque em <strong>Adicionar</strong> no canto superior direito. O aplicativo criará o ícone oficial <strong>OSNIR TURISMO</strong> e funcionará offline sem internet!
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: General Mobile Installation Guide */}
      {showAppInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Versão Celular (Android & iOS)</h3>
                  <p className="text-[11px] text-slate-500">Banco de dados 100% offline na memória do telefone</p>
                </div>
              </div>
              <button
                onClick={() => setShowAppInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Como funciona sem internet no celular?
                </p>
                <p className="mt-1 text-emerald-800 text-[11px] leading-relaxed">
                  O aplicativo usa tecnologia PWA (Progressive Web App). Ao instalar no seu telefone, todos os códigos, telas, relatórios em PDF e o banco de dados ficam gravados <strong>diretamente no armazenamento interno do celular</strong>. Você pode cadastrar passageiros, emitir manifestos e fechar viagens na estrada sem sinal de internet.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-[12px]">Passos para instalar no Android (Google Chrome):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Abra o link do sistema no <strong>Google Chrome</strong> do seu celular.</li>
                  <li>Toque nos <strong>3 pontinhos</strong> do menu no canto superior direito.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Pronto! O aplicativo abrirá em tela cheia como qualquer app da Play Store.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-[12px]">Passos para instalar no iPhone (Safari):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Abra o link do sistema no <strong>Safari</strong> do iPhone.</li>
                  <li>Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
                  <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAppInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
