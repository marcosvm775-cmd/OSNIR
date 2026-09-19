# 📦 GUIA DE GERAÇÃO DO INSTALADOR WINDOWS (.EXE / .MSI) & LICENCIAMENTO
### Sistema OSNIR TURISMO - Transporte e Viagens

Este documento explica como gerar o instalador executável `.exe` para vender como software tradicional de computador para agências e empresas de transporte rodoviário.

---

## 🚀 1. Como Gerar o Instalador `.exe` (1 Clique)

### Pré-requisitos na sua máquina de desenvolvimento (Windows):
1. **Node.js** (v18 ou superior): https://nodejs.org
2. **Compilador Rust para Windows** (gratuito e oficial):
   * Acesse https://rustup.rs e baixe o `rustup-init.exe`.
   * Execute e aperte a opção `1` (Instalação padrão).

### Passo a Passo para Gerar:
1. Abra a pasta do projeto no Windows.
2. Dê um duplo clique no arquivo:
   ```cmd
   CRIAR_INSTALADOR_WINDOWS.bat
   ```
   *Ou execute pelo terminal:*
   ```bash
   npm run tauri:build
   ```
3. O instalador final `.exe` e `.msi` será criado automaticamente na pasta:
   ```
   src-tauri\target\release\bundle\nsis\OSNIR TURISMO_2.5.0_x64-setup.exe
   src-tauri\target\release\bundle\msi\OSNIR TURISMO_2.5.0_x64_pt-BR.msi
   ```

Este arquivo `.exe` é o arquivo que você envia/vende para o seu cliente!

---

## 🗄️ 2. Criação Automática do Banco de Dados na Instalação

* **Momento da Instalação / Primeira Execução:**
  * O instalador instala o programa e, na primeira inicialização, o sistema executa automaticamente o motor de inicialização do banco de dados local.
  * Cria o identificador único do banco (`DB-OSNIR-2026-XXXX`).
  * Cria todas as tabelas e estruturas:
    * Passageiros
    * Viagens
    * Motoristas
    * Tabela de Preços e Destinos Padrão
    * Configurações Financeiras e Comissões
    * Registro de Despesas Operacionais e Fechamentos
* **Botão do Banco de Dados no Topo:**
  * Permite ao cliente acompanhar o espaço ocupado, número de registros salvos, fazer **Backup com 1 clique (`.json`)** e **Restaurar Backup** a qualquer momento.

---

## 🔑 3. Como Funciona a Chave do Produto (1 Chave para até 3 Instalações)

Você pode vender **1 Chave de Produto** que autoriza o cliente a instalar o sistema em até **3 computadores da empresa dele**:
* **Computador 1:** Computador Principal / Servidor do Escritório
* **Computador 2:** Guichê / Balcão de Vendas
* **Computador 3:** Financeiro ou Notebook do Dono/Motorista

### Formato da Chave Oficial:
`OT26-XXXX-YYYY-ZZZZ-3S`

### Como você (Vendedor) gera chaves para seus clientes:
1. No sistema, clique no botão **"Licença"** no topo da tela (ou na engrenagem de Configurações).
2. Abra a aba **"Ferramenta do Vendedor: Gerar Chave para Novo Cliente"**.
3. Digite o nome da empresa compradora (ex: `VIAÇÃO ESTRELA LTDA`).
4. Clique em **"Gerar Chave Oficial para o Cliente"**.
5. Clique em **"Copiar Mensagem Pronta p/ WhatsApp"**.
6. Envie a chave diretamente pelo WhatsApp para o seu cliente!

### Chave de Teste Rápido (já autorizada para testes):
`OT26-DEMO-TEST-2026-3S`
