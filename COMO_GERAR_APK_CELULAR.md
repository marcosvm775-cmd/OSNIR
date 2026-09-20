# 📲 COMO GERAR O INSTALADOR .APK PARA CELULAR (SEM ENVIAR LINK OU CONTA)
### Sistema OSNIR TURISMO - Transporte e Viagens

Sua preocupação está 100% correta: **para vender o app para o cliente, você NÃO DEVE enviar o link do seu ambiente de desenvolvimento nem dar acesso à sua conta.**

Você deve enviar para o cliente **apenas o arquivo instalador final**:
* Para Computador Windows: **`OSNIR TURISMO Setup 2.5.0.exe`**
* Para Celular Android: **`OSNIR_TURISMO_Celular_Android.apk`**

O cliente clica no arquivo `.apk` no celular dele, instala diretamente na memória interna do aparelho e usa **100% offline, sem ver código, sem ver links e sem acessar sua conta!**

---

## 🛠️ MÉTODO 1: GERAR COM 1 CLIQUE PELO SEU COMPUTADOR

Criamos um script automático na pasta do projeto: **`GERAR_INSTALADOR_ANDROID_APK.bat`**.

1. No seu computador, dê um duplo clique no arquivo:
   ```cmd
   GERAR_INSTALADOR_ANDROID_APK.bat
   ```
2. O script irá:
   - Compilar todo o sistema e as telas em modo offline de alta performance;
   - Configurar o projeto nativo do Android com o nome **OSNIR TURISMO** e ícone oficial;
   - Criar o arquivo instalador **`.apk`** diretamente dentro da pasta:
     ```
     INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR_TURISMO_Celular_Android.apk
     ```
3. Pronto! Você pega esse arquivo `.apk` e envia para o cliente pelo **WhatsApp, Google Drive ou Pen Drive**.

---

## 🌐 MÉTODO 2: USAR O GERADOR OFICIAL GRATUITO (PWABuilder da Microsoft)

Se você não tiver o Android Studio instalado no computador e quiser gerar o arquivo `.apk` assinado em menos de 2 minutos pelo navegador:

1. Gere uma URL pública de visualização do seu app (usando o botão de **Share / Compartilhar** ou hospedando os arquivos estáticos da pasta `dist`).
   > *Atenção:* O link público de compartilhamento **NÃO dá acesso de edição nem à sua conta**, ele apenas exibe o sistema para o usuário final!
2. Acesse: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
3. Cole a URL pública e clique em **Start**.
4. Clique em **Package for Stores** e selecione **Android**.
5. Clique em **Generate APK / Package**.
6. O site entrega o arquivo instalador `.apk` pronto para download!
7. Você salva o arquivo `.apk` no seu computador e envia para quantos clientes quiser.

---

## 🔒 COMO O CLIENTE USA NO CELULAR (TOTALMENTE INDEPENDENTE)

1. O cliente recebe o arquivo **`OSNIR_TURISMO_Celular_Android.apk`** no WhatsApp ou e-mail.
2. Ele toca no arquivo para instalar no celular (se o Android perguntar, ele confirma "Permitir desta fonte").
3. O aplicativo é instalado com o ícone **OSNIR TURISMO**.
4. **Segurança total para você:**
   - O cliente **não tem acesso ao seu código-fonte**.
   - O cliente **não sabe qual conta gerou o app**.
   - O banco de dados do cliente fica **apenas na memória do telefone dele**.
   - O app abre no meio da estrada, sem Wi-Fi e sem 4G.
