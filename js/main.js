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

  /* —— Opinie: karuzela 100+, losowa kolejność —— */
  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function initReviewsCarousel() {
    const track = document.getElementById("reviews-track");
    const prevBtn = document.getElementById("reviews-prev");
    const nextBtn = document.getElementById("reviews-next");
    const meta = document.getElementById("reviews-meta");
    const source = window.STOLARNIA_REVIEWS;

    if (!track || !source || !source.length) return;

    const reviews = shuffleArray(source);
    let pageIndex = 0;

    function perPage() {
      return window.matchMedia("(min-width: 768px)").matches ? 3 : 1;
    }

    function pageCount() {
      return Math.ceil(reviews.length / perPage());
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    track.innerHTML = reviews
      .map(function (r) {
        return (
          '<div class="reviews-slide" role="listitem">' +
          '<blockquote class="review-card">' +
          "<p>„" +
          escapeHtml(r.text) +
          "”</p>" +
          "<footer><cite>" +
          escapeHtml(r.author) +
          "</cite></footer>" +
          "</blockquote></div>"
        );
      })
      .join("");

    function update() {
      const pp = perPage();
      const pages = pageCount();
      if (pageIndex >= pages) pageIndex = 0;
      if (pageIndex < 0) pageIndex = pages - 1;

      const slide = track.children[0];
      if (!slide) return;

      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      const slideWidth = slide.offsetWidth + gap;
      track.style.transform = "translateX(-" + pageIndex * slideWidth * pp + "px)";

      if (meta) {
        const from = pageIndex * pp + 1;
        const to = Math.min((pageIndex + 1) * pp, reviews.length);
        meta.textContent =
          "Opinie " +
          from +
          "–" +
          to +
          " z " +
          reviews.length +
          " · strona " +
          (pageIndex + 1) +
          "/" +
          pages;
      }

      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    function go(delta) {
      pageIndex += delta;
      const pages = pageCount();
      if (pageIndex >= pages) pageIndex = 0;
      if (pageIndex < 0) pageIndex = pages - 1;
      update();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () {
      go(-1);
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      go(1);
    });

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        pageIndex = 0;
        update();
      }, 150);
    });

    document.addEventListener("keydown", function (e) {
      const carousel = document.getElementById("reviews-carousel");
      if (!carousel) return;
      const rect = carousel.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReviewsCarousel);
  } else {
    initReviewsCarousel();
  }

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
