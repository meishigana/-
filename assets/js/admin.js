const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const loginForm = document.querySelector("#login-form");
const siteForm = document.querySelector("#site-form");
const message = document.querySelector("#admin-message");
const reloadButton = document.querySelector("#reload-button");
const logoutButton = document.querySelector("#logout-button");

let token = localStorage.getItem("blogAdminToken") || "";

const showMessage = (text, isError = false) => {
  message.textContent = text;
  message.classList.toggle("error", isError);
};

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const setLoggedIn = (loggedIn) => {
  loginPanel.classList.toggle("hidden", loggedIn);
  editorPanel.classList.toggle("hidden", !loggedIn);
};

const parseJsonField = (value, fallback) => {
  try {
    return JSON.parse(value || "null") || fallback;
  } catch {
    throw new Error("JSON 字段格式不正确");
  }
};

const fillForm = (site) => {
  siteForm.siteName.value = site.siteName || "";
  siteForm.tagline.value = site.tagline || "";
  siteForm.heroEyebrow.value = site.heroEyebrow || "";
  siteForm.heroTitle.value = site.heroTitle || "";
  siteForm.heroText.value = site.heroText || "";
  siteForm.profileName.value = site.profileName || "";
  siteForm.profileBio.value = site.profileBio || "";
  siteForm.aboutIntro.value = site.aboutIntro || "";
  siteForm.contactText.value = site.contactText || "";
  siteForm.categories.value = (site.categories || []).join(", ");
  siteForm.links.value = (site.links || []).map((link) => `${link.label}|${link.href}`).join("\n");
  siteForm.aboutCards.value = JSON.stringify(site.aboutCards || [], null, 2);
  siteForm.timeline.value = JSON.stringify(site.timeline || [], null, 2);
};

const formToSite = () => ({
  siteName: siteForm.siteName.value.trim(),
  tagline: siteForm.tagline.value.trim(),
  heroEyebrow: siteForm.heroEyebrow.value.trim(),
  heroTitle: siteForm.heroTitle.value.trim(),
  heroText: siteForm.heroText.value.trim(),
  profileName: siteForm.profileName.value.trim(),
  profileBio: siteForm.profileBio.value.trim(),
  aboutIntro: siteForm.aboutIntro.value.trim(),
  contactText: siteForm.contactText.value.trim(),
  categories: siteForm.categories.value.split(",").map((item) => item.trim()).filter(Boolean),
  links: siteForm.links.value.split(/\r?\n/).map((line) => {
    const [label, href] = line.split("|").map((item) => item?.trim());
    return label && href ? { label, href } : null;
  }).filter(Boolean),
  aboutCards: parseJsonField(siteForm.aboutCards.value, []),
  timeline: parseJsonField(siteForm.timeline.value, []),
});

const loadSite = async () => {
  const response = await fetch("/api/site", { headers: headers(), cache: "no-store" });
  if (!response.ok) {
    throw new Error("无法载入站点数据");
  }
  fillForm(await response.json());
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = new FormData(loginForm).get("password");
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    showMessage("登录失败，请检查管理员密码。", true);
    return;
  }

  const data = await response.json();
  token = data.token;
  localStorage.setItem("blogAdminToken", token);
  setLoggedIn(true);
  await loadSite();
  showMessage("已登录。");
});

siteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/api/site", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(formToSite()),
    });
    if (!response.ok) {
      throw new Error("保存失败");
    }
    showMessage("保存成功，刷新博客页面即可看到更新。");
  } catch (error) {
    showMessage(error.message, true);
  }
});

reloadButton.addEventListener("click", async () => {
  await loadSite();
  showMessage("已重新载入。");
});

logoutButton.addEventListener("click", () => {
  token = "";
  localStorage.removeItem("blogAdminToken");
  setLoggedIn(false);
  showMessage("已退出。");
});

if (token) {
  setLoggedIn(true);
  loadSite().catch(() => {
    localStorage.removeItem("blogAdminToken");
    token = "";
    setLoggedIn(false);
  });
}
