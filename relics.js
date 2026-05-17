const state = {
  lang: "en",
  translatorMode: false,
  relicData: null,
  cardsData: null,
  relics: [],
  filtered: [],
  page: 1,
  pageSize: 20,
  search: "",
  keywordByLang: { en: new Map(), zh: new Map() },
  baseKeywordTerms: { en: [], zh: [] },
  cardById: new Map(),
  cardByNameLang: { en: new Map(), zh: new Map() },
};

const uiText = {
  en: {
    eyebrow: "Downfall Mod Relic Showcase",
    title: "Downfall Relic Conpendium",
    subtitle: "Browse relics by character and rarity with keyword tooltip and card reference preview.",
    rarityLabel: "Rarity",
    colorLabel: "Color",
    deprecatedLabel: "Deprecated",
    sortByLabel: "Sort by",
    sortDirLabel: "Order",
    pageSizeLabel: "Per page",
    searchLabel: "Search",
    searchBtn: "Search",
    any: "Any",
    deprecatedOnly: "Only",
    deprecatedExclude: "Exclude",
    sortName: "Name",
    sortId: "ID",
    sortRarity: "Rarity",
    sortColor: "Color",
    asc: "Ascending",
    desc: "Descending",
    pageInfo: "Page {page} / {total}",
    summary: "{shown} relics shown ({total} total)",
    searchPlaceholder: "Relic name / id / description",
    noDescription: "No description",
  },
  zh: {
    eyebrow: "Downfall Mod 遗物图鉴",
    title: "Downfall 遗物图鉴",
    subtitle: "按角色和稀有度浏览遗物，并支持关键词悬浮与引用卡牌预览。",
    rarityLabel: "稀有度",
    colorLabel: "颜色",
    deprecatedLabel: "弃用",
    sortByLabel: "排序",
    sortDirLabel: "顺序",
    pageSizeLabel: "每页",
    searchLabel: "搜索",
    searchBtn: "搜索",
    any: "全部",
    deprecatedOnly: "仅弃用",
    deprecatedExclude: "排除弃用",
    sortName: "名称",
    sortId: "ID",
    sortRarity: "稀有度",
    sortColor: "颜色",
    asc: "升序",
    desc: "降序",
    pageInfo: "第 {page} / {total} 页",
    summary: "显示 {shown} 个遗物（总计 {total}）",
    searchPlaceholder: "遗物名 / 代码名 / 描述",
    noDescription: "无描述",
  },
};

const rarityLabelMap = {
  en: {
    COMMON: "Common",
    UNCOMMON: "Uncommon",
    RARE: "Rare",
    SHOP: "Shop",
    BOSS: "Boss",
    STARTER: "Starter",
    SPECIAL: "Special",
  },
  zh: {
    COMMON: "普通",
    UNCOMMON: "罕见",
    RARE: "稀有",
    SHOP: "商店",
    BOSS: "Boss",
    STARTER: "初始",
    SPECIAL: "特殊",
  },
};

const elements = {
  grid: document.getElementById("relicGrid"),
  summary: document.getElementById("summary"),
  rarityFilter: document.getElementById("rarityFilter"),
  colorFilter: document.getElementById("colorFilter"),
  deprecatedFilter: document.getElementById("deprecatedFilter"),
  sortBy: document.getElementById("sortBy"),
  sortDir: document.getElementById("sortDir"),
  pageSize: document.getElementById("pageSize"),
  searchInput: document.getElementById("searchInput"),
  clearSearchInlineBtn: document.getElementById("clearSearchInlineBtn"),
  searchBtn: document.getElementById("searchBtn"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  pageInfo: document.getElementById("pageInfo"),
  langToggle: document.getElementById("langToggle"),
};

function t(key) {
  return (uiText[state.lang] || uiText.en)[key] || key;
}

function applyI18nText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });
  elements.searchInput.placeholder = t("searchPlaceholder");
  elements.langToggle.textContent = state.translatorMode ? "translator mode" : state.lang.toUpperCase();
  elements.langToggle.disabled = Boolean(state.translatorMode);
  elements.langToggle.classList.toggle("translator-mode-pill", Boolean(state.translatorMode));
}

function parseUrlState() {
  const params = new URLSearchParams(window.location.search || "");
  const lang = params.get("lang");
  const translatorMode = params.get("translator_mode");
  if (lang === "en" || lang === "zh") state.lang = lang;
  if (translatorMode !== null) {
    const normalized = String(translatorMode).toLowerCase();
    state.translatorMode = normalized === "1" || normalized === "true" || normalized === "yes";
  }
}

function syncUrlState() {
  const params = new URLSearchParams();
  if (state.lang !== "en") params.set("lang", state.lang);
  if (state.translatorMode) params.set("translator_mode", "1");

  if (elements.searchInput.value.trim()) params.set("q", elements.searchInput.value.trim());
  if (elements.rarityFilter.value) params.set("rarity", elements.rarityFilter.value);
  if (elements.colorFilter.value) params.set("color", elements.colorFilter.value);
  if (elements.deprecatedFilter.value) params.set("deprecated", elements.deprecatedFilter.value);

  const qs = params.toString();
  const next = qs ? `?${qs}` : "";
  if (next !== window.location.search) {
    history.replaceState(null, "", `${window.location.pathname}${next}`);
  }
}

function updateTranslatorEntryLink() {
  const link = document.getElementById("translatorModeEntry");
  if (!link) return;
  const params = new URLSearchParams(window.location.search || "");
  if (state.translatorMode) {
    params.delete("translator_mode");
    link.textContent = "normal mode";
  } else {
    params.set("translator_mode", "1");
    link.textContent = "translator mode";
  }
  if (state.lang !== "en") params.set("lang", state.lang);
  link.href = `${window.location.pathname}?${params.toString()}`;
}

function escapeHtml(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeDescText(text) {
  const normalized = (text || "")
    .replace(/\[REMOVE_SPACE\]/g, "")
    .replace(/#[ybrgp]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (state.lang === "zh") {
    return normalized
      .replace(/,/g, "，")
      .replace(/｡/g, "。");
  }

  return normalized;
}

function finalizeZhHtmlSpacing(html) {
  if (state.lang !== "zh") return html;
  return (html || "").replace(/(^|>)([^<>]+)(?=<|$)/g, (_m, lead, content) => {
    return `${lead}${content.replace(/\s+/g, "")}`;
  });
}

function normalizeSearchText(text) {
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function compareMaybeString(a, b) {
  return (a || "").localeCompare((b || ""), state.lang === "zh" ? "zh" : "en");
}

function localizeRarity(rarity) {
  return (rarityLabelMap[state.lang] || {})[rarity] || rarity || "";
}

function localizeColor(relic) {
  if (relic && relic.colorName && relic.colorName[state.lang]) return relic.colorName[state.lang];
  return relic.color || "";
}

function getRarityTagClass(rarity) {
  if (!rarity) return "tag";
  return `tag tag-rarity-${String(rarity).toLowerCase()}`;
}

function buildCardNameIndex(cards) {
  state.cardById = new Map();
  state.cardByNameLang = { en: new Map(), zh: new Map() };

  cards.forEach((card) => {
    state.cardById.set(card.id, card);
    ["en", "zh"].forEach((lang) => {
      const name = ((card.name || {})[lang] || "").trim();
      if (!name) return;
      if (!state.cardByNameLang[lang].has(name)) {
        state.cardByNameLang[lang].set(name, card.id);
      }
    });
  });
}

function buildKeywordIndex() {
  const keywordData = (state.relicData && state.relicData.keywords) || {};
  ["en", "zh"].forEach((lang) => {
    const entries = keywordData[lang] || [];
    const map = new Map();
    entries.forEach((entry) => {
      if (!entry || !entry.name) return;
      map.set(entry.name, entry);
      (entry.aliases || []).forEach((alias) => {
        if (alias && !map.has(alias)) map.set(alias, entry);
      });
    });
    state.keywordByLang[lang] = map;
  });

  const base = (state.relicData && state.relicData.baseKeywords) || [];
  const terms = { en: new Set(), zh: new Set() };
  base.forEach((entry) => {
    if (entry && entry.en && entry.en.aliases) entry.en.aliases.forEach((k) => k && terms.en.add(k));
    if (entry && entry.zh && entry.zh.aliases) entry.zh.aliases.forEach((k) => k && terms.zh.add(k));
  });
  state.baseKeywordTerms.en = [...terms.en].sort((a, b) => b.length - a.length);
  state.baseKeywordTerms.zh = [...terms.zh].sort((a, b) => b.length - a.length);
}

function renderKeywordSpan(label, alias = null) {
  const safeLabel = escapeHtml(label || "");
  const safeAlias = escapeHtml(alias || label || "");
  return `<span class="kw" data-kw-alias="${safeAlias}">${safeLabel}</span>`;
}

function findKeywordEntry(label, lang = state.lang) {
  if (!label) return null;
  const map = state.keywordByLang[lang] || new Map();
  if (map.has(label)) return map.get(label);
  if (lang === "en") {
    const lower = label.toLowerCase();
    for (const [alias, entry] of map.entries()) {
      if ((alias || "").toLowerCase() === lower) return entry;
    }
  }
  return null;
}

function findPrefixedKeyword(prefix, noun, lang = state.lang) {
  if (!noun) return null;
  const candidates = [
    noun,
    `${prefix}:${noun}`,
    `${String(prefix || "").toLowerCase()}:${noun}`,
  ];
  for (const alias of candidates) {
    const entry = findKeywordEntry(alias, lang);
    if (entry) {
      return { entry, alias, matchedLabel: noun, rest: "" };
    }
  }

  // In zh mode description spaces are compacted, e.g. "bronze:队列为空".
  // Match the longest known alias prefix and keep the remainder as plain text.
  const map = state.keywordByLang[lang] || new Map();
  let best = null;
  for (const [alias, entry] of map.entries()) {
    if (!alias || !entry) continue;
    const aliasText = String(alias);
    let local = aliasText;
    const colon = aliasText.indexOf(":");
    if (colon >= 0) {
      const ns = aliasText.slice(0, colon).toLowerCase();
      if (ns !== String(prefix || "").toLowerCase()) continue;
      local = aliasText.slice(colon + 1);
    }
    if (!local) continue;
    if (!noun.startsWith(local)) continue;
    if (!best || local.length > best.matchedLabel.length) {
      best = {
        entry,
        alias: aliasText,
        matchedLabel: local,
        rest: noun.slice(local.length),
      };
    }
  }
  if (best) return best;
  return null;
}

function highlightPrefixedKeywords(text) {
  if (!text) return "";
  const prefixedPattern = /([A-Za-z_][\w]*):([^\s<>{}\[\]，。｡,.!！？:：;；]+)/g;
  return text.replace(prefixedPattern, (_full, prefix, noun) => {
    const matched = findPrefixedKeyword(prefix, noun);
    if (!matched) return _full;
    return `${renderKeywordSpan(matched.matchedLabel, matched.alias)}${escapeHtml(matched.rest || "")}`;
  });
}

function highlightBaseKeywords(text) {
  if (!text) return "";
  let rendered = text;
  const terms = state.baseKeywordTerms[state.lang] || [];
  terms.forEach((term) => {
    if (!term) return;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reg = state.lang === "zh"
      ? new RegExp(`(^|\\s)(${escaped})(?=\\s|$)`, "g")
      : new RegExp(`\\b(${escaped})\\b`, "gi");
    if (state.lang === "zh") {
      rendered = rendered.replace(reg, (_m, lead, p1) => `${lead}${renderKeywordSpan(p1)}`);
    } else {
      rendered = rendered.replace(reg, (_m, p1) => renderKeywordSpan(p1));
    }
  });
  return rendered;
}

function highlightCardRefs(text) {
  if (!text) return "";
  const map = state.cardByNameLang[state.lang] || new Map();
  if (!map.size) return text;
  const names = [...map.keys()].sort((a, b) => b.length - a.length);
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;

  if (state.lang === "zh") {
    const reg = new RegExp(`(^|\\s)(${escaped.join("|")})(?=\\s|$)`, "g");
    return text.replace(reg, (_full, lead, name) => {
      const id = map.get(name) || "";
      if (!id) return _full;
      return `${lead}<span class="card-ref" data-card-id="${escapeHtml(id)}">${escapeHtml(name)}</span>`;
    });
  }

  const reg = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  return text.replace(reg, (full, name) => {
    const id = map.get(name) || map.get(full) || "";
    if (!id) return full;
    return `<span class="card-ref" data-card-id="${escapeHtml(id)}">${escapeHtml(full)}</span>`;
  });
}

function renderRelicDescription(relic) {
  const raw = normalizeDescText(((relic.description || {})[state.lang] || ""));
  if (!raw) return `<span class="muted">${escapeHtml(t("noDescription"))}</span>`;

  let text = escapeHtml(raw).replace(/NL/g, "<br>");
  text = highlightPrefixedKeywords(text);
  text = highlightBaseKeywords(text);
  text = highlightCardRefs(text);
  return finalizeZhHtmlSpacing(text);
}

function fillCardTokens(text, card) {
  if (!text) return "";
  const tokenValues = (card && card.tokenValues) || {};
  return text.replace(/!([A-Za-z0-9_:]+)!/g, (_full, token) => {
    const val = tokenValues[token];
    return typeof val === "number" ? String(val) : _full;
  });
}

function renderCardPreviewDescription(card, lang) {
  const base = (((card || {}).description || {})[lang] || "").trim();
  const prevLang = state.lang;
  state.lang = lang;
  const raw = normalizeDescText(fillCardTokens(base, card));
  let text = escapeHtml(raw).replace(/NL/g, "<br>");
  text = highlightPrefixedKeywords(text);
  text = highlightBaseKeywords(text);
  text = finalizeZhHtmlSpacing(text);
  state.lang = prevLang;
  return text;
}

function buildRelicElement(relic, langOverride = null) {
  const lang = langOverride || state.lang;
  const prevLang = state.lang;
  state.lang = lang;
  try {
    const el = document.createElement("article");
    el.className = `card ${relic.deprecated ? "card-deprecated" : ""}`.trim();
    el.dataset.relicId = relic.id;
    el.dataset.renderLang = lang;

    const frameByRarity = {
      UNCOMMON: "rgba(108, 176, 232, 0.32)",
      RARE: "rgba(220, 178, 67, 0.36)",
    };
    const glowByRarity = {
      UNCOMMON: "rgba(108, 176, 232, 0.32)",
      RARE: "rgba(220, 178, 67, 0.34)",
    };
    const rarityFrame = frameByRarity[relic.rarity];
    const rarityGlow = glowByRarity[relic.rarity];
    if (rarityFrame) {
      el.style.setProperty("--rarity-frame", rarityFrame);
    }
    if (rarityGlow) {
      el.style.setProperty("--rarity-glow", rarityGlow);
    }

    const name = ((relic.name || {})[lang] || relic.id || "").trim();
    const desc = renderRelicDescription(relic);
    const img = relic.img
      ? `<img src="${relic.img}" alt="${escapeHtml(name)}" loading="lazy">`
      : `<div class="placeholder"></div>`;

    const colorTagStyleVars = [];
    if (relic.colorPillBg) colorTagStyleVars.push(`--pill-bg:${relic.colorPillBg}`);
    if (relic.colorPillFg) colorTagStyleVars.push(`--pill-fg:${relic.colorPillFg}`);
    const colorTagStyle = colorTagStyleVars.length ? ` style="${colorTagStyleVars.join(";")}"` : "";

    const meta = [
      localizeColor(relic) ? `<span class="tag tag-color"${colorTagStyle}>${escapeHtml(localizeColor(relic))}</span>` : "",
      relic.rarity ? `<span class="${getRarityTagClass(relic.rarity)}">${escapeHtml(localizeRarity(relic.rarity))}</span>` : "",
    ].filter(Boolean).join(" ");

    el.innerHTML = `
      ${img}
      <div class="card-body">
        <div class="card-title">
          <div class="card-title-main">
            <h3>${escapeHtml(name)}</h3>
            <div class="card-id">${escapeHtml(relic.id || "")}</div>
          </div>
        </div>
        <div class="card-meta">${meta}</div>
        <div class="card-desc">${desc}</div>
      </div>
    `;
    return el;
  } finally {
    state.lang = prevLang;
  }
}

function buildCardMiniElement(card, langOverride = null) {
  const lang = langOverride || state.lang;
  const name = ((card.name || {})[lang] || card.id || "").trim();
  const desc = renderCardPreviewDescription(card, lang);
  const type = escapeHtml(card.type || "");
  const rarity = escapeHtml(localizeRarity(card.rarity));
  const color = escapeHtml(localizeColor(card));

  const el = document.createElement("article");
  el.className = "card mini-cloned-card";
  el.innerHTML = `
    ${card.img ? `<img src="${card.img}" alt="${escapeHtml(name)}" loading="lazy">` : `<div class="placeholder"></div>`}
    <div class="card-body">
      <div class="card-title">
        <div class="card-title-main">
          <h3>${escapeHtml(name)}</h3>
          <div class="card-id">${escapeHtml(card.id || "")}</div>
        </div>
      </div>
      <div class="card-meta">
        ${type ? `<span class="tag">${type}</span>` : ""}
        ${rarity ? `<span class="tag">${rarity}</span>` : ""}
        ${color ? `<span class="tag">${color}</span>` : ""}
      </div>
      <div class="card-desc">${desc}</div>
    </div>
  `;
  return el;
}

function getKeywordTooltip() {
  let tip = document.getElementById("kwTooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "kwTooltip";
    tip.className = "kw-tooltip";
    document.body.appendChild(tip);
  }
  return tip;
}

function hideKeywordTooltip() {
  const tip = document.getElementById("kwTooltip");
  if (!tip) return;
  tip.classList.remove("show");
  tip.innerHTML = "";
}

function showKeywordTooltip(entry, anchorRect, langOverride = null) {
  const lang = langOverride || state.lang;
  const tip = getKeywordTooltip();
  const prevLang = state.lang;
  state.lang = lang;
  const name = escapeHtml(normalizeDescText(entry.name || ""));
  const descRaw = normalizeDescText(entry.description || "");
  let desc = escapeHtml(descRaw).replace(/NL/g, "<br>");
  desc = highlightCardRefs(desc);
  desc = finalizeZhHtmlSpacing(desc);
  state.lang = prevLang;

  tip.innerHTML = `<div class="kw-tip-name">${name}</div><div class="kw-tip-desc">${desc}</div>`;
  tip.classList.add("show");

  const margin = 10;
  const tipRect = tip.getBoundingClientRect();
  let left = anchorRect.left + window.scrollX;
  let top = anchorRect.bottom + window.scrollY + 8;
  const maxLeft = window.scrollX + window.innerWidth - tipRect.width - margin;
  if (left > maxLeft) left = maxLeft;
  const maxTop = window.scrollY + window.innerHeight - tipRect.height - margin;
  if (top > maxTop) top = anchorRect.top + window.scrollY - tipRect.height - 8;

  tip.style.left = `${Math.max(window.scrollX + margin, left)}px`;
  tip.style.top = `${Math.max(window.scrollY + margin, top)}px`;
}

function getCardPreviewTooltip() {
  let tip = document.getElementById("cardPreviewTooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "cardPreviewTooltip";
    tip.className = "card-mini-preview";
    document.body.appendChild(tip);
  }
  return tip;
}

function hideCardPreviewTooltip() {
  const tip = document.getElementById("cardPreviewTooltip");
  if (!tip) return;
  tip.classList.remove("show", "preview-left", "preview-right");
  tip.innerHTML = "";
}

function showCardPreviewTooltip(card, anchorRect, langOverride = null) {
  const tip = getCardPreviewTooltip();
  tip.innerHTML = "";
  tip.classList.remove("refs-panel", "preview-left", "preview-right");
  tip.appendChild(buildCardMiniElement(card, langOverride));
  tip.classList.add("show");

  const margin = 10;
  const tipRect = tip.getBoundingClientRect();
  let left = anchorRect.right + window.scrollX + 10;
  let top = anchorRect.top + window.scrollY;
  if (left + tipRect.width > window.scrollX + window.innerWidth - margin) {
    left = anchorRect.left + window.scrollX - tipRect.width - 10;
    tip.classList.add("preview-left");
  } else {
    tip.classList.add("preview-right");
  }
  const maxTop = window.scrollY + window.innerHeight - tipRect.height - margin;
  if (top > maxTop) top = maxTop;

  tip.style.left = `${Math.max(window.scrollX + margin, left)}px`;
  tip.style.top = `${Math.max(window.scrollY + margin, top)}px`;
}

function bindTooltipEvents() {
  elements.grid.addEventListener("mouseover", (event) => {
    const kw = event.target.closest(".kw");
    if (kw && elements.grid.contains(kw)) {
      const cardNode = kw.closest("article.card[data-relic-id]");
      const renderLang = cardNode && cardNode.dataset && cardNode.dataset.renderLang === "zh" ? "zh" : "en";
      const label = (kw.dataset.kwAlias || kw.textContent || "").trim();
      const entry = findKeywordEntry(label, renderLang);
      if (!entry) {
        hideKeywordTooltip();
      } else {
        showKeywordTooltip(entry, kw.getBoundingClientRect(), renderLang);
      }
      return;
    }

    const ref = event.target.closest(".card-ref[data-card-id]");
    if (!ref || !elements.grid.contains(ref)) return;
    const cardId = ref.dataset.cardId || "";
    const card = state.cardById.get(cardId);
    if (!card) {
      hideCardPreviewTooltip();
      return;
    }
    const cardNode = ref.closest("article.card[data-relic-id]");
    const renderLang = cardNode && cardNode.dataset && cardNode.dataset.renderLang === "zh" ? "zh" : "en";
    showCardPreviewTooltip(card, ref.getBoundingClientRect(), renderLang);
  });

  elements.grid.addEventListener("mouseout", (event) => {
    const kw = event.target.closest(".kw");
    if (kw && elements.grid.contains(kw)) {
      const to = event.relatedTarget;
      if (to && kw.contains(to)) return;
      hideKeywordTooltip();
      return;
    }

    const ref = event.target.closest(".card-ref[data-card-id]");
    if (!ref || !elements.grid.contains(ref)) return;
    const to = event.relatedTarget;
    if (to && ref.contains(to)) return;
    hideCardPreviewTooltip();
  });

  window.addEventListener("scroll", () => {
    hideKeywordTooltip();
    hideCardPreviewTooltip();
  }, { passive: true });
}

function buildOptions() {
  const anyLabel = t("any");

  elements.rarityFilter.innerHTML = "";
  elements.colorFilter.innerHTML = "";
  elements.deprecatedFilter.innerHTML = "";
  elements.sortBy.innerHTML = "";
  elements.sortDir.innerHTML = "";
  elements.pageSize.innerHTML = "";

  const raritySet = new Set();
  const colorSet = new Set();

  state.relics.forEach((r) => {
    if (r.rarity) raritySet.add(r.rarity);
    if (r.color) colorSet.add(r.color);
  });

  const option = (value, label) => {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    return o;
  };

  elements.rarityFilter.appendChild(option("", anyLabel));
  [...raritySet].sort((a, b) => compareMaybeString(localizeRarity(a), localizeRarity(b))).forEach((v) => {
    elements.rarityFilter.appendChild(option(v, localizeRarity(v)));
  });

  elements.colorFilter.appendChild(option("", anyLabel));
  [...colorSet].sort((a, b) => compareMaybeString(a, b)).forEach((v) => {
    const sample = state.relics.find((r) => r.color === v);
    elements.colorFilter.appendChild(option(v, localizeColor(sample || { color: v })));
  });

  elements.deprecatedFilter.appendChild(option("", anyLabel));
  elements.deprecatedFilter.appendChild(option("ONLY", t("deprecatedOnly")));
  elements.deprecatedFilter.appendChild(option("EXCLUDE", t("deprecatedExclude")));

  [
    ["NAME", t("sortName")],
    ["ID", t("sortId")],
    ["RARITY", t("sortRarity")],
    ["COLOR", t("sortColor")],
  ].forEach(([value, label]) => elements.sortBy.appendChild(option(value, label)));

  [["ASC", t("asc")], ["DESC", t("desc")]].forEach(([value, label]) => elements.sortDir.appendChild(option(value, label)));
  [20, 30, 50, 100].forEach((size) => elements.pageSize.appendChild(option(String(size), String(size))));
}

function filterAndSort() {
  const q = normalizeSearchText(state.search);
  const rarity = elements.rarityFilter.value;
  const color = elements.colorFilter.value;
  const deprecatedMode = elements.deprecatedFilter.value;

  let rows = state.relics.filter((r) => {
    if (rarity && r.rarity !== rarity) return false;
    if (color && r.color !== color) return false;
    if (deprecatedMode === "ONLY" && !r.deprecated) return false;
    if (deprecatedMode === "EXCLUDE" && r.deprecated) return false;

    if (!q) return true;
    if (state.translatorMode) {
      const en = normalizeSearchText(`${(r.name.en || "")} ${(r.description.en || "")} ${r.id || ""} ${(r.codeName || "")}`);
      const zh = normalizeSearchText(`${(r.name.zh || "")} ${(r.description.zh || "")} ${r.id || ""} ${(r.codeName || "")}`);
      return en.includes(q) || zh.includes(q);
    }

    const text = normalizeSearchText(`${(r.name[state.lang] || "")} ${(r.description[state.lang] || "")} ${r.id || ""} ${(r.codeName || "")}`);
    return text.includes(q);
  });

  const sortBy = elements.sortBy.value;
  const desc = elements.sortDir.value === "DESC";

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "NAME") cmp = compareMaybeString((a.name || {})[state.lang], (b.name || {})[state.lang]);
    else if (sortBy === "ID") cmp = compareMaybeString(a.id, b.id);
    else if (sortBy === "RARITY") cmp = compareMaybeString(localizeRarity(a.rarity), localizeRarity(b.rarity));
    else if (sortBy === "COLOR") cmp = compareMaybeString(localizeColor(a), localizeColor(b));
    if (cmp === 0) cmp = compareMaybeString(a.id, b.id);
    return desc ? -cmp : cmp;
  });

  state.filtered = rows;
}

function render() {
  filterAndSort();

  const total = state.filtered.length;
  state.pageSize = Number(elements.pageSize.value || state.pageSize || 20);
  const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), pageCount);

  const start = (state.page - 1) * state.pageSize;
  const slice = state.filtered.slice(start, start + state.pageSize);

  elements.grid.innerHTML = "";
  if (!state.translatorMode) {
    slice.forEach((relic) => elements.grid.appendChild(buildRelicElement(relic)));
  } else {
    slice.forEach((relic) => {
      elements.grid.appendChild(buildRelicElement(relic, "en"));
      elements.grid.appendChild(buildRelicElement(relic, "zh"));
    });
  }

  elements.summary.textContent = t("summary")
    .replace("{shown}", String(slice.length))
    .replace("{total}", String(total));

  elements.pageInfo.textContent = t("pageInfo")
    .replace("{page}", String(state.page))
    .replace("{total}", String(pageCount));

  elements.prevPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= pageCount;

  const showClear = (elements.searchInput.value || "").trim().length > 0;
  elements.clearSearchInlineBtn.classList.toggle("visible", showClear);

  syncUrlState();
}

function bindControls() {
  const rerender = () => {
    state.page = 1;
    state.search = elements.searchInput.value || "";
    render();
  };

  [elements.rarityFilter, elements.colorFilter, elements.deprecatedFilter, elements.sortBy, elements.sortDir, elements.pageSize].forEach((el) => {
    el.addEventListener("change", rerender);
  });

  elements.searchBtn.addEventListener("click", rerender);
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") rerender();
  });
  elements.searchInput.addEventListener("input", () => {
    const showClear = (elements.searchInput.value || "").trim().length > 0;
    elements.clearSearchInlineBtn.classList.toggle("visible", showClear);
  });
  elements.clearSearchInlineBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    state.search = "";
    state.page = 1;
    render();
  });

  elements.prevPage.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
    }
  });

  elements.nextPage.addEventListener("click", () => {
    const pageCount = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page < pageCount) {
      state.page += 1;
      render();
    }
  });

  elements.langToggle.addEventListener("click", () => {
    if (state.translatorMode) return;
    state.lang = state.lang === "en" ? "zh" : "en";
    applyI18nText();
    buildOptions();
    render();
    updateTranslatorEntryLink();
  });
}

async function init() {
  parseUrlState();
  applyI18nText();

  const [relicRes, cardRes] = await Promise.all([
    fetch("data/relics.json"),
    fetch("data/cards.json"),
  ]);

  if (!relicRes.ok) throw new Error(`Failed to load relic data: ${relicRes.status}`);
  if (!cardRes.ok) throw new Error(`Failed to load card data: ${cardRes.status}`);

  state.relicData = await relicRes.json();
  state.cardsData = await cardRes.json();
  state.relics = (state.relicData && state.relicData.relics) || [];

  buildCardNameIndex((state.cardsData && state.cardsData.cards) || []);
  buildKeywordIndex();

  buildOptions();
  bindControls();
  bindTooltipEvents();
  updateTranslatorEntryLink();

  elements.sortBy.value = "NAME";
  elements.sortDir.value = "ASC";
  elements.pageSize.value = String(state.pageSize);

  state.search = elements.searchInput.value || "";
  render();
}

init().catch((err) => {
  console.error(err);
  elements.summary.textContent = String(err && err.message ? err.message : err);
});
