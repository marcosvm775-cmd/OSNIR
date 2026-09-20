# 📱 GUIA: VERSÃO PARA CELULAR (ANDROID & IPHONE) 100% OFFLINE
### Sistema OSNIR TURISMO - Transporte e Viagens

Sim! O sistema agora conta com **suporte oficial completo para as duas versões**:
1. 🖥️ **Versão Computador (Windows)**: Instalador executável `.exe` leve (~75MB a 85MB) gerado pelo arquivo `GERAR_INSTALADOR_FACIL.bat`.
2. 📱 **Versão Celular (Smartphone Android e iPhone)**: Aplicativo instalado direto no celular, com **banco de dados gravado na memória interna do próprio aparelho**, funcionando **100% offline sem precisar de internet** (ótimo para motoristas, guias e vendedores na estrada).

---

## 🚀 1. Como Instalar no Celular com Banco de Dados na Memória (PWA)

O aplicativo foi construído com a tecnologia **Progressive Web App (PWA)** com **Service Worker** e **Web App Manifest**. Ao instalar:
- Todo o código, telas e gerador de PDFs ficam salvos na **memória interna do celular**.
- Todos os passageiros, motoristas, viagens e histórico financeiro ficam gravados no banco local (`localStorage`) do próprio aparelho.
- **Não gasta franquia de dados** e abre mesmo se o celular estiver em Modo Avião ou sem sinal nas rodovias.

### 🤖 No Celular Android (Google Chrome / Samsung Internet):
1. Abra o link do sistema no navegador do celular (ex: Google Chrome).
2. O sistema exibirá automaticamente o botão **"Instalar no Celular"** no topo da tela.
   *(Ou toque nos **3 pontinhos** no canto superior direito do Chrome e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**)*.
3. Confirme em **Instalar**.
4. O ícone oficial **OSNIR TURISMO** aparecerá na tela do seu celular junto aos seus outros aplicativos.
5. Ao abrir pelo ícone, ele executa em **tela cheia**, sem barra de navegação de navegador, funcionando como um app nativo da Play Store.

### 🍏 No iPhone ou iPad (Safari):
1. Abra o link do sistema no navegador **Safari**.
2. Toque no botão de **Compartilhar** do Safari (quadrado com a seta apontando para cima).
3. Role as opções e toque em **"Adicionar à Tela de Início"**.
4. Toque em **Adicionar** no canto superior direito.
5. O ícone será criado na tela de aplicativos do iPhone e funcionará offline.

---

## 💾 2. Como Funciona a Memória e Segurança Offline

| Recurso | Como Funciona no Celular |
| :--- | :--- |
| **Banco de Dados** | Gravado no armazenamento físico do smartphone (`localStorage`). |
| **Sem Internet** | Funciona perfeitamente em estradas, sítios, garagens ou sem Wi-Fi/4G. |
| **PDFs e Listas** | Os manifestos de viagem e listas de passageiros em folha única A4 são gerados no próprio processador do celular e salvos na pasta **Downloads** do aparelho ou compartilhados no WhatsApp. |
| **Sincronização / Backup** | Você pode exportar o arquivo de backup (`.json`) no celular e restaurar no computador (ou vice-versa) em segundos através do menu **Configurações → Banco de Dados Local**. |

---

## 📦 3. Deseja Gerar um Arquivo Instalador `.apk` para Android?

Se além da instalação direta (PWA) você quiser ter um arquivo físico `.apk` para enviar por WhatsApp ou pen drive:

### Opção 1: Gerador Automático Gratuito (PWA to APK / PWABuilder)
1. Acesse o site oficial da Microsoft: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
2. Cole o link compartilhado do seu sistema.
3. Clique em **"Package for Android"**.
4. O site compila automaticamente e entrega o pacote `.apk` pronto e assinado para instalar em qualquer smartphone Android.

### Opção 2: Empacotamento Nativo com Capacitor / Android Studio
Se quiser compilar localmente na sua máquina:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "OSNIR TURISMO" "com.osnirturismo.app" --web-dir dist
npm run build
npx cap add android
npx cap open android
```
No Android Studio, clique em **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

---

## 📋 Resumo: Ambas as Versões Prontas para Uso

1. **Computador (Windows)**: Execute `GERAR_INSTALADOR_FACIL.bat` para gerar o `.exe`.
2. **Celular (Android / iOS)**: Abra no smartphone e toque em **"Instalar no Celular"** para ter o app offline completo com banco na memória.
