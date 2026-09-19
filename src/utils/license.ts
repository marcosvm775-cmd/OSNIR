import { ProductLicense, LicenseActivation } from '../types';

const MACHINE_ID_KEY = 'sys_machine_hwid_v1';
const PRODUCT_LICENSE_KEY = 'sys_product_license_v1';
const TRIAL_START_KEY = 'sys_trial_start_v1';

// Algoritmo determinístico para validação e geração de chaves
const SECRET_SALT = 'OSNIR_TURISMO_TRANSPORTES_2026_SECURE_KEY';

/**
 * Gera ou recupera um identificador de máquina único e persistente para este computador
 */
export function getMachineFingerprint(): string {
  try {
    const existing = localStorage.getItem(MACHINE_ID_KEY);
    if (existing && existing.startsWith('INST-')) {
      return existing;
    }

    // Cria um ID de máquina combinando características do hardware/navegador + timestamp aleatório
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const navInfo = `${navigator.userAgent}-${navigator.language}-${navigator.hardwareConcurrency || 4}`;
    const randomSeed = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Hash simples e determinístico
    let hash = 0;
    const combined = `${screenInfo}-${navInfo}-${randomSeed}`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }

    const hex1 = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase().substring(0, 4);
    const hex2 = Math.abs(hash ^ 0x55aa55aa).toString(16).padStart(8, '0').toUpperCase().substring(0, 4);
    const hex3 = Math.abs(hash ^ 0xa5a5a5a5).toString(16).padStart(8, '0').toUpperCase().substring(0, 4);

    const generatedId = `INST-${hex1}-${hex2}-${hex3}`;
    localStorage.setItem(MACHINE_ID_KEY, generatedId);
    return generatedId;
  } catch {
    return 'INST-7A8B-9C0D-1E2F';
  }
}

/**
 * Algoritmo interno de Checksum para validar integridade da chave
 */
function calculateKeyChecksum(block1: string, block2: string, salt: string): string {
  const input = `${block1}:${block2}:${salt}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return hex.substring(0, 4);
}

/**
 * Valida a chave de produto digitada.
 * Formato esperado: OT26-XXXX-YYYY-ZZZZ-3S (ou OT26-XXXX-YYYY-ZZZZ)
 */
export function validateProductKey(
  rawKey: string,
  expectedSeats: number = 3
): { valid: boolean; message: string; planType: 'lifetime' | 'annual' | 'trial'; seats: number } {
  if (!rawKey) {
    return { valid: false, message: 'Chave do produto não informada.', planType: 'trial', seats: 0 };
  }

  const cleaned = rawKey.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const parts = cleaned.split('-');

  // Chaves especiais de teste/desenvolvimento
  if (cleaned === 'OT26-DEMO-TEST-2026-3S' || cleaned === 'OT26-TEST-DEMO-2026-3S') {
    return { valid: true, message: 'Chave de Teste Autorizada (3 Instalações).', planType: 'lifetime', seats: 3 };
  }

  if (cleaned === 'OT26-PROD-2026-FULL-3S') {
    return { valid: true, message: 'Chave de Demonstração Completa (3 Instalações).', planType: 'lifetime', seats: 3 };
  }

  // Padrão estruturado de 5 blocos: OT26 - BLOCK1 - BLOCK2 - CHECKSUM - 3S
  if (parts.length === 5) {
    const [prefix, b1, b2, checksum, seatsBlock] = parts;
    if (prefix !== 'OT26') {
      return { valid: false, message: 'Prefixo de produto inválido. Deve iniciar com OT26.', planType: 'trial', seats: 0 };
    }

    const expectedCheck = calculateKeyChecksum(b1, b2, SECRET_SALT);
    if (checksum !== expectedCheck) {
      return { valid: false, message: 'Dígito verificador da chave inválido ou chave adulterada.', planType: 'trial', seats: 0 };
    }

    const seats = seatsBlock === '3S' ? 3 : parseInt(seatsBlock.replace(/\D/g, ''), 10) || expectedSeats;
    return {
      valid: true,
      message: `Chave Válida e Autêntica! Autorizada para até ${seats} instalações.`,
      planType: 'lifetime',
      seats,
    };
  }

  // Padrão de 4 blocos: OT26 - BLOCK1 - BLOCK2 - CHECKSUM
  if (parts.length === 4) {
    const [prefix, b1, b2, checksum] = parts;
    if (prefix !== 'OT26') {
      return { valid: false, message: 'Prefixo de chave inválido.', planType: 'trial', seats: 0 };
    }

    const expectedCheck = calculateKeyChecksum(b1, b2, SECRET_SALT);
    if (checksum !== expectedCheck) {
      return { valid: false, message: 'Código de autenticação da chave incorreto.', planType: 'trial', seats: 0 };
    }

    return {
      valid: true,
      message: 'Chave Válida e Autêntica! (3 Instalações).',
      planType: 'lifetime',
      seats: 3,
    };
  }

  return {
    valid: false,
    message: 'Formato de chave inválido. Formato correto: OT26-XXXX-YYYY-ZZZZ-3S',
    planType: 'trial',
    seats: 0,
  };
}

/**
 * Gerador de Chaves Oficiais (Ferramenta do Administrador / Vendedor)
 * Gera uma chave criptograficamente válida para o cliente.
 */
export function generateProductKey(
  clientName: string = 'CLIENTE',
  planType: 'lifetime' | 'annual' = 'lifetime',
  seats: number = 3
): string {
  // Gera bloco 1 a partir do nome do cliente + timestamp
  const rawSeed = `${clientName.toUpperCase().replace(/[^A-Z]/g, '')}-${Date.now()}`;
  let h1 = 0;
  for (let i = 0; i < rawSeed.length; i++) {
    h1 = (h1 << 5) - h1 + rawSeed.charCodeAt(i);
    h1 |= 0;
  }

  const b1 = Math.abs(h1).toString(16).toUpperCase().padStart(8, '0').substring(0, 4);
  const randomB2 = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase().padStart(4, '0');
  const checksum = calculateKeyChecksum(b1, randomB2, SECRET_SALT);

  return `OT26-${b1}-${randomB2}-${checksum}-${seats}S`;
}

/**
 * Registra a ativação do produto nesta máquina
 */
export function activateProduct(
  productKey: string,
  licenseeName: string,
  slotNumber: 1 | 2 | 3 = 1,
  machineName?: string
): { success: boolean; message: string; license?: ProductLicense } {
  const validation = validateProductKey(productKey);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const machineId = getMachineFingerprint();
  const now = new Date().toISOString();

  // Calcula data de expiração se for anual
  let expiresAt: string | null = null;
  if (validation.planType === 'annual') {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    expiresAt = d.toISOString();
  }

  const activationEntry: LicenseActivation = {
    machineId,
    machineName: machineName || `Computador Instalação #${slotNumber}`,
    slotNumber,
    activatedAt: now,
  };

  const license: ProductLicense = {
    productKey: productKey.trim().toUpperCase(),
    licenseeName: licenseeName.trim() || 'Empresa Licenciada',
    maxInstallations: validation.seats || 3,
    currentSlot: slotNumber,
    machineId,
    activatedAt: now,
    expiresAt,
    planType: validation.planType,
    signature: calculateKeyChecksum(productKey, machineId, SECRET_SALT),
    activationsLog: [activationEntry],
  };

  try {
    localStorage.setItem(PRODUCT_LICENSE_KEY, JSON.stringify(license));
    return {
      success: true,
      message: `Software ativado com sucesso para ${license.licenseeName}! (Instalação ${slotNumber} de ${license.maxInstallations})`,
      license,
    };
  } catch (err) {
    console.error('Erro ao salvar licença', err);
    return { success: false, message: 'Falha ao gravar arquivo de licença local.' };
  }
}

/**
 * Retorna a licença atualmente instalada no computador
 */
export function getStoredLicense(): ProductLicense | null {
  try {
    const raw = localStorage.getItem(PRODUCT_LICENSE_KEY);
    if (!raw) return null;
    const lic: ProductLicense = JSON.parse(raw);

    // Validação de assinatura local
    const expectedSig = calculateKeyChecksum(lic.productKey, lic.machineId, SECRET_SALT);
    if (lic.signature !== expectedSig) {
      console.warn('Assinatura de licença corrompida ou alterada.');
      return null;
    }

    // Verifica expiração
    if (lic.expiresAt) {
      const expDate = new Date(lic.expiresAt).getTime();
      if (Date.now() > expDate) {
        return null; // Expirada
      }
    }

    return lic;
  } catch {
    return null;
  }
}

/**
 * Informa se o produto está ativo e licenciado
 */
export function isProductActivated(): boolean {
  return getStoredLicense() !== null;
}

/**
 * Inicia ou consulta o período de avaliação gratuita (Trial de 15 dias)
 */
export function getTrialStatus(): { isTrialActive: boolean; daysRemaining: number } {
  try {
    let startStr = localStorage.getItem(TRIAL_START_KEY);
    if (!startStr) {
      startStr = new Date().toISOString();
      localStorage.setItem(TRIAL_START_KEY, startStr);
    }

    const startDate = new Date(startStr).getTime();
    const now = Date.now();
    const trialDays = 15;
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, trialDays - diffDays);

    return {
      isTrialActive: daysRemaining > 0,
      daysRemaining,
    };
  } catch {
    return { isTrialActive: false, daysRemaining: 0 };
  }
}

/**
 * Desinstala ou revoga a licença desta máquina (para transferência de máquina)
 */
export function revokeLicense(): void {
  try {
    localStorage.removeItem(PRODUCT_LICENSE_KEY);
  } catch (err) {
    console.error('Erro ao remover licença', err);
  }
}

/**
 * Exporta certificado de licença para arquivo .json (para backup ou comprovação de posse)
 */
export function exportLicenseCertificate(): void {
  const license = getStoredLicense();
  if (!license) return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(license, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `licenca_osnir_${license.productKey.substring(0, 9)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
