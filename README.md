# Stolarnia Pilch — strona one-page

Lokalna strona wizytówka dla stolarni w Borzęcie koło Myślenic.

## Uruchomienie lokalne

Otwórz plik `index.html` w przeglądarce lub uruchom prosty serwer:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Wejdź na `http://localhost:8080`.

## Co skonfigurować przed publikacją

### 1. Numer telefonu i adres

Skonfigurowane: **507 166 498** (`+48507166498`), adres **Borzęta 282**, 32-400 Myślenice. Przy zmianie edytuj sekcję Kontakt i JSON-LD w `index.html`.

### 2. Formularz Formspree

1. Załóż konto na [formspree.io](https://formspree.io).
2. Utwórz nowy formularz i skopiuj adres `https://formspree.io/f/xxxxxxxx`.
3. W `index.html` zamień `action="https://formspree.io/f/XXXXX"` na swój adres.
4. W panelu Formspree ustaw e-mail odbiorcy na `kontakt@stolarniapilch.pl`.

Uwaga: załączniki plików mogą wymagać płatnego planu Formspree — pole pozostaje w formularzu; w razie problemów klienci mogą dosłać zdjęcia mailem.

### 3. Zdjęcia

Zamień pliki w `assets/images/` na własne zdjęcia realizacji (format WebP lub JPG, szerokość ok. 1200–1920 px). Zachowaj nazwy plików lub zaktualizuj ścieżki w `index.html`.

### 4. Domena i SEO

- Wgraj cały folder na hosting (Netlify, Cloudflare Pages, hosting u dostawcy domeny).
- W `sitemap.xml`, `robots.txt` i meta `canonical` ustaw docelową domenę (obecnie `stolarniapilch.pl`).
- Zgłoś stronę w [Google Search Console](https://search.google.com/search-console).

## Struktura

- `index.html` — strona główna (9 sekcji)
- `css/style.css` — style
- `js/main.js` — menu mobilne, smooth scroll, walidacja i wysyłka formularza
- `polityka-prywatnosci.html` — polityka RODO
- `assets/images/` — zdjęcia hero i galerii

## Frazy SEO (naturalnie w treści)

- stolarnia Borzęta
- stolarnia Myślenice
- okna drewniane Myślenice
- drzwi drewniane Myślenice
- wyroby drewniane na zamówienie
