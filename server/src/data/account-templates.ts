/**
 * Wzorcowe plany kont zgodne z Rozporządzeniem Ministra Rozwoju i Finansów
 * z dnia 13 września 2017 r. (Dz.U. 2020 poz. 342)
 * 
 * Typy jednostek:
 * - JST - Jednostka Samorządu Terytorialnego (budżet organu) - Załącznik nr 2
 * - JEDNOSTKA_BUDZETOWA - Jednostka budżetowa - Załącznik nr 3
 * - ZAKLAD_BUDZETOWY - Samorządowy zakład budżetowy - Załącznik nr 3
 */

export type UnitType = 'JST' | 'JEDNOSTKA_BUDZETOWA' | 'ZAKLAD_BUDZETOWY';

export interface AccountTemplate {
  number: string;
  name: string;
  zespol: number;
  isSynthetic: boolean;
  description?: string;
}

/**
 * Plan kont dla budżetów jednostek samorządu terytorialnego (Załącznik nr 2)
 * Konta organu finansowego - budżet gminy/powiatu/województwa
 */
export const JST_ACCOUNTS: AccountTemplate[] = [
  // Zespół 1 - Środki pieniężne i rachunki bankowe
  { number: '133', name: 'Rachunek budżetu', zespol: 1, isSynthetic: true },
  { number: '134', name: 'Kredyty bankowe', zespol: 1, isSynthetic: true },
  { number: '135', name: 'Rachunek środków na niewygasające wydatki', zespol: 1, isSynthetic: true },
  { number: '140', name: 'Środki pieniężne w drodze', zespol: 1, isSynthetic: true },
  
  // Zespół 2 - Rozrachunki i rozliczenia
  { number: '222', name: 'Rozliczenie dochodów budżetowych', zespol: 2, isSynthetic: true },
  { number: '223', name: 'Rozliczenie wydatków budżetowych', zespol: 2, isSynthetic: true },
  { number: '224', name: 'Rozrachunki budżetu', zespol: 2, isSynthetic: true },
  { number: '225', name: 'Rozliczenie niewygasających wydatków', zespol: 2, isSynthetic: true },
  { number: '240', name: 'Pozostałe rozrachunki', zespol: 2, isSynthetic: true },
  { number: '250', name: 'Należności finansowe', zespol: 2, isSynthetic: true },
  { number: '260', name: 'Zobowiązania finansowe', zespol: 2, isSynthetic: true },
  { number: '290', name: 'Odpisy aktualizujące należności', zespol: 2, isSynthetic: true },
  
  // Zespół 9 - Fundusze, rezerwy i wynik finansowy
  { number: '901', name: 'Dochody budżetu', zespol: 9, isSynthetic: true },
  { number: '902', name: 'Wydatki budżetu', zespol: 9, isSynthetic: true },
  { number: '903', name: 'Niewykonane wydatki', zespol: 9, isSynthetic: true },
  { number: '904', name: 'Niewygasające wydatki', zespol: 9, isSynthetic: true },
  { number: '909', name: 'Rozliczenia międzyokresowe', zespol: 9, isSynthetic: true },
  { number: '960', name: 'Skumulowane wyniki budżetu', zespol: 9, isSynthetic: true },
  { number: '961', name: 'Wynik wykonania budżetu', zespol: 9, isSynthetic: true },
  { number: '962', name: 'Wynik na pozostałych operacjach', zespol: 9, isSynthetic: true },
  { number: '968', name: 'Prywatyzacja', zespol: 9, isSynthetic: true },
  
  // Konta pozabilansowe
  { number: '991', name: 'Planowane dochody budżetu', zespol: 9, isSynthetic: true },
  { number: '992', name: 'Planowane wydatki budżetu', zespol: 9, isSynthetic: true },
  { number: '993', name: 'Rozliczenia z innymi budżetami', zespol: 9, isSynthetic: true },
];

/**
 * Plan kont dla jednostek budżetowych i samorządowych zakładów budżetowych (Załącznik nr 3)
 * Pełny plan kont z zespołami 0-8 + konta pozabilansowe
 */
export const JEDNOSTKA_BUDZETOWA_ACCOUNTS: AccountTemplate[] = [
  // Zespół 0 - Aktywa trwałe
  { number: '011', name: 'Środki trwałe', zespol: 0, isSynthetic: true },
  { number: '013', name: 'Pozostałe środki trwałe', zespol: 0, isSynthetic: true },
  { number: '014', name: 'Zbiory biblioteczne', zespol: 0, isSynthetic: true },
  { number: '015', name: 'Mienie zlikwidowanych jednostek', zespol: 0, isSynthetic: true },
  { number: '016', name: 'Dobra kultury', zespol: 0, isSynthetic: true },
  { number: '017', name: 'Sprzęt wojskowy', zespol: 0, isSynthetic: true },
  { number: '020', name: 'Wartości niematerialne i prawne', zespol: 0, isSynthetic: true },
  { number: '030', name: 'Długoterminowe aktywa finansowe', zespol: 0, isSynthetic: true },
  { number: '071', name: 'Umorzenie środków trwałych oraz wartości niematerialnych i prawnych', zespol: 0, isSynthetic: true },
  { number: '072', name: 'Umorzenie pozostałych środków trwałych, wartości niematerialnych i prawnych oraz zbiorów bibliotecznych', zespol: 0, isSynthetic: true },
  { number: '073', name: 'Odpisy aktualizujące długoterminowe aktywa finansowe', zespol: 0, isSynthetic: true },
  { number: '077', name: 'Umorzenie sprzętu wojskowego', zespol: 0, isSynthetic: true },
  { number: '080', name: 'Środki trwałe w budowie (inwestycje)', zespol: 0, isSynthetic: true },
  
  // Zespół 1 - Środki pieniężne i rachunki bankowe
  { number: '101', name: 'Kasa', zespol: 1, isSynthetic: true },
  { number: '130', name: 'Rachunek bieżący jednostki', zespol: 1, isSynthetic: true },
  { number: '131', name: 'Rachunek bieżący samorządowych zakładów budżetowych', zespol: 1, isSynthetic: true },
  { number: '132', name: 'Rachunek dochodów jednostek budżetowych', zespol: 1, isSynthetic: true },
  { number: '134', name: 'Kredyty bankowe', zespol: 1, isSynthetic: true },
  { number: '135', name: 'Rachunek środków funduszy specjalnego przeznaczenia', zespol: 1, isSynthetic: true },
  { number: '136', name: 'Rachunek państwowych funduszy celowych', zespol: 1, isSynthetic: true },
  { number: '137', name: 'Rachunek środków pochodzących ze źródeł zagranicznych niepodlegających zwrotowi', zespol: 1, isSynthetic: true },
  { number: '138', name: 'Rachunek środków europejskich', zespol: 1, isSynthetic: true },
  { number: '139', name: 'Inne rachunki bankowe', zespol: 1, isSynthetic: true },
  { number: '140', name: 'Krótkoterminowe aktywa finansowe', zespol: 1, isSynthetic: true },
  { number: '141', name: 'Środki pieniężne w drodze', zespol: 1, isSynthetic: true },
  
  // Zespół 2 - Rozrachunki i rozliczenia
  { number: '201', name: 'Rozrachunki z odbiorcami i dostawcami', zespol: 2, isSynthetic: true },
  { number: '221', name: 'Należności z tytułu dochodów budżetowych', zespol: 2, isSynthetic: true },
  { number: '222', name: 'Rozliczenie dochodów budżetowych', zespol: 2, isSynthetic: true },
  { number: '223', name: 'Rozliczenie wydatków budżetowych', zespol: 2, isSynthetic: true },
  { number: '224', name: 'Rozliczenie dotacji budżetowych oraz płatności z budżetu środków europejskich', zespol: 2, isSynthetic: true },
  { number: '225', name: 'Rozrachunki z budżetami', zespol: 2, isSynthetic: true },
  { number: '226', name: 'Długoterminowe należności budżetowe', zespol: 2, isSynthetic: true },
  { number: '227', name: 'Rozliczenie wydatków z budżetu środków europejskich', zespol: 2, isSynthetic: true },
  { number: '228', name: 'Rozliczenie środków pochodzących ze źródeł zagranicznych niepodlegających zwrotowi', zespol: 2, isSynthetic: true },
  { number: '229', name: 'Pozostałe rozrachunki publicznoprawne', zespol: 2, isSynthetic: true },
  { number: '230', name: 'Rozliczenia z budżetem środków europejskich', zespol: 2, isSynthetic: true },
  { number: '231', name: 'Rozrachunki z tytułu wynagrodzeń', zespol: 2, isSynthetic: true },
  { number: '234', name: 'Pozostałe rozrachunki z pracownikami', zespol: 2, isSynthetic: true },
  { number: '235', name: 'Rozliczenia dochodów budżetowych z tytułu podatków', zespol: 2, isSynthetic: true },
  { number: '240', name: 'Pozostałe rozrachunki', zespol: 2, isSynthetic: true },
  { number: '245', name: 'Wpływy do wyjaśnienia', zespol: 2, isSynthetic: true },
  { number: '290', name: 'Odpisy aktualizujące należności', zespol: 2, isSynthetic: true },
  
  // Zespół 3 - Materiały i towary
  { number: '300', name: 'Rozliczenie zakupu', zespol: 3, isSynthetic: true },
  { number: '310', name: 'Materiały', zespol: 3, isSynthetic: true },
  { number: '330', name: 'Towary', zespol: 3, isSynthetic: true },
  { number: '340', name: 'Odchylenia od cen ewidencyjnych materiałów i towarów', zespol: 3, isSynthetic: true },
  
  // Zespół 4 - Koszty według rodzajów i ich rozliczenie
  { number: '400', name: 'Amortyzacja', zespol: 4, isSynthetic: true },
  { number: '401', name: 'Zużycie materiałów i energii', zespol: 4, isSynthetic: true },
  { number: '402', name: 'Usługi obce', zespol: 4, isSynthetic: true },
  { number: '403', name: 'Podatki i opłaty', zespol: 4, isSynthetic: true },
  { number: '404', name: 'Wynagrodzenia', zespol: 4, isSynthetic: true },
  { number: '405', name: 'Ubezpieczenia społeczne i inne świadczenia', zespol: 4, isSynthetic: true },
  { number: '409', name: 'Pozostałe koszty rodzajowe', zespol: 4, isSynthetic: true },
  { number: '490', name: 'Rozliczenie kosztów', zespol: 4, isSynthetic: true },
  
  // Zespół 5 - Koszty według typów działalności i ich rozliczenie
  { number: '500', name: 'Koszty działalności podstawowej', zespol: 5, isSynthetic: true },
  { number: '530', name: 'Koszty działalności pomocniczej', zespol: 5, isSynthetic: true },
  { number: '550', name: 'Koszty zarządu', zespol: 5, isSynthetic: true },
  { number: '580', name: 'Rozliczenie kosztów działalności', zespol: 5, isSynthetic: true },
  
  // Zespół 6 - Produkty
  { number: '600', name: 'Produkty gotowe i półfabrykaty', zespol: 6, isSynthetic: true },
  { number: '620', name: 'Odchylenia od cen ewidencyjnych produktów', zespol: 6, isSynthetic: true },
  { number: '640', name: 'Rozliczenia międzyokresowe kosztów', zespol: 6, isSynthetic: true },
  
  // Zespół 7 - Przychody, dochody i koszty
  { number: '700', name: 'Sprzedaż produktów i koszt ich wytworzenia', zespol: 7, isSynthetic: true },
  { number: '720', name: 'Przychody z tytułu dochodów budżetowych', zespol: 7, isSynthetic: true },
  { number: '730', name: 'Sprzedaż towarów i wartość ich zakupu', zespol: 7, isSynthetic: true },
  { number: '740', name: 'Dotacje i środki na inwestycje', zespol: 7, isSynthetic: true },
  { number: '750', name: 'Przychody finansowe', zespol: 7, isSynthetic: true },
  { number: '751', name: 'Koszty finansowe', zespol: 7, isSynthetic: true },
  { number: '760', name: 'Pozostałe przychody operacyjne', zespol: 7, isSynthetic: true },
  { number: '761', name: 'Pozostałe koszty operacyjne', zespol: 7, isSynthetic: true },

  // Zespół 8 - Fundusze, rezerwy i wynik finansowy
  { number: '800', name: 'Fundusz jednostki', zespol: 8, isSynthetic: true },
  { number: '810', name: 'Dotacje budżetowe, płatności z budżetu środków europejskich oraz środki z budżetu na inwestycje', zespol: 8, isSynthetic: true },
  { number: '820', name: 'Rozliczenie wyniku finansowego', zespol: 8, isSynthetic: true },
  { number: '840', name: 'Rezerwy i rozliczenia międzyokresowe przychodów', zespol: 8, isSynthetic: true },
  { number: '851', name: 'Zakładowy fundusz świadczeń socjalnych', zespol: 8, isSynthetic: true },
  { number: '853', name: 'Fundusze celowe', zespol: 8, isSynthetic: true },
  { number: '855', name: 'Fundusz mienia zlikwidowanych jednostek', zespol: 8, isSynthetic: true },
  { number: '860', name: 'Wynik finansowy', zespol: 8, isSynthetic: true },
  { number: '870', name: 'Podatki i obowiązkowe rozliczenia z budżetem obciążające wynik finansowy', zespol: 8, isSynthetic: true },

  // Konta pozabilansowe (zespół 9)
  { number: '970', name: 'Płatności ze środków europejskich', zespol: 9, isSynthetic: true },
  { number: '976', name: 'Wzajemne rozliczenia między jednostkami', zespol: 9, isSynthetic: true },
  { number: '980', name: 'Plan finansowy wydatków budżetowych', zespol: 9, isSynthetic: true },
  { number: '981', name: 'Plan finansowy niewygasających wydatków', zespol: 9, isSynthetic: true },
  { number: '982', name: 'Plan wydatków środków europejskich', zespol: 9, isSynthetic: true },
  { number: '983', name: 'Zaangażowanie wydatków środków europejskich roku bieżącego', zespol: 9, isSynthetic: true },
  { number: '984', name: 'Zaangażowanie wydatków środków europejskich przyszłych lat', zespol: 9, isSynthetic: true },
  { number: '985', name: 'Zaangażowanie środków samorządowych zakładów budżetowych', zespol: 9, isSynthetic: true },
  { number: '990', name: 'Plan finansowy wydatków budżetowych w układzie zadaniowym', zespol: 9, isSynthetic: true },
  { number: '992', name: 'Zapewnienia finansowania lub dofinansowania z budżetu państwa', zespol: 9, isSynthetic: true },
  { number: '998', name: 'Zaangażowanie wydatków budżetowych roku bieżącego', zespol: 9, isSynthetic: true },
  { number: '999', name: 'Zaangażowanie wydatków budżetowych przyszłych lat', zespol: 9, isSynthetic: true },
];

/**
 * Plan kont dla samorządowych zakładów budżetowych (Załącznik nr 3)
 * Taki sam jak dla jednostek budżetowych, ale z innymi kontami rachunków bankowych
 */
export const ZAKLAD_BUDZETOWY_ACCOUNTS: AccountTemplate[] = JEDNOSTKA_BUDZETOWA_ACCOUNTS;

/**
 * Pobiera szablon planu kont dla danego typu jednostki
 */
export function getAccountTemplateForUnitType(unitType: UnitType): AccountTemplate[] {
  switch (unitType) {
    case 'JST':
      return JST_ACCOUNTS;
    case 'JEDNOSTKA_BUDZETOWA':
      return JEDNOSTKA_BUDZETOWA_ACCOUNTS;
    case 'ZAKLAD_BUDZETOWY':
      return ZAKLAD_BUDZETOWY_ACCOUNTS;
    default:
      return JEDNOSTKA_BUDZETOWA_ACCOUNTS;
  }
}

/**
 * Dostępne typy jednostek z etykietami
 */
export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  JST: 'Jednostka Samorządu Terytorialnego (budżet organu)',
  JEDNOSTKA_BUDZETOWA: 'Jednostka budżetowa',
  ZAKLAD_BUDZETOWY: 'Samorządowy zakład budżetowy',
};

