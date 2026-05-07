(async () => {
  const targets = document.querySelectorAll("[data-site-field], [data-site-list]");
  if (!targets.length) {
    return;
  }

  const prefix = window.location.pathname.includes("/posts/") ? "../" : "";

  const get = (obj, path) => path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    return value[key];
  }, obj);

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  };

  try {
    const response = await fetch(`${prefix}data/site.json`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const site = await response.json();

    document.title = document.title.replace(/^[^|]+/, site.siteName || "suancai_soup ");
    setText("[data-site-brand]", site.siteName);
    setText("[data-site-tagline]", site.tagline);

    document.querySelectorAll("[data-site-field]").forEach((node) => {
      const value = get(site, node.dataset.siteField);
      if (typeof value === "string") {
        node.textContent = value;
      }
    });

    document.querySelectorAll("[data-site-list='links']").forEach((node) => {
      node.replaceChildren(...(site.links || []).map((link) => {
        const item = document.createElement("a");
        item.href = link.href || "#";
        item.textContent = link.label || link.href || "Link";
        return item;
      }));
    });

    document.querySelectorAll("[data-site-list='categories']").forEach((node) => {
      node.replaceChildren(...(site.categories || []).map((label) => {
        const item = document.createElement("a");
        item.href = "archive.html";
        item.textContent = label;
        return item;
      }));
    });

    document.querySelectorAll("[data-site-list='aboutCards']").forEach((node) => {
      node.replaceChildren(...(site.aboutCards || []).map((card) => {
        const article = document.createElement("article");
        article.className = "about-card";
        const title = document.createElement("h2");
        title.textContent = card.title || "";
        const body = document.createElement("p");
        body.textContent = card.body || "";
        article.append(title, body);
        return article;
      }));
    });

    document.querySelectorAll("[data-site-list='timeline']").forEach((node) => {
      const heading = document.createElement("h2");
      heading.textContent = "内容路线";
      const items = (site.timeline || []).map((entry) => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        const number = document.createElement("span");
        number.textContent = entry.number || "";
        const content = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = entry.title || "";
        const body = document.createElement("p");
        body.textContent = entry.body || "";
        content.append(title, body);
        item.append(number, content);
        return item;
      });
      node.replaceChildren(heading, ...items);
    });
  } catch {
    // Static fallback content remains visible if the JSON file is unavailable.
  }
})();
