/**
 * Política de seguridad del chat WEEGO
 * --------------------------------------
 * Bloquea el envío de:
 *  - Números de teléfono / celular (AR e internacionales)
 *  - Menciones a WhatsApp / Telegram / Signal / Messenger
 *  - Usuarios de redes sociales (Instagram, Facebook, TikTok, X/Twitter, Snapchat)
 *  - Emails y links externos
 *  - Datos de pago (CBU, CVU, alias MP, tarjetas, criptos)
 *  - Frases típicas para sacar la conversación de la app
 *
 * Permite explícitamente:
 *  - Direcciones, intersecciones, esquinas, alturas, barrios, puntos de encuentro
 *
 * El sistema está diseñado para ser editable y escalable: agregá patrones
 * a `BLOCKED_PATTERNS` o términos a `ADDRESS_WHITELIST`.
 */

export const CHAT_POLICY_MESSAGE =
  'Por seguridad, no está permitido compartir teléfonos, contactos externos ni datos de pago fuera de WEEGO. Podés usar el chat para coordinar el punto de encuentro y los detalles del viaje.';

export type BlockedCategory =
  | 'phone'
  | 'whatsapp'
  | 'social'
  | 'email'
  | 'link'
  | 'payment'
  | 'off_platform_phrase';

interface BlockedPattern {
  category: BlockedCategory;
  /** Regex aplicada sobre el texto normalizado (lowercase + sin tildes) */
  regex: RegExp;
  /** Razón breve para logs/depuración. */
  reason: string;
}

/**
 * Términos relacionados a ubicaciones que deben permitirse aunque aparezcan
 * cerca de números (ej: "Av. Corrientes 1234", "altura 3500", "calle 50 nro 200").
 * Si el mensaje contiene ALGUNO de estos términos, los matches numéricos cortos
 * (alturas de calle) se ignoran.
 */
const ADDRESS_WHITELIST = [
  'av', 'avenida', 'calle', 'ruta', 'autopista', 'camino', 'pasaje',
  'altura', 'nro', 'numero', 'esquina', 'esq', 'entre', 'y',
  'barrio', 'bo', 'manzana', 'mz', 'lote', 'piso', 'depto', 'dpto',
  'km', 'kilometro', 'estacion', 'terminal', 'parada', 'plaza',
  'shopping', 'rotonda', 'cruce', 'puente', 'peaje',
  'norte', 'sur', 'este', 'oeste',
];

/**
 * Patrones bloqueados. Editar/añadir aquí para escalar la política.
 * Las regex se evalúan sobre el texto normalizado (sin tildes y en minúsculas).
 */
const BLOCKED_PATTERNS: BlockedPattern[] = [
  // ---- Teléfonos ----
  // Secuencias largas de dígitos (>=8) con separadores opcionales (espacios, guiones, paréntesis, puntos)
  {
    category: 'phone',
    regex: /(?:\+?\d[\s().-]?){8,}\d/,
    reason: 'Secuencia de dígitos compatible con un número de teléfono',
  },
  // Prefijos típicos AR escritos en palabras
  {
    category: 'phone',
    regex: /\b(?:cel(?:ular)?|tel(?:efono)?|whats?app|wpp|wsp|numero de tel|num de cel|mi numero)\b/i,
    reason: 'Mención explícita a teléfono/celular',
  },

  // ---- WhatsApp / mensajería externa ----
  {
    category: 'whatsapp',
    regex: /\b(?:whats?app|wpp|wsp|wa\.me|telegram|t\.me|signal|messenger|imessage|hangouts|discord)\b/i,
    reason: 'Mención a app de mensajería externa',
  },

  // ---- Redes sociales (handle o nombre) ----
  {
    category: 'social',
    regex: /\b(?:instagram|insta|ig|facebook|fb|tiktok|tik tok|twitter|x\.com|snapchat|snap|linkedin)\b/i,
    reason: 'Mención a red social',
  },
  // @handle de red social (no confundir con emails: emails llevan punto en el dominio)
  {
    category: 'social',
    regex: /(?:^|\s)@[a-z0-9._]{3,}/i,
    reason: 'Handle de red social (@usuario)',
  },

  // ---- Emails ----
  {
    category: 'email',
    regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    reason: 'Dirección de email',
  },

  // ---- Links externos ----
  {
    category: 'link',
    regex: /\b(?:https?:\/\/|www\.)\S+/i,
    reason: 'Link externo',
  },
  {
    category: 'link',
    // dominios sueltos tipo "miweb.com", "pago.ar" — excluye nombres de calles
    regex: /\b[a-z0-9-]{2,}\.(?:com|net|org|ar|io|co|app|me|link|page|info|biz|tv|xyz)\b/i,
    reason: 'Dominio externo',
  },

  // ---- Datos de pago ----
  {
    category: 'payment',
    regex: /\b(?:cbu|cvu|alias|mercadopago|mercado pago|mp|transferencia|transferi|paypal|binance|bitcoin|btc|usdt|cripto)\b/i,
    reason: 'Referencia a método/alias de pago externo',
  },
  {
    category: 'payment',
    // CBU/CVU = 22 dígitos seguidos
    regex: /\b\d{22}\b/,
    reason: 'CBU/CVU completo',
  },
  {
    category: 'payment',
    // tarjeta: 13–19 dígitos con o sin separadores
    regex: /\b(?:\d[ -]?){13,19}\b/,
    reason: 'Número de tarjeta',
  },

  // ---- Frases para coordinar fuera de la app ----
  {
    category: 'off_platform_phrase',
    regex:
      /\b(?:pasame tu (?:numero|num|cel|telefono|whats?app|wpp|insta|ig|face)|dame tu (?:numero|cel|wpp|whats?app|insta)|te (?:escribo|hablo|llamo) por (?:whats?app|wpp|insta|ig|face|telegram|sms)|hablemos por (?:whats?app|wpp|insta|telegram|fuera|afuera)|seguimos por (?:whats?app|wpp|insta|telegram|fuera)|te paso mi (?:numero|cel|whats?app|wpp|insta|ig|alias|cbu|cvu)|pagame por fuera|pago en efectivo por fuera|sin (?:la )?app)\b/i,
    reason: 'Frase típica para sacar la conversación de la app',
  },
];

/** Quita tildes y pasa a minúsculas para uniformar la detección. */
const normalize = (input: string): string =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const containsAddressContext = (normalized: string): boolean =>
  ADDRESS_WHITELIST.some((term) =>
    new RegExp(`(?:^|\\s|\\.)${term}(?:\\s|\\.|,|$)`).test(normalized),
  );

export interface ChatContentValidation {
  ok: boolean;
  category?: BlockedCategory;
  reason?: string;
}

/**
 * Valida el contenido de un mensaje de chat.
 *
 * Reglas:
 *  - Mensajes vacíos no son válidos.
 *  - Si hay contexto de dirección, los matches puramente numéricos (categoría "phone")
 *    se permiten (ej: "altura 1234 esquina Corrientes").
 *  - El resto de las categorías SIEMPRE bloquean, incluso con contexto de dirección.
 */
export function validateChatContent(raw: string): ChatContentValidation {
  const text = raw.trim();
  if (!text) return { ok: false, reason: 'Mensaje vacío' };

  const normalized = normalize(text);
  const hasAddressContext = containsAddressContext(normalized);

  for (const pattern of BLOCKED_PATTERNS) {
    if (!pattern.regex.test(normalized)) continue;

    // Excepción: si es solo una secuencia de dígitos y el mensaje claramente
    // describe una dirección/altura, lo dejamos pasar.
    if (pattern.category === 'phone' && hasAddressContext) {
      // Re-chequeamos: si la única coincidencia es la regex genérica de dígitos,
      // y NO hay menciones explícitas a "telefono/whatsapp/etc.", se permite.
      const explicitPhoneMention =
        /\b(?:cel(?:ular)?|tel(?:efono)?|whats?app|wpp|wsp|numero de tel|num de cel|mi numero)\b/i.test(
          normalized,
        );
      if (!explicitPhoneMention) continue;
    }

    return { ok: false, category: pattern.category, reason: pattern.reason };
  }

  return { ok: true };
}
