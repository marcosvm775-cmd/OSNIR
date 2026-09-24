import { ProductLicense, LicenseActivation } from '../types';

const MACHINE_ID_KEY = 'sys_machine_hwid_v1';
const PRODUCT_LICENSE_KEY = 'sys_product_license_v1';
const TRIAL_START_KEY = 'sys_trial_start_v1';

// Algoritmo determinístico para validação e geração de chaves
const SECRET_SALT = 'OSNIR_TURISMO_TRANSPORTES_2026_SECURE_KEY';
const LEGACY_SALT = 'OSNIR_TURISMO_2026_SECURE_SALT_!#98';

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
 * Algoritmo interno de Checksum para validar integridade da chave (Padrão 2026)
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
 * Checksum alternativo para compatibilidade retroativa com chaves de geradores anteriores
 */
function calculateLegacyChecksum(rawPart: string, salt: string): string {
  const combined = rawPart + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return (hex + 'K7X9').substring(0, 4);
}

export type LicensePlanType = 'monthly' | 'semiannual' | 'annual' | 'lifetime';

/**
 * Valida a chave de produto digitada.
 * Formatos suportados:
 * - Mensal (30 dias): OT26M-XXXX-YYYY-ZZZZ-3S
 * - Semestral (180 dias): OT26S-XXXX-YYYY-ZZZZ-3S
 * - Anual (365 dias): OT26A-XXXX-YYYY-ZZZZ-3S
 * - Vitalícia (Permanente): OT26V-XXXX-YYYY-ZZZZ-3S ou OT26-XXXX-YYYY-ZZZZ-3S
 */
export function validateProductKey(
  rawKey: string,
  expectedSeats: number = 3
): { valid: boolean; message: string; planType: 'monthly' | 'semiannual' | 'annual' | 'lifetime' | 'trial'; seats: number } {
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

  // Padrão estruturado de 5 blocos: PREFIXO - BLOCK1 - BLOCK2 - CHECKSUM - 3S
  if (parts.length === 5) {
    const [prefix, b1, b2, checksum, seatsBlock] = parts;
    let plan: 'monthly' | 'semiannual' | 'annual' | 'lifetime' = 'lifetime';
    let planLabel = 'Vitalícia';

    if (prefix === 'OT26M') {
      plan = 'monthly';
      planLabel = 'Mensal (30 dias)';
    } else if (prefix === 'OT26S') {
      plan = 'semiannual';
      planLabel = 'Semestral (6 meses)';
    } else if (prefix === 'OT26A') {
      plan = 'annual';
      planLabel = 'Anual (12 meses)';
    } else if (prefix === 'OT26V' || prefix === 'OT26') {
      plan = 'lifetime';
      planLabel = 'Vitalícia (Sem mensalidades)';
    } else {
      return { valid: false, message: 'Prefixo de produto inválido. Deve iniciar com OT26M, OT26S, OT26A ou OT26V.', planType: 'trial', seats: 0 };
    }

    const expectedCheck = calculateKeyChecksum(b1, b2, SECRET_SALT);
    const legacyCheck1 = calculateLegacyChecksum(`${prefix}-${b1}-${b2}`, SECRET_SALT);
    const legacyCheck2 = calculateLegacyChecksum(`${prefix}-${b1}-${b2}`, LEGACY_SALT);
    const isChecksumValid = (checksum === expectedCheck || checksum === legacyCheck1 || checksum === legacyCheck2);

    if (!isChecksumValid) {
      return { valid: false, message: 'Dígito verificador da chave inválido ou chave adulterada.', planType: 'trial', seats: 0 };
    }

    const seats = seatsBlock === '3S' ? 3 : parseInt(seatsBlock.replace(/\D/g, ''), 10) || expectedSeats;
    return {
      valid: true,
      message: `Chave Válida e Autêntica! Plano ${planLabel} para até ${seats} computadores.`,
      planType: plan,
      seats,
    };
  }

  // Padrão legado de 4 blocos: PREFIXO - BLOCK1 - BLOCK2 - CHECKSUM
  if (parts.length === 4) {
    const [prefix, b1, b2, checksum] = parts;
    let plan: 'monthly' | 'semiannual' | 'annual' | 'lifetime' = 'lifetime';

    if (prefix === 'OT26M') plan = 'monthly';
    else if (prefix === 'OT26S') plan = 'semiannual';
    else if (prefix === 'OT26A') plan = 'annual';
    else if (prefix === 'OT26V' || prefix === 'OT26') plan = 'lifetime';
    else {
      return { valid: false, message: 'Prefixo de chave inválido.', planType: 'trial', seats: 0 };
    }

    const expectedCheck = calculateKeyChecksum(b1, b2, SECRET_SALT);
    const legacyCheck1 = calculateLegacyChecksum(`${prefix}-${b1}-${b2}`, SECRET_SALT);
    const legacyCheck2 = calculateLegacyChecksum(`${prefix}-${b1}-${b2}`, LEGACY_SALT);
    const isChecksumValid = (checksum === expectedCheck || checksum === legacyCheck1 || checksum === legacyCheck2);

    if (!isChecksumValid) {
      return { valid: false, message: 'Código de autenticação da chave incorreto.', planType: 'trial', seats: 0 };
    }

    return {
      valid: true,
      message: 'Chave Válida e Autêntica! (3 Instalações).',
      planType: plan,
      seats: 3,
    };
  }

  return {
    valid: false,
    message: 'Formato de chave inválido. Formato correto: OT26M-XXXX-YYYY-ZZZZ-3S, OT26S-..., OT26A-... ou OT26V-...',
    planType: 'trial',
    seats: 0,
  };
}

/**
 * Gerador de Chaves Oficiais (Ferramenta Exclusiva do Administrador)
 * Gera uma chave criptograficamente válida para o cliente conforme o plano contratado.
 */
export function generateProductKey(
  clientName: string = 'CLIENTE',
  planType: 'monthly' | 'semiannual' | 'annual' | 'lifetime' = 'monthly',
  seats: number = 3
): string {
  // Define o prefixo conforme o período
  let prefix = 'OT26M';
  if (planType === 'monthly') prefix = 'OT26M';
  else if (planType === 'semiannual') prefix = 'OT26S';
  else if (planType === 'annual') prefix = 'OT26A';
  else if (planType === 'lifetime') prefix = 'OT26V';

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

  return `${prefix}-${b1}-${randomB2}-${checksum}-${seats}S`;
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

  // Calcula data de expiração conforme a periodicidade contratada
  let expiresAt: string | null = null;
  const d = new Date();

  if (validation.planType === 'monthly') {
    d.setDate(d.getDate() + 30); // 30 dias
    expiresAt = d.toISOString();
  } else if (validation.planType === 'semiannual') {
    d.setDate(d.getDate() + 180); // 6 meses (180 dias)
    expiresAt = d.toISOString();
  } else if (validation.planType === 'annual') {
    d.setDate(d.getDate() + 365); // 1 ano (365 dias)
    expiresAt = d.toISOString();
  } else if (validation.planType === 'lifetime') {
    expiresAt = null; // Vitalícia
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
    const planText =
      validation.planType === 'monthly'
        ? 'Mensal (30 dias)'
        : validation.planType === 'semiannual'
        ? 'Semestral (6 meses)'
        : validation.planType === 'annual'
        ? 'Anual (12 meses)'
        : 'Vitalícia';

    return {
      success: true,
      message: `Software ativado com sucesso para ${license.licenseeName}! Plano: ${planText} (Instalação ${slotNumber} de ${license.maxInstallations})`,
      license,
    };
  } catch (err) {
    console.error('Erro ao salvar licença', err);
    return { success: false, message: 'Falha ao gravar arquivo de licença local.' };
  }
}

/**
 * Retorna dados detalhados e amigáveis sobre a expiração da licença
 */
export function getLicenseExpiryDetails(license: ProductLicense | null): {
  isExpired: boolean;
  daysRemaining: number | null;
  formattedExpiry: string | null;
  planLabel: string;
} {
  if (!license) {
    return {
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: null,
      planLabel: 'Sem Licença Ativa',
    };
  }

  let planLabel = 'Vitalícia (Sem mensalidades)';
  if (license.planType === 'monthly') planLabel = 'Mensal (30 Dias)';
  else if (license.planType === 'semiannual') planLabel = 'Semestral (6 Meses)';
  else if (license.planType === 'annual') planLabel = 'Anual (12 Meses)';

  if (!license.expiresAt) {
    return {
      isExpired: false,
      daysRemaining: null,
      formattedExpiry: 'Vitalícia',
      planLabel,
    };
  }

  const expDate = new Date(license.expiresAt);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  const formattedExpiry = expDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    isExpired,
    daysRemaining,
    formattedExpiry,
    planLabel,
  };
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
 * Inicia ou consulta o período de avaliação gratuita (Demonstração de 10 dias)
 */
export function getTrialStatus(): { isTrialActive: boolean; daysRemaining: number; totalDays: number; startDate: string } {
  try {
    let startStr = localStorage.getItem(TRIAL_START_KEY);
    if (!startStr) {
      startStr = new Date().toISOString();
      localStorage.setItem(TRIAL_START_KEY, startStr);
    }

    const startDate = new Date(startStr).getTime();
    const now = Date.now();
    const trialDays = 10; // Demonstração de exatamente 10 dias
    const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, trialDays - diffDays);

    return {
      isTrialActive: daysRemaining > 0,
      daysRemaining,
      totalDays: trialDays,
      startDate: startStr,
    };
  } catch {
    return { isTrialActive: false, daysRemaining: 0, totalDays: 10, startDate: new Date().toISOString() };
  }
}

/**
 * Verifica se o uso do sistema está liberado nesta máquina:
 * 1. Se possuir chave de licença válida e ativa -> LIBERADO
 * 2. Se estiver dentro dos 10 dias de demonstração -> LIBERADO SEM TRAVA
 * 3. Se passar dos 10 dias e não tiver chave ativada -> BLOQUEADO / TRAVADO
 */
export function isSystemAccessAllowed(): boolean {
  if (isProductActivated()) {
    return true;
  }
  const trial = getTrialStatus();
  return trial.isTrialActive;
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

/**
 * Utilitário de testes para o administrador: Simular expiração do trial para testar a trava de 10 dias
 */
export function simulateTrialExpiry(): void {
  try {
    // Define a data de início para 11 dias atrás
    const past = new Date();
    past.setDate(past.getDate() - 11);
    localStorage.setItem(TRIAL_START_KEY, past.toISOString());
    localStorage.removeItem(PRODUCT_LICENSE_KEY);
  } catch (err) {
    console.error('Erro ao simular expiração', err);
  }
}

/**
 * Utilitário de testes para o administrador: Reiniciar o período de demonstração de 10 dias
 */
export function resetTrialForTesting(): void {
  try {
    localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
  } catch (err) {
    console.error('Erro ao reiniciar trial', err);
  }
}
