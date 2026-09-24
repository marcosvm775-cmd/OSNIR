import React, { useState } from 'react';
import {
  X,
  Smartphone,
  RotateCcw,
  Wifi,
  Battery,
  Signal,
  Download,
  Info,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface PhoneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  primaryColor?: string;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  isOpen,
  onClose,
  companyName = 'OSNIR TURISMO',
  primaryColor = '#065f46',
}) => {
  const [deviceType, setDeviceType] = useState<'android' | 'iphone'>('android');
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<'simulator' | 'install_guide'>('simulator');
  const [currentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header do Simulador */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Simulador de Celular no Sistema</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Veja e teste como o app roda no celular do cliente sem depender de WebIntoApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Modelo */}
            <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDeviceType('android')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  deviceType === 'android'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setDeviceType('iphone')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  deviceType === 'iphone'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                iPhone
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo: Simulador + Painel de Ajuda */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Lado Esquerdo: O Celular Simulado */}
          <div className="lg:col-span-7 bg-slate-950/60 p-4 flex items-center justify-center overflow-y-auto">
            {/* Carcaça do Smartphone */}
            <div
              className={`relative bg-slate-900 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border-[8px] border-slate-800 ${
                deviceType === 'iphone' ? 'rounded-[48px]' : 'rounded-[36px]'
              }`}
              style={{
                width: '360px',
                height: '680px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 2px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Notch / Câmera Frontal */}
              {deviceType === 'iphone' ? (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
                </div>
              ) : (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 border border-slate-800"></div>
              )}

              {/* Barra de Status do Celular Simulado */}
              <div
                className="w-full h-7 px-4 pt-1 flex items-center justify-between text-[11px] font-bold text-white z-30 select-none"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{currentTime}</span>
                <div className="flex items-center gap-1.5 text-white/90">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tela do Aplicativo (Iframe interativo com o próprio app) */}
              <div className="flex-1 w-full bg-slate-100 overflow-hidden relative">
                <iframe
                  src={window.location.href}
                  title="Simulação do App Osnir Turismo"
                  className="w-full h-full border-none"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {/* Barra Inferior de Navegação do Celular */}
              <div className="w-full h-4 bg-slate-900 flex items-center justify-center z-30 select-none">
                <div className="w-28 h-1 rounded-full bg-slate-600"></div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Explicação do Erro do WebIntoApp e Soluções Práticas */}
          <div className="lg:col-span-5 bg-slate-900 p-4 sm:p-6 overflow-y-auto space-y-4 border-t lg:border-t-0 lg:border-l border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Diagnóstico Concluído
              </span>
              <h3 className="text-base font-black text-white">
                Por que deu erro e como entregar o app aos clientes
              </h3>
            </div>

            {/* Explicação da Conta Google */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Info className="w-4 h-4 shrink-0" />
                <span>Por que o Link pediu sua conta Google?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                O link <code className="bg-slate-950/60 px-1 py-0.5 rounded text-amber-300">https://ais-pre-...</code> é o ambiente interno do Google Studio. Quando alguém tenta abrir por fora, o Google bloqueia e pede o seu e-mail e senha. <strong>Você tem toda razão em não passar sua conta para ninguém!</strong>
              </p>
            </div>

            {/* Explicação do WebIntoApp */}
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <X className="w-4 h-4 shrink-0" />
                <span>Por que o WebIntoApp deu erro seco no arquivo?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                O WebIntoApp é um site de terceiros comercial. No plano gratuito deles, eles limitam o envio de arquivos ZIP para forçar os usuários a assinarem o plano pago (de US$ 9 a 29 dólares).
              </p>
            </div>

            {/* A Solução Definitiva: PWA Oficial */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>A Solução Oficial 100% Gratuita</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Você pode instalar o aplicativo oficial no celular em <strong>5 segundos</strong>, sem passar pelo WebIntoApp e sem nenhuma senha do Google:
              </p>

              <div className="space-y-2 text-[11px] text-slate-200 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>1. No Chrome do Celular:</strong> Abra o sistema.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>2. Toque nos 3 Pontinhos (⋮):</strong> Selecione <em>"Instalar aplicativo"</em>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>3. Aplicativo Instalado:</strong> O Android cria o app nativo verde com a logo do Osnir Turismo, sem barras pretas e funcionando 100% offline.
                  </div>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert('Link oficial copiado! Abra no Chrome do celular: ' + url);
                  }}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copiar Link para o Celular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
