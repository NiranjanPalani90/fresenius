var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/fresenius/import.js
  var import_exports = {};
  __export(import_exports, {
    default: () => import_default
  });

  // tools/importer/fresenius/content.js
  var ROUTES = {
    home: "/",
    investors: "/investors",
    results: "/investors/results-q3-2026",
    dashboard: "/investors/dashboard",
    "dashboard/askfre": "/investors/dashboard#askfre",
    about: "/about",
    businesses: "/our-businesses",
    impact: "/impact",
    newsroom: "/newsroom",
    careers: "/careers",
    fhs: "/newsroom/fresenius-reorganizes-hospital-services",
    explain: "/explain/helios",
    "explain/helios": "/explain/helios",
    "explain/kabi": "/explain/kabi",
    howitworks: "/about/ai-assisted-views",
    "howitworks/ir": "/about/ai-assisted-views",
    "howitworks/emp": "/about/ai-assisted-views-employees"
  };
  var ACTIONS = {
    "data-askfre": "#askfre",
    "data-csv": "#download-csv",
    "data-share": "#copy-share-link",
    "data-save": "#save-view",
    "data-sharepage": "#share-page",
    "data-one": "#open-intranet"
  };
  var PALETTES = {
    "#00285f": "blue",
    "#0d408c": "light",
    "#003373": "kabi",
    "#004033": "helios",
    "#003359": "teal"
  };
  function mapHref(a) {
    if (!a) return "#";
    const action = Object.keys(ACTIONS).find((k) => a.hasAttribute(k));
    if (action) return ACTIONS[action];
    if (a.hasAttribute("data-scroll2")) return `#${a.getAttribute("data-scroll2")}`;
    const href = a.getAttribute("data-href") || a.getAttribute("href");
    if (!href || href.startsWith("#nohref")) return "#";
    if (!href.startsWith("#")) return href;
    const [route, anchor] = href.slice(1).split("@");
    const path = ROUTES[route];
    if (!path) return "#";
    return anchor ? `${path}#${anchor}` : path;
  }
  var linked = (a) => Object.keys(ACTIONS).some((k) => a.hasAttribute(k)) || mapHref(a) !== "#";
  function palette(el) {
    const bg = el && (el.matches(".flow-bg") ? el : el.querySelector(":scope > .flow-bg, .flow-bg"));
    if (!bg) return "";
    const style = bg.getAttribute("style") || "";
    let hex = (style.match(/#[0-9a-f]{6}/i) || [])[0];
    const rgb = style.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!hex && rgb) hex = `#${rgb.slice(1, 4).map((v) => (+v).toString(16).padStart(2, "0")).join("")}`;
    return hex && PALETTES[hex.toLowerCase()] || "blue";
  }
  var text = (el) => {
    if (!el) return "";
    const c = el.cloneNode(true);
    c.querySelectorAll("svg, .srcchips, .urlp, .sc").forEach((n) => n.remove());
    return c.textContent.replace(/\s+/g, " ").trim();
  };
  function h(document, tag, content) {
    const el = document.createElement(tag);
    if (content instanceof Node) el.append(content);
    else if (Array.isArray(content)) el.append(...content);
    else if (content !== void 0) el.textContent = content;
    return el;
  }
  var block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });
  function button(document, btn) {
    const a = h(document, "a", text(btn));
    a.href = mapHref(btn);
    const cls = btn.className;
    let inner = a;
    if (/\bprimary\b/.test(cls)) inner = h(document, "strong", a);
    else if (/\bsecondary\b/.test(cls)) inner = h(document, "em", a);
    return h(document, "p", inner);
  }
  var source = (document, el) => h(document, "p", `Source: ${text(el)}`);
  function listRows(document, rows) {
    const ul = document.createElement("ul");
    rows.forEach((r) => {
      const li = document.createElement("li");
      const lead = r.querySelector(".lead");
      const t = r.querySelector(".t");
      const m = r.querySelector(".m");
      if (lead) li.append(text(lead), document.createElement("br"));
      const title = h(document, "strong");
      if (linked(r)) {
        const a = h(document, "a", text(t));
        a.href = mapHref(r);
        title.append(a);
      } else title.textContent = text(t);
      li.append(title);
      if (m && text(m)) li.append(document.createElement("br"), text(m));
      ul.append(li);
    });
    return ul;
  }
  function tagsRow(document, el) {
    const out = [];
    const srcs = [...el.querySelectorAll(":scope > .src")];
    if (srcs.length && srcs.length === el.children.length) return srcs.map((s) => source(document, s));
    const label = el.querySelector(":scope > .label");
    const tags = [...el.querySelectorAll(":scope > .tag")];
    const p = document.createElement("p");
    if (label) p.append(`${text(label)} `);
    tags.forEach((t, i) => {
      const code = h(document, "code", text(t));
      if (i) p.append(" ");
      p.append(t.classList.contains("selected") ? h(document, "strong", code) : code);
    });
    out.push(p);
    return out;
  }
  function keyFigures(document, cols) {
    const cells = cols.map((c) => {
      const k = c.querySelector(".kpi");
      const v = text(k.querySelector(".v"));
      const src = c.querySelector(":scope > .src");
      return [
        text(k.querySelector(".o")),
        k.classList.contains("brand") ? h(document, "em", v) : v,
        text(k.querySelector(".c")),
        src ? text(src) : ""
      ];
    });
    return block(document, "Key Figures", cells);
  }
  function contactBlock(document, contacts) {
    return block(document, "Contact", contacts.map((c) => {
      const actions = [...c.querySelectorAll(".btn")].map((b) => {
        const p = button(document, b);
        const a = p.querySelector("a");
        if (/message/i.test(a.textContent)) {
          const mail = text(c.querySelector(".body-s")).match(/[\w.-]+@[\w.-]+/);
          a.href = `mailto:${mail ? mail[0] : "ir-fre@fresenius.com"}`;
        }
        return p;
      });
      return [
        text(c.querySelector(".overline")),
        text(c.querySelector(".avatar")),
        h(document, "p", h(document, "strong", text(c.querySelector(".label")))),
        text(c.querySelector(".body-s")),
        actions
      ];
    }));
  }
  function cardsBlock(document, variant, cards) {
    const rows = cards.map((card) => {
      const content = [];
      const media = card.matches(".flow") ? card : card.querySelector(".media.flow");
      card.querySelectorAll(":scope > *, :scope > .bd > *").forEach((n) => {
        if (n.matches(".flow-bg, .media, .bd, .go2")) return;
        if (n.matches(".overline, .tag")) content.push(h(document, "h6", text(n)));
        else if (n.matches(".h2, .h4") || variant === "tile" && n.matches(".label")) content.push(h(document, "h3", text(n)));
        else if (n.matches(".label") && /→/.test(n.textContent)) {
          const a = h(document, "a", text(n).replace(/\s*→\s*$/, ""));
          a.href = mapHref(card);
          content.push(h(document, "p", a));
        } else if (n.matches(".label")) content.push(h(document, "p", h(document, "strong", text(n))));
        else if (text(n)) content.push(h(document, "p", text(n)));
      });
      const hasLink = content.some((n) => n.querySelector && n.querySelector("a"));
      if (!hasLink && linked(card)) {
        const title = content.find((n) => n.tagName === "H3") || content[0];
        if (title) {
          const a = h(document, "a", title.textContent);
          a.href = mapHref(card);
          title.textContent = "";
          title.append(a);
        }
      }
      return media ? [palette(media), content] : [content];
    });
    return block(document, `Cards (${variant})`, rows);
  }
  function flowContent(document, el, out = []) {
    [...el.children].forEach((n) => {
      if (n.matches(".flow-bg, .glow, .srcnote, .go2")) return;
      if (n.matches(".overline")) out.push(h(document, "h6", text(n)));
      else if (n.matches(".h1, h1")) out.push(h(document, "h1", text(n)));
      else if (n.matches(".h2, h2")) out.push(h(document, "h2", text(n)));
      else if (n.matches(".h4")) out.push(h(document, "h3", text(n)));
      else if (n.matches(".label")) out.push(h(document, "p", h(document, "strong", text(n))));
      else if (n.matches(".btn")) out.push(button(document, n));
      else if (n.matches(".src")) out.push(source(document, n));
      else if (n.matches(".tag")) out.push(h(document, "p", h(document, "strong", h(document, "code", text(n)))));
      else if (n.matches(".lrow")) {
        const prev = out[out.length - 1];
        const ul = listRows(document, [n]);
        if (prev && prev.tagName === "UL" && prev.dataset.rows) prev.append(...ul.children);
        else {
          ul.dataset.rows = "1";
          out.push(ul);
        }
      } else if (n.matches(".tags")) out.push(...tagsRow(document, n));
      else if (n.matches(".kpi-col")) out.push(keyFigures(document, [n]));
      else if (n.matches(".contact")) out.push(contactBlock(document, [n]));
      else if (n.matches(".tile")) out.push(cardsBlock(document, "tile", [n]));
      else if (n.matches("table.guid")) out.push(tableBlock(document, n));
      else if (n.matches(".chart-box")) out.push(chartBlock(document, n));
      else if (n.matches(".legend")) {
      } else if (n.matches(".ask-form")) out.push(askBlock(document, n));
      else if (n.matches(".ask")) {
      } else if (n.matches("p")) {
        const t = text(n);
        if (!t) return;
        if (n.matches(".body-s.faint")) out.push(h(document, "p", h(document, "em", t)));
        else if (/^[“"]/.test(t) && n.matches(".body-l")) out.push(h(document, "blockquote", h(document, "p", t)));
        else out.push(h(document, "p", t));
      } else if (n.matches("div, span, section")) {
        if (n.matches(".chart-box") || n.id === "chart") out.push(chartBlock(document, n));
        else flowContent(document, n, out);
      }
    });
    out.forEach((n) => {
      if (n.dataset) delete n.dataset.rows;
    });
    return out;
  }
  function tableBlock(document, table) {
    const rows = [...table.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => {
      const t = text(c);
      return c.matches(".u, .t") && t ? h(document, "strong", t) : t;
    }));
    return block(document, "Table (guidance)", rows);
  }
  function chartBlock(document, el) {
    const t = el.querySelector("table.chart-data");
    const rows = [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => text(c)));
    rows.push(["Corridor", t.dataset.corridorKabi, t.dataset.corridorHelios, "", ""]);
    rows.push(["Highlight", t.dataset.highlight, "", "", ""]);
    return block(document, "Chart", rows);
  }
  function askBlock(document, form) {
    const input = form.querySelector("input");
    const hints = [...form.querySelectorAll("[data-fill]")];
    const glassy = form.querySelector(".ask.glassy");
    const rows = [[input.getAttribute("placeholder")]];
    hints.forEach((b) => rows.push([text(b), decodeURIComponent(b.getAttribute("data-fill"))]));
    return block(document, glassy ? "Ask (glassy)" : "Ask", rows);
  }
  function searchFormBlock(document, el) {
    const rows = [...el.querySelectorAll("[data-tag=label]")].map((l) => [
      text(l.querySelector(".label")),
      l.querySelector("input").getAttribute("placeholder"),
      l.querySelector("svg") ? "search" : ""
    ]);
    const btn = el.querySelector(":scope > .btn");
    if (btn) rows.push([text(btn)]);
    return block(document, "Search Form", rows);
  }
  function tagsBlock(document, el, variant) {
    const label = el.querySelector(":scope > .label");
    const ul = document.createElement("ul");
    el.querySelectorAll(":scope > .tag").forEach((t) => {
      const li = document.createElement("li");
      let inner = text(t).replace(/\s*\+$/, "");
      if (t.dataset.tag === "a" || t.tagName === "A") {
        const a = h(document, "a", inner);
        a.href = mapHref(t);
        inner = a;
      }
      li.append(t.classList.contains("subtle") ? h(document, "em", inner) : inner);
      ul.append(li);
    });
    const rows = [];
    if (label) rows.push([text(label)]);
    rows.push([ul]);
    return block(document, variant ? `Tags (${variant})` : "Tags", rows);
  }
  function noticeBlock(document, el) {
    const link = el.querySelector(":scope > [data-tag=a], :scope > a");
    const a = h(document, "a", text(link).replace(/\s*→\s*$/, ""));
    a.href = mapHref(link);
    return block(document, "Notice", [[
      h(document, "p", h(document, "strong", text(el.querySelector(".ti")))),
      h(document, "p", text(el.querySelector(".tx .body-s"))),
      h(document, "p", a)
    ]]);
  }
  function sectionNavBlock(document, nav) {
    const ul = document.createElement("ul");
    nav.querySelectorAll("[data-scroll]").forEach((b) => {
      const a = h(document, "a", text(b));
      a.href = `#${b.dataset.scroll}`;
      ul.append(h(document, "li", a));
    });
    return block(document, "Section Nav", [[ul]]);
  }
  function breadcrumbBlock(document, crumb) {
    const parts = text(crumb).split("\u203A").map((t) => t.trim()).filter(Boolean);
    return block(document, "Breadcrumb", [parts]);
  }
  function questionBlock(document, el) {
    const q = text(el.querySelector("p")).replace(/^[“"]|[”"]$/g, "");
    const edit = el.querySelector("[data-edit], [data-edit2]");
    const a = h(document, "a", text(edit));
    a.href = edit && edit.hasAttribute("data-edit2") ? ROUTES.fhs : ROUTES.investors;
    return block(document, "Question", [[q], [a]]);
  }
  function heroBlock(document, el) {
    const variant = el.matches(".flow") ? `flow, ${palette(el)}` : "";
    const content = [];
    let ask = null;
    [...el.children].forEach((n) => {
      if (n.matches(".ask-form")) ask = n;
      else content.push(...flowContent(document, h(document, "div", n.cloneNode(true))));
    });
    const rows = [[content]];
    if (ask) {
      rows.push(["Ask", ask.querySelector("input").getAttribute("placeholder")]);
    }
    return block(document, variant ? `Hero (${variant})` : "Hero", rows);
  }
  function stageBlock(document, el) {
    const rows = [...el.querySelectorAll(".stage-slide")].map((s) => {
      const content = flowContent(document, s);
      const img = s.dataset.img === "yes" ? h(document, "img") : "";
      if (img) {
        img.src = "./media/fresenius/stage-wuxi.jpg";
        img.alt = "Biopharmaceutical laboratory";
      }
      return [img, content, s.dataset.tab];
    });
    const ask = el.querySelector(".ask-form input");
    if (ask) rows.push(["Ask", ask.getAttribute("placeholder"), ""]);
    return block(document, "Stage", rows);
  }

  // tools/importer/fresenius/import.js
  var Sections = class {
    constructor(document) {
      this.document = document;
      this.list = [];
      this.cur = null;
    }
    open(meta = {}) {
      this.cur = { nodes: [], meta };
      this.list.push(this.cur);
      return this.cur;
    }
    add(...nodes) {
      if (!this.cur) this.open();
      this.cur.nodes.push(...nodes.filter(Boolean));
    }
    close() {
      this.cur = null;
    }
    own(meta, ...nodes) {
      this.close();
      this.open(meta);
      this.add(...nodes);
      this.close();
    }
    render(main) {
      const { document } = this;
      const out = this.list.filter((s) => s.nodes.length);
      out.forEach((s, i) => {
        main.append(...s.nodes);
        const meta = {};
        if (s.meta.style && s.meta.style.length) meta.Style = [...new Set(s.meta.style)].join(", ");
        if (s.meta.id) meta.Id = s.meta.id;
        if (Object.keys(meta).length) main.append(block(document, "Section Metadata", meta));
        if (i < out.length - 1) main.append(document.createElement("hr"));
      });
    }
  };
  var styleOf = (el) => (el.getAttribute("style") || "").replace(/\s/g, "");
  var isNarrow = (el) => /max-width:860px/.test(styleOf(el));
  var isInline = (el) => /flex-direction:row/.test(styleOf(el));
  var isFixed = (el) => /\bfixed-\d+/.test(el.className);
  var isTint = (el) => /brand-tint/.test(styleOf(el));
  var CARD_ROWS = [
    [".aud-card", "audience"],
    [".teaser", "teaser"],
    [".glass.story", "story"],
    [".img-card", "image"],
    [".tile", "tile"]
  ];
  function glassSection(S, el, extra = []) {
    const { document } = S;
    const style = ["glass", ...extra];
    if (isInline(el)) style.push("inline");
    if (isNarrow(el)) style.push("narrow");
    if (el.querySelector("[data-edit], [data-edit2]")) {
      S.own({ style: isNarrow(el) ? ["narrow"] : [] }, questionBlock(document, el));
      return;
    }
    if (el.querySelector(":scope > [data-tag=label] .ask")) {
      S.own({ style: style.filter((s) => s !== "inline") }, searchFormBlock(document, el));
      return;
    }
    S.own({ style }, ...flowContent(document, el));
  }
  function columnContent(document, col) {
    if (col.matches(".glass")) return flowContent(document, col);
    if (col.matches(".kpi-col")) return [keyFigures(document, [col])];
    if (col.matches(".tgrid")) return [cardsBlock(document, "tile", [...col.querySelectorAll(":scope > .tile")])];
    const out = [];
    [...col.children].forEach((n) => {
      if (n.matches(".glass")) out.push(block(document, "Cards (panel)", [[flowContent(document, n)]]));
      else if (n.matches(".contact")) out.push(contactBlock(document, [n]));
      else if (n.matches(".tile")) {
        out.push(n);
      } else if (n.matches(".tgrid")) out.push(cardsBlock(document, "tile", [...n.querySelectorAll(":scope > .tile")]));
      else out.push(...flowContent(document, h(document, "div", n.cloneNode(true))));
    });
    const merged = [];
    out.forEach((n) => {
      if (n.matches && n.matches(".tile")) {
        const last = merged[merged.length - 1];
        if (Array.isArray(last)) last.push(n);
        else merged.push([n]);
      } else merged.push(n);
    });
    return merged.map((n) => Array.isArray(n) ? cardsBlock(document, "tile", n) : n);
  }
  function handleRow(S, row) {
    const { document } = S;
    const kids = [...row.children];
    const narrow = isNarrow(row);
    for (const [sel, variant] of CARD_ROWS) {
      if (kids.length && kids.every((k) => k.matches(sel))) {
        S.add(cardsBlock(document, variant, kids));
        return;
      }
    }
    if (kids.every((k) => k.matches(".kpi-col"))) {
      S.add(keyFigures(document, kids));
      return;
    }
    if (kids.every((k) => k.matches(".contact"))) {
      S.add(contactBlock(document, kids));
      return;
    }
    if (kids.every(isTint)) {
      S.add(cardsBlock(document, "tint", kids));
      return;
    }
    if (kids.every((k) => k.matches(".glass") && k.querySelector(":scope > .h2"))) {
      S.add(cardsBlock(document, "year", kids));
      return;
    }
    if (kids.every((k) => k.matches(".img-card"))) {
      S.add(cardsBlock(document, "image", kids));
      return;
    }
    S.close();
    kids.forEach((k, i) => {
      const style = ["column"];
      if (i === 0) style.push("new-row");
      if (k.matches(".glass")) style.push("glass");
      if (isFixed(k)) style.push("fixed");
      if (narrow) style.push("narrow");
      S.own({ style }, ...columnContent(document, k));
    });
  }
  function container(S, el, meta = {}) {
    const { document } = S;
    S.close();
    S.open({ ...meta, style: isNarrow(el) ? ["narrow"] : [] });
    [...el.children].forEach((n) => {
      if (n.matches(".srcnote")) return;
      if (n.matches(".row")) {
        handleRow(S, n);
        return;
      }
      if (n.matches(".tgrid")) {
        S.add(cardsBlock(document, "tile", [...n.children]));
        return;
      }
      if (n.matches(".glass")) {
        glassSection(S, n);
        return;
      }
      if (n.matches(".tags") && n.querySelector("[data-filter]")) {
        const ul = document.createElement("ul");
        n.querySelectorAll("[data-filter]").forEach((b, i) => ul.append(h(document, "li", i ? text(b) : h(document, "strong", text(b)))));
        S.add(block(document, "Tags (filter)", [[ul]]));
        return;
      }
      if (n.matches(".img-card")) {
        S.add(cardsBlock(document, "image", [n]));
        return;
      }
      if (n.matches(".kpi-col")) {
        S.add(keyFigures(document, [n]));
        return;
      }
      S.add(...flowContent(document, h(document, "div", n.cloneNode(true))));
    });
    S.close();
  }
  function walkMain(S, main) {
    const { document } = S;
    [...main.children].forEach((n) => {
      if (n.matches(".crumb")) S.own({}, breadcrumbBlock(document, n));
      else if (n.matches(".hero.stage")) S.own({}, stageBlock(document, n));
      else if (n.matches(".hero")) S.own({}, heroBlock(document, n));
      else if (n.matches(".ask-form")) S.own({}, askBlock(document, n));
      else if (n.matches(".secnav")) S.own({}, sectionNavBlock(document, n));
      else if (n.matches("section.tsec")) container(S, n, { id: n.id });
      else if (n.matches("section.row")) {
        S.close();
        if (isNarrow(n)) S.open({ style: ["narrow"] });
        handleRow(S, n);
        S.close();
      } else if (n.matches(".glass")) glassSection(S, n);
      else if (n.matches("section.col")) container(S, n);
      else if (n.matches("section") && /align-items:flex-end/.test(styleOf(n))) S.own({ style: ["heading-bar"] }, ...flowContent(document, n));
      else if (n.matches(".tags")) S.own({ style: isNarrow(n) ? ["narrow"] : [] }, tagsBlock(document, n));
      else if (n.matches(".notice")) S.own({ style: isNarrow(n) ? ["narrow"] : [] }, noticeBlock(document, n));
      else if (n.matches(".contact")) S.own({}, contactBlock(document, [n]));
      else if (n.matches(".img-card")) S.own({ style: isNarrow(n) ? ["narrow"] : [] }, cardsBlock(document, "image", [n]));
      else if (n.matches(".srcnote")) {
      } else if (n.matches("p.faint")) S.own({ style: isNarrow(n) ? ["narrow"] : [] }, h(document, "p", h(document, "em", text(n))));
      else S.own({}, ...flowContent(document, h(document, "div", n.cloneNode(true))));
    });
  }
  var FLY_PALETTE = { about: "blue", businesses: "kabi" };
  function buildNav(document, wrap) {
    const S = new Sections(document);
    const brand = h(document, "a", "Fresenius");
    brand.href = "/";
    S.own({}, h(document, "p", brand));
    const ul = document.createElement("ul");
    wrap.querySelectorAll(".nav .links > *").forEach((a) => {
      const link = h(document, "a", text(a));
      link.href = mapHref(a);
      ul.append(h(document, "li", link));
    });
    S.own({}, ul);
    const tools = [...wrap.querySelectorAll(".nav .actions > *")].map((t) => {
      const label = text(t) || t.getAttribute("aria-label");
      const a = h(document, "a", label);
      if (t.matches(".btn")) {
        a.href = mapHref(t);
        return h(document, "p", h(document, "strong", a));
      }
      a.href = /search/i.test(label) ? "#search" : "#language";
      return h(document, "p", a);
    });
    S.own({}, ...tools);
    wrap.querySelectorAll(".fly").forEach((fly) => {
      const key = fly.id.replace("fly-", "");
      const nodes = [];
      const head = fly.querySelector(".fhead");
      nodes.push(h(document, "h6", text(head.querySelector(".overline"))));
      nodes.push(h(document, "h3", text(head.querySelector(".h4"))));
      nodes.push(h(document, "p", text(head.querySelector("p"))));
      const ov = head.querySelector(".btn");
      const ova = h(document, "a", text(ov));
      ova.href = mapHref(ov);
      nodes.push(h(document, "p", h(document, "em", ova)));
      fly.querySelectorAll(".fcol").forEach((col) => {
        nodes.push(h(document, "h4", text(col.querySelector("h5"))));
        const list = document.createElement("ul");
        col.querySelectorAll(".fl").forEach((fl) => {
          const li = document.createElement("li");
          const title = text(fl.querySelector("[data-tag=b]"));
          const a = h(document, "a", title);
          a.href = mapHref(fl);
          const external = { "helios-gesundheit.de": "https://www.helios-gesundheit.de/", "quironsalud.es": "https://www.quironsalud.com/" }[title];
          if (external) a.href = external;
          li.append(a);
          const desc = text(fl).slice(title.length).trim();
          if (desc) li.append(document.createElement("br"), desc);
          list.append(li);
        });
        nodes.push(list);
      });
      const promo = fly.querySelector(".fpromo");
      nodes.push(h(document, "h6", text(promo.querySelector(".overline"))));
      nodes.push(h(document, "h5", text(promo.querySelector(".h4"))));
      promo.querySelectorAll(":scope > .body-s").forEach((p) => nodes.push(h(document, "p", text(p))));
      const more = h(document, "a", text(promo.querySelector(".label")).replace(/\s*→\s*$/, ""));
      more.href = mapHref(promo);
      nodes.push(h(document, "p", more));
      S.own({ style: ["flyout", FLY_PALETTE[key] || "blue"] }, ...nodes);
    });
    return S;
  }
  function buildFooter(document, body) {
    const S = new Sections(document);
    const nodes = [];
    body.querySelectorAll(".sfoot > div").forEach((col) => {
      nodes.push(h(document, "h3", text(col.querySelector("h6"))));
      const p = col.querySelector("p");
      const para = document.createElement("p");
      [...p.childNodes].forEach((c) => {
        if (c.nodeType === 3) para.append(c.textContent);
        else if (c.tagName === "A") {
          const a = h(document, "a", text(c));
          a.href = mapHref(c);
          para.append(a);
        }
      });
      nodes.push(para);
    });
    S.own({}, ...nodes);
    S.own({}, h(document, "p", text(body.querySelector(".foot"))));
    return S;
  }
  var import_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const originalURL = params.originalURL || url;
      const body = document.body;
      const out = document.createElement("div");
      let S;
      const navWrap = body.querySelector(".nav-wrap");
      if (navWrap) S = buildNav(document, navWrap);
      else if (body.querySelector(".sfoot")) S = buildFooter(document, body);
      else {
        S = new Sections(document);
        walkMain(S, body.querySelector("main") || body);
      }
      S.render(out);
      const title = document.title;
      if (!navWrap && !body.querySelector(".sfoot")) {
        const lead = [...out.querySelectorAll("p")].find((p) => !p.closest("table") && p.textContent.length > 60);
        out.append(block(document, "Metadata", { Title: title, Description: lead ? lead.textContent.trim() : title }));
      }
      body.innerHTML = "";
      body.append(...out.childNodes);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{ element: body, path, report: { title } }];
    }
  };
  return __toCommonJS(import_exports);
})();
