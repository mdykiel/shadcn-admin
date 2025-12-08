# Budzeto - Asystent Księgowy Budżetówki

Aplikacja webowa do nauki i praktyki księgowości w jednostkach sektora finansów publicznych. Umożliwia użytkownikom tworzenie wirtualnych jednostek budżetowych, definiowanie planów kont, klasyfikacji budżetowej, rejestrowanie operacji gospodarczych i generowanie sprawozdań.

## 📋 Funkcjonalności

### Zarządzanie jednostkami
- Tworzenie i zarządzanie jednostkami budżetowymi (JST, jednostki budżetowe, zakłady budżetowe)
- Obsługa wielu jednostek na jednym koncie użytkownika
- Przełączanie między jednostkami

### Plan kont księgowych
- **Wzorcowe plany kont** zgodne z Rozporządzeniem Ministra Finansów (Dz.U. 2020 poz. 342):
  - Jednostka budżetowa (Załącznik nr 3) - zespoły 0-8
  - Samorządowy zakład budżetowy
  - JST - Budżet organu (Załącznik nr 2) - zespoły 1, 2, 9
- **Inicjalizacja z szablonu** - szybkie tworzenie planu kont na podstawie wzorca
- **Hierarchia kont** - konta syntetyczne i analityczne (dwupoziomowa analityka)
- **Łatwe dodawanie analityki** - automatyczne proponowanie następnego numeru
- **Kopiowanie planu kont** między okresami obrachunkowymi
- **Kopiowanie kont** do innych dzienników
- **Zbiorcze operacje** - usuwanie, aktywacja/dezaktywacja wielu kont
- **Eksport do Excel/JSON**

### Dzienniki księgowań
- Tworzenie dzienników cząstkowych
- Rejestrowanie operacji gospodarczych
- Kontrola bilansowania zapisów

### Okresy obrachunkowe
- Zarządzanie latami/okresami obrachunkowymi
- Przenoszenie planów kont między okresami

### Klasyfikacja budżetowa
- Działy, rozdziały, paragrafy
- Zgodność z obowiązującą klasyfikacją

### Sprawozdawczość (planowane)
- Bilans jednostki
- Rachunek zysków i strat
- Sprawozdania budżetowe (Rb-27S, Rb-28S)

## 🛠 Tech Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **UI Components:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Tables:** [TanStack Table](https://tanstack.com/table/latest)
- **Icons:** [Lucide Icons](https://lucide.dev/icons/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Auth:** JWT + bcrypt

## 🚀 Uruchomienie lokalne

### Wymagania
- Node.js 18+
- PostgreSQL 14+
- pnpm (lub npm/yarn)

### Instalacja

1. Sklonuj repozytorium:
\`\`\`bash
git clone https://github.com/bizneto/budzeto.git
cd budzeto
\`\`\`

2. Zainstaluj zależności:
\`\`\`bash
# Frontend
pnpm install

# Backend
cd server
pnpm install
\`\`\`

3. Skonfiguruj bazę danych:
\`\`\`bash
# Utwórz plik .env w katalogu server/
cp server/.env.example server/.env

# Edytuj DATABASE_URL w server/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/budzeto"
\`\`\`

4. Zainicjuj bazę danych:
\`\`\`bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
\`\`\`

5. Uruchom aplikację:
\`\`\`bash
# Terminal 1 - Backend (port 3001)
cd server
pnpm run dev

# Terminal 2 - Frontend (port 5173)
pnpm run dev
\`\`\`

6. Otwórz http://localhost:5173

### Domyślne konto
- Email: admin@example.com
- Hasło: admin123

## 📁 Struktura projektu

\`\`\`
budzeto/
├── src/                    # Frontend React
│   ├── components/         # Komponenty UI
│   ├── features/           # Moduły funkcjonalne
│   │   ├── accounts/       # Plan kont
│   │   ├── journals/       # Dzienniki
│   │   ├── fiscal-periods/ # Okresy obrachunkowe
│   │   └── units/          # Jednostki budżetowe
│   ├── services/           # API clients
│   ├── store/              # Zustand stores
│   └── routes/             # TanStack Router routes
├── server/                 # Backend Express
│   ├── src/
│   │   ├── controllers/    # Kontrolery HTTP
│   │   ├── services/       # Logika biznesowa
│   │   ├── routes/         # Definicje tras
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   └── data/           # Dane statyczne (szablony)
│   └── prisma/
│       ├── schema.prisma   # Model danych
│       └── seed.ts         # Dane początkowe
└── Rozporzadzenie.md       # Wzorcowy plan kont z rozporządzenia
\`\`\`

## 📜 Podstawa prawna

Aplikacja opiera się na:
- **Rozporządzenie Ministra Rozwoju i Finansów z dnia 13 września 2017 r.** w sprawie rachunkowości oraz planów kont dla budżetu państwa, budżetów jednostek samorządu terytorialnego, jednostek budżetowych, samorządowych zakładów budżetowych, państwowych funduszy celowych oraz państwowych jednostek budżetowych mających siedzibę poza granicami Rzeczypospolitej Polskiej (Dz.U. 2020 poz. 342 - tekst jednolity)

## �� Współpraca

Projekt jest w fazie rozwoju. Zachęcamy do:
- Zgłaszania błędów (Issues)
- Propozycji nowych funkcji
- Pull requestów

## 📄 Licencja

MIT License - szczegóły w pliku [LICENSE](LICENSE)
