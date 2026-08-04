/* ============================================
   TERMOCEP - main.js
   Menu, tema, scroll, acessibilidade, formulário
   ============================================ */

(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function init() {
    initTheme();
    initMenu();
    initScrollSpy();
    initBackToTop();
    initReveal();
    initFontSize();
    initContactForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function initTheme() {
    const button = $("#themeToggle");
    if (!button) return;

    const savedTheme = localStorage.getItem("termocep-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);

    button.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("termocep-theme", next);
    });

    function setTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"
      );
      button.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  function initMenu() {
    const toggle = $("#menuToggle");
    const nav = $("#siteNav");
    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu de navegação");
    }

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Fechar menu de navegação" : "Abrir menu de navegação"
      );
    });

    $$(".menu a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;

    const sections = $$("main section[id]");
    const links = $$(".menu a");

    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;

          links.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      {
        rootMargin: "-40% 0px -55% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initBackToTop() {
    const button = $("#voltarTopo");
    if (!button) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const toggleVisibility = () => {
      button.classList.toggle("show", window.scrollY > 700);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });

    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });

    toggleVisibility();
  }

  function initReveal() {
    const elements = $$(".reveal");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!elements.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function initFontSize() {
    const aumentar = $("#aumentarFonte");
    const diminuir = $("#diminuirFonte");
    const restaurar = $("#restaurarFonte");
    const atual = $("#fonteAtual");

    if (!aumentar || !diminuir || !restaurar) return;

    let scale = Number(localStorage.getItem("termocep-font-scale")) || 1;

    function apply() {
      scale = Math.min(1.3, Math.max(0.85, scale));
      document.documentElement.style.fontSize = `${scale * 100}%`;
      localStorage.setItem("termocep-font-scale", String(scale));

      if (atual) {
        atual.textContent = `Tamanho atual: ${Math.round(scale * 100)}%`;
      }
    }

    aumentar.addEventListener("click", () => {
      scale += 0.05;
      apply();
    });

    diminuir.addEventListener("click", () => {
      scale -= 0.05;
      apply();
    });

    restaurar.addEventListener("click", () => {
      scale = 1;
      apply();
    });

    apply();
  }

  function initContactForm() {
    const form = $("#formContato");
    if (!form) return;

    const nome = $("#nome");
    const email = $("#email");
    const mensagem = $("#mensagem");
    const status = $("#formStatus");

    const erroNome = $("#erro-nome");
    const erroEmail = $("#erro-email");
    const erroMensagem = $("#erro-mensagem");

    function setFieldError(input, errorEl, message) {
      if (!input || !errorEl) return;
      errorEl.textContent = message;
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      status.className = "form-feedback";
      status.textContent = "";

      let valid = true;
      let firstInvalid = null;

      if (nome.value.trim().length < 3) {
        setFieldError(nome, erroNome, "Informe um nome com pelo menos 3 caracteres.");
        valid = false;
        firstInvalid = firstInvalid || nome;
      } else {
        setFieldError(nome, erroNome, "");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.value.trim())) {
        setFieldError(email, erroEmail, "Informe um e-mail válido.");
        valid = false;
        firstInvalid = firstInvalid || email;
      } else {
        setFieldError(email, erroEmail, "");
      }

      if (mensagem.value.trim().length < 10) {
        setFieldError(mensagem, erroMensagem, "A mensagem deve ter pelo menos 10 caracteres.");
        valid = false;
        firstInvalid = firstInvalid || mensagem;
      } else {
        setFieldError(mensagem, erroMensagem, "");
      }

      if (!valid) {
        status.classList.add("error");
        status.textContent = "Corrija os campos destacados.";
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      status.classList.add("success");
      status.textContent = "Mensagem enviada com sucesso! Este é um formulário demonstrativo.";
      form.reset();
    });
  }

  function initYear() {
    const year = $("#anoAtual");
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  }
})();
