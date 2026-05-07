const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("open", !isOpen);
  });
}

const codeBlocks = document.querySelectorAll("pre code");

codeBlocks.forEach((block) => {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(block.textContent || "");
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1400);
  });
  block.parentElement?.appendChild(button);
});
