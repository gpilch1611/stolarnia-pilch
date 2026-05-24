(function () {
  "use strict";

  const FOUNDING_YEAR = 1994;
  const FOUNDING_MONTH = 1;
  const STATS_STORAGE_KEY = "stolarnia-pilch-stats-v1";

  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a, .footer-nav a[href^='#']");
  const form = document.getElementById("quote-form");
  const formStatus = document.getElementById("form-status");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const submitBtn = document.getElementById("form-submit-btn");
  const stickyCta = document.getElementById("sticky-cta");
  const trustOrdersEl = document.getElementById("trust-orders");

  /* —— Trust counter: ~1–5 zleceń / miesiąc od 1994 —— */
  function monthIndex(year, month) {
    return (year - FOUNDING_YEAR) * 12 + (month - FOUNDING_MONTH);
  }

  function currentMonthKey() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  }

  function incrementForMonth(index) {
    const seed = (index * 7919 + 104729) % 2147483647;
    return (seed % 5) + 1;
  }

  function baselineOrdersThrough(monthIdxInclusive) {
    let total = 0;
    for (let i = 0; i <= monthIdxInclusive; i++) {
      total += incrementForMonth(i);
    }
    return total;
  }

  function randomMonthBump() {
    return Math.floor(Math.random() * 5) + 1;
  }

  function getOrdersCount() {
    const now = new Date();
    const currentIdx = monthIndex(now.getFullYear(), now.getMonth() + 1);
    const monthKey = currentMonthKey();
    let stored = null;

    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {
      stored = null;
    }

    const baseline = baselineOrdersThrough(currentIdx);

    if (!stored || typeof stored.count !== "number") {
      stored = { monthKey: monthKey, count: baseline };
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stored));
      return stored.count;
    }

    if (stored.monthKey !== monthKey) {
      stored.count += randomMonthBump();
      stored.monthKey = monthKey;
      if (stored.count < baseline) stored.count = baseline;
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stored));
    }

    return stored.count;
  }

  /** Zaokrąglenie w dół do pełnej setki — wyświetlanie np. 1100+, 1200+ */
  function roundDownToHundred(n) {
    return Math.floor(n / 100) * 100;
  }

  function formatTrustDisplay(n) {
    const rounded = roundDownToHundred(n);
    return new Intl.NumberFormat("pl-PL").format(rounded) + "+";
  }

  function animateTrustCounter(el, rawCount) {
    if (!el) return;
    const target = roundDownToHundred(rawCount);
    const display = formatTrustDisplay(rawCount);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || target === 0) {
      el.textContent = display;
      return;
    }

    const duration = 700;
    const start = performance.now();
    const from = Math.max(0, target - 200);

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = new Intl.NumberFormat("pl-PL").format(value) + "+";
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = display;
    }
    requestAnimationFrame(frame);
  }

  if (trustOrdersEl) {
    const count = getOrdersCount();
    animateTrustCounter(trustOrdersEl, count);
    trustOrdersEl.setAttribute(
      "title",
      "Szacunkowo ponad " + formatTrustDisplay(count).replace("+", "") + " zleceń od 1994 roku"
    );
  }

  /* —— Sticky CTA (mobile) —— */
  function initStickyCta() {
    if (!stickyCta) return;

    const wycenaSection = document.getElementById("wycena");
    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    function updateVisibility() {
      if (!isMobile()) {
        stickyCta.hidden = true;
        return;
      }
      stickyCta.hidden = false;
    }

    updateVisibility();
    window.addEventListener("resize", updateVisibility, { passive: true });

    if (wycenaSection && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          if (!isMobile()) return;
          const inView = entries.some(function (e) {
            return e.isIntersecting && e.intersectionRatio > 0.15;
          });
          stickyCta.hidden = inView;
        },
        { threshold: [0, 0.15, 0.5] }
      );
      observer.observe(wycenaSection);
    }
  }

  initStickyCta();

  /* —— Mobile navigation —— */
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      siteNav.classList.toggle("is-open", !expanded);
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 767px)").matches) {
          navToggle.setAttribute("aria-expanded", "false");
          siteNav.classList.remove("is-open");
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && siteNav.classList.contains("is-open")) {
        navToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
        navToggle.focus();
      }
    });
  }

  /* —— Smooth scroll —— */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerOffset = document.querySelector(".site-header")?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: top, behavior: "smooth" });
      history.pushState(null, "", id);
    });
  });

  /* —— Form —— */
  function showStatus(title, message, type) {
    if (!formStatus) return;
    formStatus.innerHTML =
      "<strong>" + title + "</strong><span>" + message + "</span>";
    formStatus.className = "form-status " + type;
    formStatus.hidden = false;
    formStatus.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideStatus() {
    if (!formStatus) return;
    formStatus.hidden = true;
    formStatus.innerHTML = "";
  }

  function setFormLoading(loading) {
    if (!submitBtn || !form) return;
    submitBtn.classList.toggle("is-loading", loading);
    submitBtn.disabled = loading;
    form.classList.toggle("is-busy", loading);
    form.setAttribute("aria-busy", loading ? "true" : "false");
    const label = submitBtn.querySelector(".btn-label");
    if (label) label.textContent = loading ? "Wysyłanie zapytania…" : "Wyślij zapytanie";
  }

  function clearInvalid() {
    form.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
  }

  function validateContact() {
    const phone = phoneInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    return phone.length > 0 || email.length > 0;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearInvalid();
      hideStatus();

      const name = form.querySelector("#name");
      const type = form.querySelector("#type");
      const message = form.querySelector("#message");
      const rodo = form.querySelector("#rodo");

      let valid = true;

      if (!name.value.trim()) {
        name.classList.add("invalid");
        valid = false;
      }

      if (!validateContact()) {
        phoneInput?.classList.add("invalid");
        emailInput?.classList.add("invalid");
        valid = false;
      }

      if (!type.value) {
        type.classList.add("invalid");
        valid = false;
      }

      if (!message.value.trim()) {
        message.classList.add("invalid");
        valid = false;
      }

      if (!rodo.checked) {
        showStatus(
          "Brak zgody RODO",
          "Zaznacz zgodę na przetwarzanie danych, abyśmy mogli się z Tobą skontaktować.",
          "error"
        );
        return;
      }

      if (!valid) {
        showStatus(
          "Uzupełnij wymagane pola",
          "Podaj imię i nazwisko, telefon lub e-mail, rodzaj realizacji oraz krótki opis zlecenia.",
          "error"
        );
        return;
      }

      const action = form.getAttribute("action");
      if (!action || action.includes("XXXXX")) {
        showStatus(
          "Formularz nie jest jeszcze podłączony",
          'W pliku index.html wklej adres Formspree zamiast XXXXX (instrukcja w README.md) lub zadzwoń: <a href="tel:+48507166498" rel="noopener">507 166 498</a>.',
          "error"
        );
        return;
      }

      setFormLoading(true);
      const formData = new FormData(form);

      fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            showStatus(
              "Zapytanie wysłane",
              "Dziękujemy! Odezwiemy się w sprawie wyceny — zwykle w ciągu 1–2 dni roboczych. W pilnej sprawie zadzwoń: <a href=\"tel:+48507166498\" rel=\"noopener\">507 166 498</a>.",
              "success"
            );
          } else {
            return response.json().then(function (data) {
              throw new Error(data.error || "Błąd serwera");
            });
          }
        })
        .catch(function (err) {
          const detail = err && err.message ? " (" + err.message + ")" : "";
          showStatus(
            "Nie udało się wysłać formularza",
            "Sprawdź połączenie i spróbuj ponownie" +
              detail +
              '. Możesz też zadzwonić: <a href="tel:+48507166498" rel="noopener">507 166 498</a> lub napisać na <a href="mailto:kontakt@stolarniapilch.pl" rel="noopener">kontakt@stolarniapilch.pl</a>.',
            "error"
          );
        })
        .finally(function () {
          setFormLoading(false);
        });
    });
  }

  const header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener(
      "scroll",
      function () {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      },
      { passive: true }
    );
  }
})();
