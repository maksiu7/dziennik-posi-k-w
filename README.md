# Planer posiłków

Aplikacja do planowania posiłków (PWA). Działa w przeglądarce i po dodaniu do ekranu początkowego iPhone'a.

## 1. Hosting na GitHub Pages
1. Wgraj wszystkie pliki z tego folderu do repozytorium (na poziom główny, nie do podfolderu).
2. Settings -> Pages -> Source: Deploy from a branch -> Branch: main, folder: / (root) -> Save.
3. Po minucie strona działa pod adresem https://TWOJA-NAZWA.github.io/NAZWA-REPOZYTORIUM/
4. Na iPhonie otwórz ten adres w Safari -> Udostępnij -> Dodaj do ekranu początkowego.

Dane są zapisane w przeglądarce telefonu. Przed aktualizacją lub zmianą adresu zrób kopię w Ustawieniach -> Kopia zapasowa.

## 2. Serwer AI (asystent AI, skaner etykiet) - darmowy serwer na Cloudflare
Aplikacja z GitHuba nie może sama łączyć się z AI, bo klucz nie może leżeć w publicznym kodzie. Dlatego potrzebny jest mały serwer pośredniczący (plik serwer-ai/worker.js).

1. Załóż darmowe konto na cloudflare.com.
2. Workers & Pages -> Create -> Create Worker. Nazwa np. planer-ai. Kliknij Deploy.
3. Edit code -> usuń cały kod, wklej zawartość pliku serwer-ai/worker.js -> Deploy.
4. Klucz AI (darmowy): wejdź na aistudio.google.com/apikey i utwórz klucz API (Gemini).
5. W Workerze: Settings -> Variables and Secrets -> Add:
   - GEMINI_API_KEY (typ Secret) - wklej klucz z kroku 4,
   - APP_KEY (typ Secret) - wymyśl własne hasło (to samo wpiszesz w aplikacji),
   - ALLOWED_ORIGIN (opcjonalnie, zwykły tekst) - np. https://TWOJA-NAZWA.github.io (bez ukośnika na końcu).
6. Skopiuj adres Workera (https://planer-ai.TWOJE-KONTO.workers.dev).
7. W aplikacji: Ustawienia -> Serwer AI -> wklej adres i hasło -> Zapisz -> Przetestuj.

Uwagi:
- Limity darmowego planu Gemini ustala Google i mogą się zmieniać. Nazwy modeli też. Jeśli test zgłosi błąd modelu, dodaj zmienną GEMINI_MODEL z aktualną nazwą modelu Flash z AI Studio.
- Na darmowym planie Google może wykorzystywać wysyłane dane do ulepszania swoich produktów. Wysyłasz tam opisy posiłków i zdjęcia etykiet.
- Zamiast Gemini możesz użyć Claude (płatne, rozliczane za zużycie): ustaw sekret ANTHROPIC_API_KEY zamiast GEMINI_API_KEY.
