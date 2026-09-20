# 📦 GUIA DE GERAÇÃO DO INSTALADOR WINDOWS (.EXE) & LICENCIAMENTO
### Sistema OSNIR TURISMO - Transporte e Viagens

Este documento explica como gerar o instalador executável `.exe` leve (~75MB a 85MB) para vender como software tradicional de computador para agências e empresas de transporte rodoviário.

---

## 🚀 1. Como Gerar o Instalador `.exe` (1 Clique)

### Pré-requisitos na sua máquina de desenvolvimento (Windows):
1. **Node.js** (v18 ou superior): https://nodejs.org

### Passo a Passo para Gerar:
1. Abra a pasta do projeto no Windows.
2. Dê um duplo clique no arquivo:
   ```cmd
   GERAR_INSTALADOR_FACIL.bat
   ```
3. O instalador final `.exe` será criado e colocado automaticamente na pasta:
   ```
   INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR TURISMO Setup 2.5.0.exe
   ```

---

## 💡 Por que a pasta de build parecia ter mais de 1 Giga?

1. **A pasta `dist-electron` continha arquivos temporários:**
   * Durante a compilação, o Electron cria uma pasta interna chamada `win-unpacked` (o Chrome descompactado, caches de compilação e logs temporários) que soma centenas de megas.
2. **Você só precisa enviar UM arquivo para o cliente:**
   * Para vender e instalar nos seus clientes, você **NÃO precisa enviar a pasta inteira**.
   * O único arquivo necessário é o instalador final:
     **`INSTALADOR_FINAL_PARA_O_CLIENTE\OSNIR TURISMO Setup 2.5.0.exe`** (apenas ~75MB a 85MB).
3. **Otimizações aplicadas:**
   * O script agora usa compressão máxima (`LZMA`) e ignora todas as pastas `node_modules` desnecessárias, já que todo o código do sistema foi pré-compilado em JavaScript de alta performance.
   * O script agora limpa os arquivos temporários e coloca o instalador pronto numa pasta exclusiva chamada `INSTALADOR_FINAL_PARA_O_CLIENTE`.

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
