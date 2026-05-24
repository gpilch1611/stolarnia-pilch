(function () {
  "use strict";

  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a, .footer-nav a[href^='#']");
  const form = document.getElementById("quote-form");
  const formStatus = document.getElementById("form-status");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");

  /* Mobile navigation */
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

  /* Smooth scroll for anchor links (Safari fallback) */
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

  /* Form validation & AJAX submit */
  function showStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = "form-status " + type;
    formStatus.hidden = false;
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
      formStatus.hidden = true;

      let valid = true;
      const name = form.querySelector("#name");
      const type = form.querySelector("#type");
      const message = form.querySelector("#message");
      const rodo = form.querySelector("#rodo");

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
        valid = false;
        showStatus("Zaznacz zgodę na przetwarzanie danych (RODO).", "error");
        return;
      }

      if (!valid) {
        showStatus("Uzupełnij wymagane pola — imię, telefon lub e-mail, rodzaj realizacji i opis.", "error");
        return;
      }

      const action = form.getAttribute("action");
      if (!action || action.includes("XXXXX")) {
        showStatus(
          "Formularz wymaga konfiguracji Formspree — wklej swój adres action w pliku index.html (patrz README.md).",
          "error"
        );
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Wysyłanie…";

      const formData = new FormData(form);

      fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            showStatus("Dziękujemy! Zapytanie zostało wysłane — skontaktujemy się wkrótce.", "success");
          } else {
            return response.json().then(function (data) {
              throw new Error(data.error || "Błąd wysyłki");
            });
          }
        })
        .catch(function () {
          showStatus("Nie udało się wysłać formularza. Spróbuj ponownie lub zadzwoń bezpośrednio.", "error");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Wyślij zapytanie";
        });
    });
  }

  /* Header shadow on scroll */
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
