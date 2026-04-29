const state = {
  data: null,
  keywordByLang: {
    en: new Map(),
    zh: new Map(),
  },
  cardByNameLang: {
    en: new Map(),
    zh: new Map(),
  },
  cardByNormNameLang: {
    en: new Map(),
    zh: new Map(),
  },
  cardById: new Map(),
  baseKeywordTerms: {
    en: [],
    zh: [],
  },
  lang: "en",
  showUpgrade: false,
  filters: {
    type: "",
    cost: "",
    rarity: "",
    color: "",
    deprecated: "",
  },
  sort: {
    by: "",
    dir: "asc",
  },
  search: "",
  page: 1,
  pageSize: 24,
  suppressNextCardAnimation: false,
};

const uiText = {
  en: {
    eyebrow: "Downfall Mod Card Showcase",
    title: "Slay the Spire: Downfall Card Conpendium",
    subtitle: "WIP",
    toggleUpgrade: "Show Upgraded",
    toggleBase: "Show Base",
    searchLabel: "Search",
    typeLabel: "Type",
    costLabel: "Cost",
    rarityLabel: "Rarity",
    colorLabel: "Color",
    deprecatedLabel: "Deprecated",
    sortByLabel: "Sort by",
    sortDirLabel: "Order",
    sortDefault: "Default",
    sortFieldType: "Type",
    sortFieldCost: "Cost",
    sortFieldRarity: "Rarity",
    sortFieldColor: "Color",
    sortDirAsc: "Ascending",
    sortDirDesc: "Descending",
    pageSizeLabel: "Per page",
    summary: (shown, total) => `${shown} of ${total} cards`,
    noResults: "No cards match the current filters.",
    any: "Any",
    deprecatedOnly: "Only deprecated",
    deprecatedExclude: "Exclude deprecated",
    unplayable: "Unplayable",
    notInPool: "not in the pool",
  },
  zh: {
    eyebrow: "崩坠 Mod 卡牌展示",
    title: "杀戮尖塔：崩坠 卡牌图鉴",
    subtitle: "正在施工中",
    toggleUpgrade: "显示升级",
    toggleBase: "显示未升级",
    searchLabel: "搜索",
    typeLabel: "类型",
    costLabel: "费用",
    rarityLabel: "稀有度",
    colorLabel: "颜色",
    deprecatedLabel: "弃用状态",
    sortByLabel: "排序字段",
    sortDirLabel: "排序方向",
    sortDefault: "默认",
    sortFieldType: "类型",
    sortFieldCost: "费用",
    sortFieldRarity: "稀有度",
    sortFieldColor: "颜色",
    sortDirAsc: "正序",
    sortDirDesc: "逆序",
    pageSizeLabel: "每页数量",
    summary: (shown, total) => `显示 ${shown} / ${total} 张`,
    noResults: "没有符合条件的卡牌。",
    any: "全部",
    deprecatedOnly: "仅弃用",
    deprecatedExclude: "排除弃用",
    unplayable: "不可打出",
    notInPool: "不在卡池中",
  },
};

function isNotInPoolCard(card) {
  return Boolean(card && card.notInPool);
}

function getNotInPoolBadgeText(card) {
  if (card && card.color === "COLLECTIBLE") {
    return state.lang === "zh" ? "无法获得" : "Unobtainable";
  }
  return i18n("notInPool");
}

const elements = {
  langToggle: document.getElementById("langToggle"),
  upgradeToggle: document.getElementById("upgradeToggle"),
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  costFilter: document.getElementById("costFilter"),
  rarityFilter: document.getElementById("rarityFilter"),
  colorFilter: document.getElementById("colorFilter"),
  deprecatedFilter: document.getElementById("deprecatedFilter"),
  sortBy: document.getElementById("sortBy"),
  sortDir: document.getElementById("sortDir"),
  pageSize: document.getElementById("pageSize"),
  summary: document.getElementById("summary"),
  grid: document.getElementById("cardGrid"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  pageInfo: document.getElementById("pageInfo"),
};

function i18n(key) {
  return uiText[state.lang][key];
}

function escapeRegExp(text) {
  return (text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localizeColor(cardOrColor) {
  if (!cardOrColor) return "";
  const card = typeof cardOrColor === "object" ? cardOrColor : null;
  const color = card ? card.color : cardOrColor;
  if (card && card.colorName && card.colorName[state.lang]) {
    return card.colorName[state.lang];
  }
  if (!color) return "";
  const colorMap = {
    BOSS: { en: "Boss", zh: "首领" },
    COLLECTIBLE: { en: "Collectible", zh: "藏品" },
    COLORLESS: { en: "Colorless", zh: "无色" },
    CURSE: { en: "Curse", zh: "诅咒" },
  };
  const mapped = colorMap[color];
  if (mapped) {
    return mapped[state.lang] || color;
  }
  return color;
}

function localizeType(type) {
  if (!type) return "";
  const typeMap = {
    ATTACK: { en: "Attack", zh: "攻击" },
    SKILL: { en: "Skill", zh: "技能" },
    POWER: { en: "Power", zh: "能力" },
    STATUS: { en: "Status", zh: "状态" },
    CURSE: { en: "Curse", zh: "诅咒" },
  };
  const mapped = typeMap[type];
  if (!mapped) return type;
  return mapped[state.lang] || type;
}

function getTypeTagClass(type) {
  if (!type) return "tag";
  if (type === "ATTACK") return "tag tag-type tag-type-attack";
  if (type === "SKILL") return "tag tag-type tag-type-skill";
  if (type === "POWER") return "tag tag-type tag-type-power";
  return "tag";
}

function localizeRarity(rarity) {
  if (!rarity) return "";
  const rarityMap = {
    BASIC: { en: "Basic", zh: "基础" },
    COMMON: { en: "Common", zh: "普通" },
    UNCOMMON: { en: "Uncommon", zh: "罕见" },
    RARE: { en: "Rare", zh: "稀有" },
    SPECIAL: { en: "Special", zh: "特殊" },
    CURSE: { en: "Curse", zh: "诅咒" },
  };
  const mapped = rarityMap[rarity];
  if (!mapped) return rarity;
  return mapped[state.lang] || rarity;
}

function getRarityTagClass(rarity) {
  if (!rarity) return "tag";
  if (rarity === "UNCOMMON") return "tag tag-rarity-uncommon";
  if (rarity === "RARE") return "tag tag-rarity-rare";
  return "tag";
}

function escapeHtml(text) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fillNumericTokens(text, card, useUpgrade = state.showUpgrade) {
  const baseTokenValues = card.tokenValues || {};
  const upgradeTokenValues = card.upgradeTokenValues || baseTokenValues;
  const baseStats = card.stats || {};
  const upgradeStats = card.upgradeStats || baseStats;
  const tokenValues = useUpgrade ? upgradeTokenValues : baseTokenValues;
  const stats = useUpgrade ? upgradeStats : baseStats;
  const wrapFilledValue = (value, changed) => (changed ? `__TVG__${value}__` : `__TV__${value}__`);

  function resolveFromStats(token, statsSource) {
    const upper = token.toUpperCase();
    if (upper === "D") return statsSource.damage;
    if (upper === "B") return statsSource.block;
    if (upper === "M") return statsSource.magic;
    if (upper.endsWith(":M2") || upper.endsWith("SECONDM") || upper.endsWith("M2")) return statsSource.secondMagic;
    if (upper.endsWith(":M3") || upper.endsWith("THIRDM") || upper.endsWith("M3")) return statsSource.thirdMagic;
    if (upper.endsWith(":D2") || upper.endsWith("SECONDD") || upper.endsWith("D2")) return statsSource.secondDamage;
    if (upper.includes("SELFHARM") || upper.includes("SELFDAMAGE")) return statsSource.selfDamage;
    if (upper === "SLIME") return statsSource.slime;
    return null;
  }

  return (text || "").replace(/!([A-Za-z0-9_:]+)!/g, (full, token) => {
    let value = null;
    let baseValue = null;
    if (Object.prototype.hasOwnProperty.call(tokenValues, token)) {
      value = tokenValues[token];
      baseValue = Object.prototype.hasOwnProperty.call(baseTokenValues, token) ? baseTokenValues[token] : value;
    } else {
      value = resolveFromStats(token, stats);
      baseValue = resolveFromStats(token, baseStats);
    }

    if (typeof value === "number") {
      const changed = useUpgrade && typeof baseValue === "number" && value !== baseValue;
      return wrapFilledValue(value, changed);
    }
    return full;
  });
}

function finalizeFilledTokenSpacing(text) {
  if (!text) return "";
  if (state.lang === "zh") {
    // In zh mode, remove spaces around filled numeric values.
    return text
      .replace(/\s*__TVG__(-?\d+)__\s*/g, "__TVG__$1__")
      .replace(/\s*__TV__(-?\d+)__\s*/g, "$1");
  }
  return text
    .replace(/__TVG__(-?\d+)__/g, "__TVG__$1__")
    .replace(/__TV__(-?\d+)__/g, "$1");
}

function renderNumericMarkers(text) {
  if (!text) return "";
  return text.replace(/__TVG__(-?\d+)__/g, '<span class="num-up">$1</span>');
}

function renderBracketColorSyntax(text) {
  if (!text) return "";
  // Parse STS color syntax like [#e087a4]text[] after other highlights,
  // so explicit color wrappers have lower priority.
  return text
    .replace(/\[#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/g, (_full, hex) => `<span class="inline-color" style="color:#${hex}">`)
    .replace(/\[\]/g, "</span>");
}

function attachAfterlifeHover(text) {
  if (!text) return "";
  let rendered = text;
  // Keep purple highlight, but make Afterlife/阴世 text hoverable via keyword tooltip.
  rendered = rendered.replace(
    /<span class="inline-color" style="color:\s*#e087a4">\s*(阴世)\s*([。.]?)\s*<\/span>/gi,
    (_full, label, punct) => `<span class="inline-color kw" data-kw-alias="阴世" style="color:#e087a4">${label}</span>${punct || ""}`,
  );
  rendered = rendered.replace(
    /<span class="inline-color" style="color:\s*#e087a4">\s*(Afterlife)\s*([。.]?)\s*<\/span>/gi,
    (_full, label, punct) => `<span class="inline-color kw" data-kw-alias="Afterlife" style="color:#e087a4">${label}</span>${punct || ""}`,
  );
  return rendered;
}

function normalizeDescriptionSpacing(text) {
  let normalized = text || "";
  // Remove spaces around energy symbols for all languages.
  normalized = normalized.replace(/\s*\[E\]\s*/g, "[E]");

  if (state.lang === "zh") {
    // Normalize full-width punctuation for zh output.
    normalized = normalized.replace(/,/g, "，").replace(/｡/g, "。");
    // Remove spaces around plain numeric literals in zh descriptions.
    normalized = normalized.replace(/\s*(-?\d+(?:\.\d+)?)\s*/g, "$1");
  }

  return normalized;
}

function hideZhSpacesAfterFormatting(htmlText) {
  if (!htmlText || state.lang !== "zh") return htmlText || "";
  // Remove visible spaces in text segments while preserving HTML tags/attributes.
  return htmlText
    .split(/(<[^>]+>)/g)
    .map((segment) => (segment.startsWith("<") ? segment : segment.replace(/[ \u3000]+/g, "")))
    .join("");
}

function stripRemoveSpaceMarkers(htmlText) {
  if (!htmlText) return htmlText || "";
  // Remove marker and neighboring spaces in plain-text segments only.
  return htmlText
    .split(/(<[^>]+>)/g)
    .map((segment) => (segment.startsWith("<") ? segment : segment.replace(/\s*\[REMOVE_SPACE\]\s*/gi, "")))
    .join("");
}

function renderEnergyToken(text, card) {
  if (!text) return "";
  const icon = card && card.energyIcon;
  if (!icon) return text;
  const iconHtml = `<span class="energy-token"><img src="${icon}" alt="E" loading="lazy"></span>`;
  return text.replace(/\[E\]/g, iconHtml);
}

function highlightSocketPlaceholders(text) {
  if (!text) return "";
  if (state.lang === "zh") {
    return text.replace(/\[孔位\]/g, '<span class="kw" data-kw-alias="镶嵌">[孔位]</span>');
  }
  return text.replace(/\[\s*Socket\s*\]/gi, '<span class="kw" data-kw-alias="Socket">[ Socket ]</span>');
}

function stripResidualStarPrefixes(text) {
  if (!text) return "";
  // Clean unresolved "*term" prefixes while keeping punctuation and spacing intact.
  // Use a broader non-word boundary so cases like "*小刀" / "*虚空" are consistently handled.
  return text.replace(/(^|[^0-9A-Za-z_\u4e00-\u9fff])\*\s*(?=[A-Za-z\u4e00-\u9fff])/g, "$1");
}

function buildCardNameIndex() {
  ["en", "zh"].forEach((lang) => {
    const map = new Map();
    const normMap = new Map();
    (state.data.cards || []).forEach((card) => {
      const name = ((card.name || {})[lang] || "").trim();
      if (!name) return;
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name).push(card);

      const norm = normalizeCardRefName(name);
      if (!normMap.has(norm)) {
        normMap.set(norm, []);
      }
      normMap.get(norm).push(card);
    });
    state.cardByNameLang[lang] = map;
    state.cardByNormNameLang[lang] = normMap;
  });

  state.cardById = new Map((state.data.cards || []).map((card) => [card.id, card]));
}

function normalizeCardRefName(text) {
  return (text || "")
    .trim()
    .replace(/[+＋]+$/g, "")
    .replace(/[\s\u3000]/g, "")
    .replace(/[，。｡,\.！!？?：:；;、\)）\]】\}」』]+$/g, "")
    .toLowerCase();
}

function getCardIdPrefix(cardId) {
  if (!cardId || typeof cardId !== "string") return "";
  const idx = cardId.indexOf(":");
  if (idx <= 0) return "";
  return cardId.slice(0, idx).toLowerCase();
}

function resolveReferencedCard(refName, sourceCardId) {
  const map = state.cardByNameLang[state.lang] || new Map();
  const normMap = state.cardByNormNameLang[state.lang] || new Map();
  const raw = (refName || "").trim();
  if (!raw) return null;

  const candidates = [];
  const seen = new Set();

  function collectByKey(key) {
    if (!key) return;
    const list = map.get(key);
    if (!list) return;
    list.forEach((card) => {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        candidates.push(card);
      }
    });
  }

  collectByKey(raw);
  collectByKey(raw.replace(/[+＋]+$/g, "").trim());

  if (!candidates.length) {
    const norm = normalizeCardRefName(raw);
    const list = normMap.get(norm) || [];
    list.forEach((card) => {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        candidates.push(card);
      }
    });
  }

  if (!candidates.length && state.lang === "en") {
    const lower = raw.toLowerCase();
    for (const [name, list] of map.entries()) {
      if ((name || "").toLowerCase() !== lower) continue;
      list.forEach((card) => {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          candidates.push(card);
        }
      });
    }
  }

  if (!candidates.length) return null;

  const sourcePrefix = getCardIdPrefix(sourceCardId);
  if (!sourcePrefix) return candidates[0];

  const sameMod = candidates.find((card) => getCardIdPrefix(card.id) === sourcePrefix);
  return sameMod || candidates[0];
}

function highlightCardReferences(text, sourceCardId) {
  if (!text) return "";
  const sourceIdSafe = escapeHtml(sourceCardId || "");
  let rendered = text.replace(/(^|[\s>（(【\[「『:：，,。.!！？;；、\-+])\*\s*([A-Za-z0-9_\-+'’/·\.\u4e00-\u9fff+＋]+)/g, (_full, lead, ref) => {
    const refSafe = escapeHtml(ref);
    return `${lead}<span class="card-ref" data-card-ref="${refSafe}" data-source-id="${sourceIdSafe}">${refSafe}</span>`;
  });

  if (state.lang === "zh") {
    rendered = rendered.replace(/\s*(<span class="card-ref"[^>]*>[^<]+<\/span>)\s*/g, "$1");
  }

  return rendered;
}

function highlightCardReferencesNoHover(text) {
  if (!text) return "";
  let rendered = text.replace(/(^|[\s>（(【\[「『:：，,。.!！？;；、\-+])\*\s*([A-Za-z0-9_\-+'’/·\.\u4e00-\u9fff+＋]+)/g, (_full, lead, ref) => {
    const refSafe = escapeHtml(ref);
    return `${lead}<span class="card-name-ref">${refSafe}</span>`;
  });

  if (state.lang === "zh") {
    rendered = rendered.replace(/\s*(<span class="card-name-ref"[^>]*>[^<]+<\/span>)\s*/g, "$1");
  }

  return rendered;
}

function withProtectedCardNameRefs(text, transform) {
  if (!text) return "";
  const stash = [];
  const protectedText = text.replace(/<span class="card-name-ref"[^>]*>[\s\S]*?<\/span>/g, (match) => {
    const token = `@@CARDREF_${stash.length}@@`;
    stash.push(match);
    return token;
  });

  let output = transform(protectedText);
  stash.forEach((html, index) => {
    output = output.replaceAll(`@@CARDREF_${index}@@`, html);
  });
  return output;
}

function highlightReferencedCardNamesByMetadata(text, sourceCard) {
  if (!text || !sourceCard) return text || "";

  const refIds = [];
  const seen = new Set();
  const pushId = (id) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    refIds.push(id);
  };

  (sourceCard.previewReferences || []).forEach((item) => {
    if (item && typeof item === "object") pushId(item.id);
  });
  (sourceCard.references || []).forEach((id) => pushId(id));

  const refNames = refIds
    .map((id) => {
      const card = state.cardById.get(id);
      return card ? ((card.name || {})[state.lang] || "").trim() : "";
    })
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!refNames.length) return text;

  return withProtectedCardNameRefs(text, (input) => {
    let rendered = input;
    refNames.forEach((name) => {
      const escaped = escapeRegExp(name);
      if (!escaped) return;
      const reg = new RegExp(`(^|[\\s>（(【\\[「『:：，,。.!！？;；、\\-+])(${escaped}(?:\\+)?)`, "g");
      rendered = rendered.replace(reg, (_full, lead, matched) => `${lead}<span class="card-name-ref">${matched}</span>`);
    });
    return rendered;
  });
}

function buildKeywordZhIndex() {
  ["en", "zh"].forEach((lang) => {
    const map = new Map();
    const entries = (state.data && state.data.keywords && state.data.keywords[lang]) || [];
    entries.forEach((entry) => {
      const aliases = entry.aliases || [];
      aliases.forEach((alias) => {
        if (alias && !map.has(alias)) {
          map.set(alias, entry);
        }
      });
      if (entry.name && !map.has(entry.name)) {
        map.set(entry.name, entry);
      }
    });
    state.keywordByLang[lang] = map;
  });
}

function buildBaseKeywordIndex() {
  const baseKeywords = (state.data && state.data.baseKeywords) || [];
  const enTerms = new Set();
  const zhTerms = new Set();

  baseKeywords.forEach((entry) => {
    const enAliases = (((entry || {}).en || {}).aliases || []).filter((v) => typeof v === "string" && v.trim());
    const zhAliases = (((entry || {}).zh || {}).aliases || []).filter((v) => typeof v === "string" && v.trim());
    enAliases.forEach((alias) => enTerms.add(alias.trim()));
    zhAliases.forEach((alias) => zhTerms.add(alias.trim()));
  });

  state.baseKeywordTerms.en = [...enTerms].sort((a, b) => b.length - a.length);
  state.baseKeywordTerms.zh = [...zhTerms].sort((a, b) => b.length - a.length);
}

function renderKeywordSpan(label) {
  const rawLabel = label || "";
  const displayLabel = rawLabel.replace(/_/g, " ");
  const text = escapeHtml(displayLabel);
  const aliasAttr = rawLabel === displayLabel ? "" : ` data-kw-alias="${escapeHtml(rawLabel)}"`;
  return `<span class="kw"${aliasAttr}>${text}</span>`;
}

function findKeywordEntry(label) {
  if (!label) return null;
  const map = state.keywordByLang[state.lang];
  if (!map) return null;

  if (map.has(label)) {
    return map.get(label);
  }

  if (state.lang === "en") {
    const lower = label.toLowerCase();
    for (const [alias, entry] of map.entries()) {
      if ((alias || "").toLowerCase() === lower) {
        return entry;
      }
    }
  }

  return null;
}

function getHardcodedKeywordEntry(label) {
  if (!label) return null;
  if (state.lang === "zh" && label === "镶嵌") {
    return {
      name: "镶嵌",
      description: " #y宝石 能够被 #y镶嵌 进有 #y孔位 的牌上，使其效果附加于牌。",
    };
  }
  return null;
}

function getKeywordTooltip() {
  let tip = document.querySelector(".kw-tooltip");
  if (tip) return tip;
  tip = document.createElement("div");
  tip.className = "kw-tooltip";
  document.body.appendChild(tip);
  return tip;
}

function formatTooltipDescriptionText(rawText, cardContext) {
  let text = normalizeDescriptionSpacing(rawText || "");
  if (cardContext) {
    text = fillNumericTokens(text, cardContext, state.showUpgrade);
    text = finalizeFilledTokenSpacing(text);
  }
  text = escapeHtml(text).replace(/NL/g, "<br>");
  text = renderEnergyToken(text, cardContext || null);
  text = highlightCardReferencesNoHover(text);
  text = stripResidualStarPrefixes(text);
  text = highlightSocketPlaceholders(text);
  text = renderNumericMarkers(text);
  text = text.replace(/#([ybr])\s*([^\s<]+)/g, (_full, colorToken, word) => {
    const cls = colorToken === "y"
      ? "kw-mark-yellow"
      : colorToken === "b"
        ? "kw-mark-blue"
        : "kw-mark-red";
    return `<span class="${cls}">${word}</span>`;
  });
  text = renderBracketColorSyntax(text);
  text = attachAfterlifeHover(text);
  text = hideZhSpacesAfterFormatting(text);
  text = stripRemoveSpaceMarkers(text);
  return text;
}

function showKeywordTooltip(entry, anchorRect, cardContext) {
  if (!entry || !entry.description) return;
  const tip = getKeywordTooltip();
  const name = escapeHtml(entry.name || "");
  const desc = formatTooltipDescriptionText(entry.description || "", cardContext);

  tip.innerHTML = `
    <div class="kw-tip-name">${name}</div>
    <div class="kw-tip-desc">${desc}</div>
  `;
  tip.classList.add("show");

  const margin = 10;
  const rect = anchorRect;
  const tipRect = tip.getBoundingClientRect();
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 8;

  const maxLeft = window.scrollX + window.innerWidth - tipRect.width - margin;
  if (left > maxLeft) {
    left = Math.max(window.scrollX + margin, maxLeft);
  }

  const maxTop = window.scrollY + window.innerHeight - tipRect.height - margin;
  if (top > maxTop) {
    top = rect.top + window.scrollY - tipRect.height - 8;
  }

  tip.style.left = `${Math.max(window.scrollX + margin, left)}px`;
  tip.style.top = `${Math.max(window.scrollY + margin, top)}px`;
}

function hideKeywordTooltip() {
  const tip = document.querySelector(".kw-tooltip");
  if (!tip) return;
  tip.classList.remove("show");
}

function getCardPreviewTooltip() {
  let tip = document.querySelector(".card-mini-preview");
  if (tip) return tip;
  tip = document.createElement("div");
  tip.className = "card-mini-preview";
  document.body.appendChild(tip);
  return tip;
}

function showCardPreviewTooltip(card, anchorRect) {
  if (!card) return;
  const tip = getCardPreviewTooltip();
  tip.classList.remove("refs-panel");
  tip.classList.remove("preview-left", "preview-right");
  const previewCardEl = buildCardElement(card, true, true);
  tip.innerHTML = "";
  tip.appendChild(previewCardEl);

  tip.classList.add("show");

  const margin = 10;
  const rect = anchorRect;
  const tipRect = tip.getBoundingClientRect();
  let left = rect.right + window.scrollX + 10;
  let top = rect.top + window.scrollY;

  const maxLeft = window.scrollX + window.innerWidth - tipRect.width - margin;
  if (left > maxLeft) {
    left = rect.left + window.scrollX - tipRect.width - 10;
  }

  const maxTop = window.scrollY + window.innerHeight - tipRect.height - margin;
  if (top > maxTop) {
    top = maxTop;
  }

  tip.style.left = `${Math.max(window.scrollX + margin, left)}px`;
  tip.style.top = `${Math.max(window.scrollY + margin, top)}px`;
}

function showCardReferencePreview(refEntries, anchorRect) {
  if (!refEntries || !refEntries.length) return;
  const tip = getCardPreviewTooltip();
  tip.classList.add("refs-panel");
  tip.classList.remove("preview-left", "preview-right");
  tip.innerHTML = "";
  refEntries.forEach((entry) => {
    const card = entry && typeof entry === "object" ? entry.card : entry;
    const upgraded = Boolean(entry && typeof entry === "object" && entry.upgraded);
    if (!card) return;
    tip.appendChild(buildCardElement(card, true, true, { forceUpgrade: upgraded }));
  });

  tip.classList.add("show");

  const margin = 10;
  const rect = anchorRect;
  const tipRect = tip.getBoundingClientRect();
  let left = rect.right + window.scrollX + 10;
  let top = rect.top + window.scrollY;
  let placedLeftOfAnchor = false;

  const maxLeft = window.scrollX + window.innerWidth - tipRect.width - margin;
  if (left > maxLeft) {
    left = rect.left + window.scrollX - tipRect.width - 10;
    placedLeftOfAnchor = true;
  }

  tip.classList.add(placedLeftOfAnchor ? "preview-left" : "preview-right");

  const maxTop = window.scrollY + window.innerHeight - tipRect.height - margin;
  if (top > maxTop) {
    top = maxTop;
  }

  tip.style.left = `${Math.max(window.scrollX + margin, left)}px`;
  tip.style.top = `${Math.max(window.scrollY + margin, top)}px`;
}

function hideCardPreviewTooltip() {
  const tip = document.querySelector(".card-mini-preview");
  if (!tip) return;
  tip.classList.remove("refs-panel");
  tip.classList.remove("preview-left", "preview-right");
  tip.classList.remove("show");
}

function bindKeywordTooltipEvents() {
  elements.grid.addEventListener("mouseover", (event) => {
    const kw = event.target.closest(".kw");
    if (!kw || !elements.grid.contains(kw)) {
      return;
    }
    const alias = (kw.dataset.kwAlias || "").trim();
    const label = alias || (kw.textContent || "").trim();
    const entry = findKeywordEntry(label) || getHardcodedKeywordEntry(label);
    if (!entry || !entry.description) {
      hideKeywordTooltip();
      return;
    }
    const cardNode = kw.closest("article.card[data-card-id]");
    const cardContext = cardNode ? state.cardById.get(cardNode.dataset.cardId || "") : null;
    showKeywordTooltip(entry, kw.getBoundingClientRect(), cardContext || null);
  });

  elements.grid.addEventListener("mouseout", (event) => {
    const kw = event.target.closest(".kw");
    if (!kw || !elements.grid.contains(kw)) {
      return;
    }
    const to = event.relatedTarget;
    if (to && kw.contains(to)) {
      return;
    }
    hideKeywordTooltip();
  });

  window.addEventListener("scroll", hideKeywordTooltip, { passive: true });
}

function bindCardReferencePreviewEvents() {
  elements.grid.addEventListener("mouseover", (event) => {
    const cardNode = event.target.closest("article.card[data-card-id]");
    if (!cardNode || !elements.grid.contains(cardNode)) {
      return;
    }
    const card = state.cardById.get(cardNode.dataset.cardId || "");
    if (!card) {
      hideCardPreviewTooltip();
      return;
    }
    const sourceCardUpgradedInView = Boolean(state.showUpgrade && hasCardUpgradeableVariant(card));
    const previewRefEntries = (card.previewReferences || [])
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const refCard = state.cardById.get(item.id || "");
        if (!refCard) return null;
        return {
          card: refCard,
          upgraded: Boolean(item.upgraded) && sourceCardUpgradedInView,
        };
      })
      .filter(Boolean);

    const refEntries = previewRefEntries.length
      ? previewRefEntries
      : (card.references || [])
          .map((id) => state.cardById.get(id))
          .filter(Boolean)
          .map((refCard) => ({ card: refCard, upgraded: false }));

    if (!refEntries.length) {
      hideCardPreviewTooltip();
      return;
    }
    showCardReferencePreview(refEntries, cardNode.getBoundingClientRect());
  });

  elements.grid.addEventListener("mouseout", (event) => {
    const cardNode = event.target.closest("article.card[data-card-id]");
    if (!cardNode || !elements.grid.contains(cardNode)) {
      return;
    }
    const to = event.relatedTarget;
    if (to && cardNode.contains(to)) {
      return;
    }
    hideCardPreviewTooltip();
  });

  window.addEventListener("scroll", hideCardPreviewTooltip, { passive: true });
}

function shouldHighlightPrefixedNoun(noun, hasKeywordEntry) {
  if (hasKeywordEntry) return true;
  if (!noun || noun.length < 2) return false;
  // Skip variable-like placeholders such as m2, d3, clm2.
  if (/^[A-Za-z]{1,5}\d+$/i.test(noun)) return false;
  return /[A-Za-z_\u4e00-\u9fff]/.test(noun);
}

function highlightPrefixedKeywords(text) {
  if (!text) return "";
  return withProtectedCardNameRefs(text, (input) => {
    const prefixedPattern = /([A-Za-z_][\w]*):([^\s<>{}\[\]，。｡,.!！？:：;；]+)/g;
    let rendered = input.replace(prefixedPattern, (_full, _prefix, noun) => {
      let matchedNoun = noun;
      let entry = findKeywordEntry(matchedNoun);

      if (!entry) {
        for (let i = noun.length - 1; i >= 1; i -= 1) {
          const candidate = noun.slice(0, i);
          const found = findKeywordEntry(candidate);
          if (found) {
            matchedNoun = candidate;
            entry = found;
            break;
          }
        }
      }

      if (!shouldHighlightPrefixedNoun(matchedNoun, Boolean(entry))) {
        return _full;
      }

      const rest = noun.slice(matchedNoun.length);
      return `${renderKeywordSpan(matchedNoun)}${rest}`;
    });
    if (state.lang === "zh") {
      // Remove spaces around highlighted keyword in zh mode.
      rendered = rendered.replace(/\s*(<span class="kw"[^>]*>[^<]+<\/span>)\s*/g, "$1");
    }
    return rendered;
  });
}

function highlightBaseKeywords(text) {
  if (!text) return "";
  return withProtectedCardNameRefs(text, (input) => {
    let rendered = input;

    if (state.lang === "zh") {
      state.baseKeywordTerms.zh.forEach((term) => {
        const escaped = escapeRegExp(term);
        if (!escaped) return;
        // zh rule: only highlight when prefixed by whitespace, '*', or start-of-line.
        const reg = new RegExp(`(^|[\\s*])(${escaped})(?=$|[\\s，。｡,.!！？:：;；、\\)）\\]】\\}」』])`, "g");
        rendered = rendered.replace(reg, (_full, lead, match) => `${lead}${renderKeywordSpan(match)}`);
      });
      return rendered;
    }

    state.baseKeywordTerms.en.forEach((term) => {
      const escaped = escapeRegExp(term);
      if (!escaped) return;
      const reg = new RegExp(`\\b(${escaped})\\b`, "gi");
      rendered = rendered.replace(reg, (_full, match) => renderKeywordSpan(match));
    });
    return rendered;
  });
}

function applyI18n() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    const value = i18n(key);
    if (value !== undefined) {
      node.textContent = value;
    }
  });

  elements.langToggle.textContent = state.lang.toUpperCase();
  elements.upgradeToggle.textContent = state.showUpgrade ? i18n("toggleBase") : i18n("toggleUpgrade");
  elements.searchInput.placeholder = state.lang === "zh" ? "卡名或描述" : "Card name or description";
}

function buildSelect(select, options) {
  select.innerHTML = "";
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    select.appendChild(el);
  });
}

function formatCost(cost) {
  if (cost === -1) return "X";
  if (cost === -2) return "-";
  if (cost === null || cost === undefined) return "?";
  return String(cost);
}

function normalizeSearchText(text) {
  let normalized = (text || "").toLowerCase();
  normalized = normalized.replace(/\[#(?:[0-9a-f]{3}|[0-9a-f]{6})\]/gi, "");
  normalized = normalized.replace(/\[\]/g, "");
  normalized = normalized.replace(/__TVG__|__TV__/g, "");
  normalized = normalized.replace(/\bNL\b/g, " ");
  normalized = normalized.replace(/\s+([.,!?;:，。！？；：、])/g, "$1");
  normalized = normalized.replace(/[\s_]+/g, "");
  return normalized;
}

function getDisplayDescriptionByMode(card, useUpgrade = state.showUpgrade) {
  const base = card.description[state.lang] || "";
  if (!useUpgrade) return base;
  if (card.usesUpgradeDescription === false) return base;
  return card.upgradeDescription[state.lang] || base;
}

function hasAnyNumericStatChange(card) {
  const base = card.stats || {};
  const upgraded = card.upgradeStats || base;
  const keys = ["damage", "block", "magic", "secondMagic", "thirdMagic", "secondDamage", "selfDamage", "slime"];
  return keys.some((key) => {
    const a = base[key];
    const b = upgraded[key];
    return typeof a === "number" && typeof b === "number" && a !== b;
  });
}

function hasCardUpgradeableVariant(card) {
  if (!card) return false;
  if (typeof card.cost === "number" && typeof card.upgradeCost === "number" && card.cost !== card.upgradeCost) {
    return true;
  }
  if (hasAnyNumericStatChange(card)) {
    return true;
  }
  const baseDesc = ((card.description || {})[state.lang] || "").trim();
  const upDesc = ((card.upgradeDescription || {})[state.lang] || "").trim();
  if (upDesc && upDesc !== baseDesc) {
    return true;
  }
  return false;
}

function buildSearchableDescription(card) {
  let text = resolveCardBaseDescription(card);
  text = normalizeDescriptionSpacing(text);
  text = fillNumericTokens(text, card);
  text = finalizeFilledTokenSpacing(text);
  text = stripResidualStarPrefixes(text);
  text = hideZhSpacesAfterFormatting(text);
  text = stripRemoveSpaceMarkers(text);
  return text;
}

function matchesSearch(card) {
  if (!state.search) return true;
  const search = normalizeSearchText(state.search);
  const name = normalizeSearchText(card.name[state.lang] || "");
  const id = normalizeSearchText(card.id || "");
  const desc = normalizeSearchText(buildSearchableDescription(card));
  return name.includes(search) || id.includes(search) || desc.includes(search);
}

function matchesFilter(value, filterValue) {
  if (!filterValue) return true;
  return value === filterValue;
}

function matchesCost(cardCost) {
  if (!state.filters.cost) return true;
  if (state.filters.cost === "X") return cardCost === -1;
  if (state.filters.cost === "UNPLAYABLE") return cardCost === -2;
  if (state.filters.cost === "6+") return typeof cardCost === "number" && cardCost >= 6;
  return cardCost === Number(state.filters.cost);
}

function matchesDeprecated(card) {
  if (!state.filters.deprecated) return true;
  if (state.filters.deprecated === "ONLY") return Boolean(card.deprecated);
  if (state.filters.deprecated === "EXCLUDE") return !card.deprecated;
  return true;
}

const raritySortRank = {
  BASIC: 0,
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  CURSE: 4,
  SPECIAL: 5,
};

function compareMaybeString(a, b) {
  return (a || "").localeCompare((b || ""), state.lang === "zh" ? "zh" : "en");
}

function costSortValue(card) {
  const cost = getDisplayCost(card);
  if (cost === -2) return 1001;
  if (cost === -1) return 1000;
  if (typeof cost === "number") return cost;
  return 1002;
}

function compareCardsBySort(a, b) {
  const dir = state.sort.dir === "desc" ? -1 : 1;
  const by = state.sort.by || "";

  if (!by) {
    return compareMaybeString(a.id, b.id);
  }

  let cmp = 0;
  if (by === "type") {
    cmp = compareMaybeString(localizeType(a.type), localizeType(b.type));
  } else if (by === "cost") {
    cmp = costSortValue(a) - costSortValue(b);
  } else if (by === "rarity") {
    const ar = raritySortRank[a.rarity] ?? 999;
    const br = raritySortRank[b.rarity] ?? 999;
    cmp = ar - br;
  } else if (by === "color") {
    cmp = compareMaybeString(localizeColor(a), localizeColor(b));
  }

  if (cmp === 0) {
    cmp = compareMaybeString(a.name[state.lang], b.name[state.lang]);
  }
  if (cmp === 0) {
    cmp = compareMaybeString(a.id, b.id);
  }
  return cmp * dir;
}

function shouldRenderAfterlifeExtended(card, text) {
  if (card && card.isAfterlifeCard === true) return true;
  if (card && card.isAfterlifeCard === false) return false;
  const t = text || "";
  if (!t) return false;
  if (/\[#e087a4\][^\[]*(阴世|Afterlife)(?:[。.]|\s)*\[\]/i.test(t)) return true;
  return false;
}

function colorizeAfterlifeExtended(text) {
  const words = (text || "").split(" ");
  return words
    .map((word) => {
      if (word === "" || word === "!D!" || word === "!B!" || word === "!M!" || word === "!burny!" || word === "NL") {
        return word;
      }
      return `[#e087a4]${word}[]`;
    })
    .join(" ");
}

function resolveCardBaseDescription(card, useUpgrade = state.showUpgrade) {
  const base = getDisplayDescriptionByMode(card, useUpgrade);

  if (!shouldRenderAfterlifeExtended(card, base)) {
    return base;
  }

  const extList = ((card.extendedDescription || {})[state.lang] || []);
  if (!extList.length || !extList[0]) {
    return base;
  }

  return `${base}${colorizeAfterlifeExtended(extList[0])}`;
}

function renderDescription(card, options = {}) {
  const useUpgrade = options.forceUpgrade ?? state.showUpgrade;
  let text = resolveCardBaseDescription(card, useUpgrade);
  text = normalizeDescriptionSpacing(text);
  text = fillNumericTokens(text, card, useUpgrade);
  text = finalizeFilledTokenSpacing(text);
  text = escapeHtml(text).replace(/NL/g, "<br>");
  text = renderEnergyToken(text, card);
  text = highlightCardReferencesNoHover(text);
  text = stripResidualStarPrefixes(text);
  text = highlightReferencedCardNamesByMetadata(text, card);
  text = highlightSocketPlaceholders(text);
  text = highlightPrefixedKeywords(text);
  text = highlightBaseKeywords(text);
  text = renderNumericMarkers(text);
  text = renderBracketColorSyntax(text);
  text = attachAfterlifeHover(text);
  text = hideZhSpacesAfterFormatting(text);
  text = stripRemoveSpaceMarkers(text);
  return text;
}

function renderDescriptionForPreview(card, options = {}) {
  const useUpgrade = options.forceUpgrade ?? state.showUpgrade;
  let text = resolveCardBaseDescription(card, useUpgrade);
  text = normalizeDescriptionSpacing(text);
  text = fillNumericTokens(text, card, useUpgrade);
  text = finalizeFilledTokenSpacing(text);
  text = escapeHtml(text).replace(/NL/g, "<br>");
  text = renderEnergyToken(text, card);
  text = highlightCardReferencesNoHover(text);
  text = stripResidualStarPrefixes(text);
  text = highlightReferencedCardNamesByMetadata(text, card);
  text = highlightSocketPlaceholders(text);
  // Keep preview non-interactive but preserve visual keyword formatting.
  text = highlightPrefixedKeywords(text);
  text = highlightBaseKeywords(text);
  text = renderNumericMarkers(text);
  text = renderBracketColorSyntax(text);
  text = attachAfterlifeHover(text);
  text = hideZhSpacesAfterFormatting(text);
  text = stripRemoveSpaceMarkers(text);
  return text;
}

function buildCardInnerHtml(card, descriptionHtml, options = {}) {
  const useUpgrade = options.forceUpgrade ?? state.showUpgrade;
  const baseName = card.name[state.lang] || card.id;
  const shouldShowPlus = useUpgrade && hasCardUpgradeableVariant(card);
  const name = shouldShowPlus ? `${baseName}+` : baseName;
  const cardId = escapeHtml(card.id || "");
  const cost = formatCost(getDisplayCost(card, useUpgrade));
  const costClass = isCostUpgraded(card, useUpgrade) ? "card-cost-value upgraded" : "card-cost-value";
  const costIcon = card.energyIcon
    ? `<img class="card-cost-icon" src="${card.energyIcon}" alt="cost orb" loading="lazy">`
    : `<span class="card-cost-fallback-orb" aria-hidden="true"></span>`;
  const img = card.img
    ? `<img src="${card.img}" alt="${name}" loading="lazy">`
    : `<div class="placeholder"></div>`;
  const typeTagHtml = card.type
    ? `<span class="${getTypeTagClass(card.type)}"><span class="tag-label">${localizeType(card.type)}</span></span>`
    : "";
  const colorTagStyleVars = [];
  if (card.colorPillBg) colorTagStyleVars.push(`--pill-bg:${card.colorPillBg}`);
  if (card.colorPillFg) colorTagStyleVars.push(`--pill-fg:${card.colorPillFg}`);
  const colorTagStyle = colorTagStyleVars.length ? ` style="${colorTagStyleVars.join(";")}"` : "";
  const metaTagsHtml = card.type === "CURSE"
    ? typeTagHtml
    : `${typeTagHtml}
        ${card.rarity ? `<span class="${getRarityTagClass(card.rarity)}">${localizeRarity(card.rarity)}</span>` : ""}
        ${card.color ? `<span class="tag tag-color"${colorTagStyle}>${localizeColor(card)}</span>` : ""}`;
  const notInPoolBadge = isNotInPoolCard(card)
    ? `<span class="card-flag-not-in-pool">${getNotInPoolBadgeText(card)}</span>`
    : "";

  return `
    ${img}
    <div class="card-body">
      <div class="card-title">
        <div class="card-title-main">
          <h3>${name}</h3>
          <div class="card-id">${cardId}</div>
        </div>
        <div class="card-cost" title="${i18n("costLabel")}">
          ${costIcon}
          <span class="${costClass}">${cost}</span>
        </div>
      </div>
      <div class="card-meta">
        ${metaTagsHtml}
      </div>
      <div class="card-desc">${descriptionHtml}</div>
      ${notInPoolBadge}
    </div>
  `;
}

function buildCardElement(card, suppressAnimation = false, previewMode = false, options = {}) {
  const cardEl = document.createElement("article");
  const classes = ["card"];
  if (suppressAnimation) classes.push("no-enter");
  if (previewMode) classes.push("mini-cloned-card");
  if (card.deprecated) classes.push("card-deprecated");
  cardEl.className = classes.join(" ");
  const frameByRarity = {
    UNCOMMON: "rgba(108, 176, 232, 0.32)",
    RARE: "rgba(220, 178, 67, 0.36)",
  };
  const glowByRarity = {
    UNCOMMON: "rgba(108, 176, 232, 0.32)",
    RARE: "rgba(220, 178, 67, 0.34)",
  };
  const rarityFrame = frameByRarity[card.rarity];
  const rarityGlow = glowByRarity[card.rarity];
  if (rarityFrame) {
    cardEl.style.setProperty("--rarity-frame", rarityFrame);
  }
  if (rarityGlow) {
    cardEl.style.setProperty("--rarity-glow", rarityGlow);
  }
  cardEl.dataset.cardId = card.id;
  const desc = previewMode ? renderDescriptionForPreview(card, options) : renderDescription(card, options);
  cardEl.innerHTML = buildCardInnerHtml(card, desc, options);
  return cardEl;
}

function getDisplayCost(card, useUpgrade = state.showUpgrade) {
  if (!useUpgrade) return card.cost;
  if (typeof card.upgradeCost === "number") return card.upgradeCost;
  return card.cost;
}

function isCostUpgraded(card, useUpgrade = state.showUpgrade) {
  if (!useUpgrade) return false;
  if (typeof card.cost !== "number" || typeof card.upgradeCost !== "number") return false;
  return card.cost !== card.upgradeCost;
}

function buildOptions() {
  const anyLabel = i18n("any");
  const typeOptions = [{ value: "", label: anyLabel }];
  const costOptions = [
    { value: "", label: anyLabel },
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6+", label: "6+" },
    { value: "X", label: "X" },
    { value: "UNPLAYABLE", label: i18n("unplayable") },
  ];

  const rarityOptions = [{ value: "", label: anyLabel }];
  const colorOptions = [{ value: "", label: anyLabel }];
  const deprecatedOptions = [
    { value: "", label: anyLabel },
    { value: "ONLY", label: i18n("deprecatedOnly") },
    { value: "EXCLUDE", label: i18n("deprecatedExclude") },
  ];

  const types = new Set();
  const rarities = new Set();
  const colors = new Set();
  state.data.cards.forEach((card) => {
    if (card.type) types.add(card.type);
    if (card.rarity) rarities.add(card.rarity);
    if (card.color) colors.add(card.color);
  });

  [...types]
    .sort((a, b) => localizeType(a).localeCompare(localizeType(b), state.lang === "zh" ? "zh" : "en"))
    .forEach((type) => typeOptions.push({ value: type, label: localizeType(type) }));
  [...rarities]
    .sort((a, b) => localizeRarity(a).localeCompare(localizeRarity(b), state.lang === "zh" ? "zh" : "en"))
    .forEach((rarity) => rarityOptions.push({ value: rarity, label: localizeRarity(rarity) }));
  const colorLabelMap = new Map();
  state.data.cards.forEach((card) => {
    if (card.color && !colorLabelMap.has(card.color)) {
      colorLabelMap.set(card.color, localizeColor(card));
    }
  });

  [...colors]
    .sort((a, b) => (colorLabelMap.get(a) || a).localeCompare(colorLabelMap.get(b) || b, state.lang === "zh" ? "zh" : "en"))
    .forEach((color) => colorOptions.push({ value: color, label: colorLabelMap.get(color) || color }));

  buildSelect(elements.typeFilter, typeOptions);
  buildSelect(elements.costFilter, costOptions);
  buildSelect(elements.rarityFilter, rarityOptions);
  buildSelect(elements.colorFilter, colorOptions);
  buildSelect(elements.deprecatedFilter, deprecatedOptions);
  buildSelect(elements.sortBy, [
    { value: "", label: i18n("sortDefault") },
    { value: "type", label: i18n("sortFieldType") },
    { value: "cost", label: i18n("sortFieldCost") },
    { value: "rarity", label: i18n("sortFieldRarity") },
    { value: "color", label: i18n("sortFieldColor") },
  ]);
  buildSelect(elements.sortDir, [
    { value: "asc", label: i18n("sortDirAsc") },
    { value: "desc", label: i18n("sortDirDesc") },
  ]);
  buildSelect(elements.pageSize, [
    { value: "12", label: "12" },
    { value: "24", label: "24" },
    { value: "48", label: "48" },
    { value: "96", label: "96" },
  ]);

  elements.typeFilter.value = state.filters.type;
  elements.costFilter.value = state.filters.cost;
  elements.rarityFilter.value = state.filters.rarity;
  elements.colorFilter.value = state.filters.color;
  elements.deprecatedFilter.value = state.filters.deprecated;
  elements.sortBy.value = state.sort.by;
  elements.sortDir.value = state.sort.dir;
  elements.pageSize.value = String(state.pageSize);

  // Normalize invalid URL/restored values against actual option lists.
  state.filters.type = elements.typeFilter.value;
  state.filters.cost = elements.costFilter.value;
  state.filters.rarity = elements.rarityFilter.value;
  state.filters.color = elements.colorFilter.value;
  state.filters.deprecated = elements.deprecatedFilter.value;
  state.sort.by = elements.sortBy.value;
  state.sort.dir = elements.sortDir.value || "asc";
  state.pageSize = Number(elements.pageSize.value) || 24;
}

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  const lang = params.get("lang");
  const upgraded = params.get("upgraded");
  const q = params.get("q");
  const type = params.get("type");
  const cost = params.get("cost");
  const rarity = params.get("rarity");
  const color = params.get("color");
  const deprecated = params.get("deprecated");
  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const size = params.get("size");
  const page = params.get("page");

  if (lang === "zh" || lang === "en") {
    state.lang = lang;
  }
  if (upgraded !== null) {
    state.showUpgrade = upgraded === "1" || upgraded === "true";
  }

  state.search = (q || "").trim();
  state.filters.type = (type || "").trim();
  state.filters.cost = (cost || "").trim();
  state.filters.rarity = (rarity || "").trim();
  state.filters.color = (color || "").trim();
  state.filters.deprecated = (deprecated || "").trim();
  state.sort.by = (sortBy || "").trim();
  state.sort.dir = sortDir === "desc" ? "desc" : "asc";

  const parsedSize = Number(size);
  state.pageSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : state.pageSize;

  const parsedPage = Number(page);
  state.page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function syncControlsFromState() {
  elements.searchInput.value = state.search;
  elements.upgradeToggle.classList.toggle("active", state.showUpgrade);
}

function writeStateToUrl() {
  const params = new URLSearchParams();

  if (state.lang !== "en") params.set("lang", state.lang);
  if (state.showUpgrade) params.set("upgraded", "1");
  if (state.search) params.set("q", state.search);
  if (state.filters.type) params.set("type", state.filters.type);
  if (state.filters.cost) params.set("cost", state.filters.cost);
  if (state.filters.rarity) params.set("rarity", state.filters.rarity);
  if (state.filters.color) params.set("color", state.filters.color);
  if (state.filters.deprecated) params.set("deprecated", state.filters.deprecated);
  if (state.sort.by) params.set("sortBy", state.sort.by);
  if (state.sort.dir === "desc") params.set("sortDir", "desc");
  if (state.pageSize !== 24) params.set("size", String(state.pageSize));
  if (state.page > 1) params.set("page", String(state.page));

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function updateSummary(shown, total) {
  elements.summary.textContent = i18n("summary")(shown, total);
}

function updatePagination(totalPages) {
  elements.pageInfo.textContent = `${state.page} / ${totalPages || 1}`;
  elements.prevPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= totalPages;
}

function renderCards() {
  if (!state.data) return;
  hideKeywordTooltip();
  hideCardPreviewTooltip();
  const suppressAnimation = state.suppressNextCardAnimation;
  state.suppressNextCardAnimation = false;

  const filtered = state.data.cards
    .filter((card) => matchesSearch(card))
    .filter((card) => matchesFilter(card.type, state.filters.type))
    .filter((card) => matchesFilter(card.rarity, state.filters.rarity))
    .filter((card) => matchesFilter(card.color, state.filters.color))
    .filter((card) => matchesCost(card.cost))
    .filter((card) => matchesDeprecated(card))
    .sort(compareCardsBySort);

  const total = filtered.length;
  const totalPages = Math.ceil(total / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * state.pageSize;
  const slice = filtered.slice(start, start + state.pageSize);

  elements.grid.innerHTML = "";

  if (!slice.length) {
    elements.grid.innerHTML = `<div class="card">\n      <div class="card-body">${i18n("noResults")}</div>\n    </div>`;
  } else {
    slice.forEach((card) => {
      const cardEl = buildCardElement(card, suppressAnimation, false);
      elements.grid.appendChild(cardEl);
    });
  }

  updateSummary(slice.length, total);
  updatePagination(totalPages);
  writeStateToUrl();
}

function bindEvents() {
  elements.langToggle.addEventListener("click", () => {
    state.lang = state.lang === "en" ? "zh" : "en";
    applyI18n();
    buildOptions();
    renderCards();
  });

  elements.upgradeToggle.addEventListener("click", () => {
    state.showUpgrade = !state.showUpgrade;
    state.suppressNextCardAnimation = true;
    elements.upgradeToggle.classList.toggle("active", state.showUpgrade);
    applyI18n();
    renderCards();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.page = 1;
    renderCards();
  });

  elements.typeFilter.addEventListener("change", (event) => {
    state.filters.type = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.costFilter.addEventListener("change", (event) => {
    state.filters.cost = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.rarityFilter.addEventListener("change", (event) => {
    state.filters.rarity = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.colorFilter.addEventListener("change", (event) => {
    state.filters.color = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.deprecatedFilter.addEventListener("change", (event) => {
    state.filters.deprecated = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.sortBy.addEventListener("change", (event) => {
    state.sort.by = event.target.value;
    state.page = 1;
    renderCards();
  });

  elements.sortDir.addEventListener("change", (event) => {
    state.sort.dir = event.target.value === "desc" ? "desc" : "asc";
    state.page = 1;
    renderCards();
  });

  elements.pageSize.addEventListener("change", (event) => {
    state.pageSize = Number(event.target.value);
    state.page = 1;
    renderCards();
  });

  elements.prevPage.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderCards();
  });

  elements.nextPage.addEventListener("click", () => {
    state.page += 1;
    renderCards();
  });

  bindKeywordTooltipEvents();
  bindCardReferencePreviewEvents();

  window.addEventListener("popstate", () => {
    readStateFromUrl();
    applyI18n();
    buildOptions();
    syncControlsFromState();
    renderCards();
  });

}

async function init() {
  const response = await fetch("data/cards.json");
  if (!response.ok) {
    elements.summary.textContent = "Missing data/cards.json. Run the pipeline first.";
    return;
  }
  state.data = await response.json();
  readStateFromUrl();
  buildKeywordZhIndex();
  buildBaseKeywordIndex();
  buildCardNameIndex();
  applyI18n();
  buildOptions();
  syncControlsFromState();
  renderCards();
  bindEvents();
}

init();
