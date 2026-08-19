# Аудит кэширования данных (Vue SPA)

Дата: 2026-08-19  
Репозиторий: `win-predict-ai`  
Связанный issue: [#47](https://github.com/onlyzoran/win-predict-ai/issues/47)

## Краткий вывод

Приложение загружает данные через `fetch` из двух origin: **admin API** (manifest лиг, каталог спортов) и **GitHub Pages / `win-predict-ai-data`** (прогнозы, история, contest-файлы). Явное кэширование на клиенте **минимальное**: два in-memory `Map` в `leagueData.ts` для contest metadata. Остальные источники запрашиваются заново при каждом монтировании composable или навигации. **TTL, persist между сессиями и dedup параллельных запросов отсутствуют.** Retry есть только для части JSON через `fetchJsonWithRetry` (2 попытки).

Рекомендация: **вариант B** — централизованный слой кэша с dedup in-flight и `staleTime` (TanStack Query Vue или тонкая обёртка над `leagueData.ts`). Это закрывает основные UX-проблемы (повторная загрузка manifest, дубли при параллельных запросах) без сложности Service Worker.

---

## Карта источников данных

| Источник | URL / путь | Env | Загрузчик | Retry |
| --- | --- | --- | --- | --- |
| Manifest лиг | `VITE_LEAGUES_URL` или `{DATA_BASE}/leagues.json` | API / Pages | `fetchLeaguesManifest` | нет |
| Legacy прогноз | `{DATA_BASE}/{config.file}` | Pages | `fetchJsonWithRetry` | 2×, 400 ms × attempt |
| Contest прогноз | `{DATA_BASE}/{contestPath}/predictions/latest.json` | Pages | `fetchJsonWithRetry` | да |
| Contest facts (standings) | `{contestPath}/facts/latest.json` | Pages | `fetchJsonOptional` → `fetchJson` | нет |
| Contest participants | `{contestPath}/participants.json` | Pages | `fetchContestParticipants` | да (через retry) |
| Contest facts index | `{contestPath}/facts/index.json` | Pages | `fetchContestFactsIndex` | да |
| Legacy history index | `history/{id}/days.json` | Pages | `fetchJson` | нет |
| Legacy history snapshot | `history/{id}/{date}.json`, `latest.json` | Pages | `fetchJson` | нет |
| Contest history snapshot | `{contestPath}/facts/standings/...` | Pages | `fetchJson` | нет |
| Каталог спортов | `VITE_SPORTS_URL` | API | `fetchSportsCatalog` | нет |

Базовые константы и кэши — `src/lib/leagueData.ts`, спорт — `src/lib/sportsData.ts`.

---

## Что уже кэшируется

### In-memory Map (сессия SPA, без TTL)

```37:38:src/lib/leagueData.ts
const contestFactsIndexCache = new Map<string, ContestFactsIndex>()
const contestParticipantsCache = new Map<string, ContestParticipantsFile>()
```

- Ключ: нормализованный `contestPath`.
- Попадает в кэш после первого успешного fetch; живёт до перезагрузки вкладки.
- Используется при загрузке contest league, history index и history snapshots (participants/index переиспользуются).
- **Не кэшируются:** `predictions/latest.json`, `facts/latest.json`, отдельные dated snapshots.

### Retry (частичный)

```34:35:src/lib/leagueData.ts
const LEAGUE_FETCH_ATTEMPTS = 2
const RETRY_DELAY_MS = 400
```

`fetchJsonWithRetry` — линейная задержка `400 × attempt` ms, только для payload лиг (legacy file, contest prediction/participants/index). Manifest, sports, history snapshots — **без retry**.

### Persist (localStorage) — только UI-состояние

| Ключ | Composable | Назначение |
| --- | --- | --- |
| `pinnedTournaments` | `usePinnedTournaments` | Закреплённые турниры |
| `tournamentSort` | `HomeView` (`useStorage`) | Режим сортировки |
| `locale` | `i18n` | Язык |

Данные прогнозов/истории **не** сохраняются между сессиями.

### HTTP-кэш браузера / CDN

Приложение **не задаёт** `Cache-Control` и не использует Service Worker. Поведение зависит от заголовков API (VPS) и GitHub Pages. Для статического JSON на Pages возможен неявный кэш браузера, но это **не контролируется** клиентским кодом и не документировано.

---

## Composables: поведение при монтировании и навигации

### `useLeagues` (`HomeView`)

- `onMounted`: один fetch manifest → слоты без данных → батчевая подгрузка через `loadNextBatch`.
- Состояние (`slots`, `configs`) **локально composable**; при уходе с `/` (переход на `/tournament/:id`) компонент размонтируется — **весь прогресс теряется**.
- Повторный заход на главную = новый manifest + повторная загрузка всех видимых лиг.
- Retry на уровне UI: `retryFailed()` для упавших лиг (повторный `loadLeaguePayload`, не manifest).

### `useLeague` (`TournamentView`)

- `onMounted` + `watch(id)`: каждый раз `loadLeagueById`.
- `loadLeagueById` **снова fetch'ит manifest** (`fetchLeaguesManifest`), затем payload лиги — даже если пользователь только что видел эту лигу на главной.
- Кэша результата `League` нет.

### `useSports` (`SportFilter` на главной)

- `onMounted`: fetch каталога; при ошибке — `FALLBACK_SPORTS` из кода.
- Каждый mount `SportFilter` = новый запрос (при remount HomeView — снова fetch).
- Нет shared state между экземплярами.

### `useLeagueHistoryRanks` (`TournamentDetails`, только full view с `showChart`)

- Загружает `days.json` / contest facts index, затем до **40** snapshots (`sampleHistoryDates`).
- При смене `leagueId` / `contestPath` — полная перезагрузка серии.
- Contest index/participants берутся из Map-кэша; **каждый snapshot — новый fetch**.
- Preview sheet на главной (`compact`, без `leagueId`) — composable **не активен**, history не грузится.

---

## Пробелы по критериям

| Критерий | Состояние |
| --- | --- |
| TTL / устаревание | ❌ нет |
| Persist между сессиями | ❌ только UI prefs |
| Dedup параллельных запросов | ❌ два одновременных `loadLeagueById('epl')` → два manifest + два payload |
| Кэш manifest | ❌ |
| Кэш league payload (legacy/contest) | ❌ |
| Кэш sports catalog | ❌ |
| Кэш history snapshots | ❌ |
| Retry единообразный | ⚠️ только payload лиг, 2 попытки |
| Offline | ❌ |
| Keep-alive / shared store | ❌ `RouterView` без `keep-alive`, Pinia/Vuex нет |

---

## Сценарии навигации (UX)

1. **Главная → турнир → назад:** manifest загружается **3 раза** (home mount, tournament mount, home remount); payload лиги — минимум **2 раза** (home batch + tournament).
2. **Два быстрых клика по разным турнирам:** два параллельных manifest fetch.
3. **Contest лига с графиком рангов:** participants + index из Map; ~40 snapshot JSON — каждый раз при открытии страницы турнира.
4. **Обновление данных в admin:** manifest на API без клиентского TTL подхватывается при следующем fetch (хорошо для актуальности, плохо для трафика без stale-while-revalidate).

---

## Варианты улучшения

### A. Расширить in-memory слой в `leagueData.ts`

**Суть:** module-level `Map` + `Map<string, Promise<T>>` для in-flight dedup; кэш manifest, sports, `loadLeaguePayload` по ключу `leagueId`, history days/snapshots по `(leagueId, date)`; опционально `staleTime` (например 60 s manifest, 5 min static JSON).

| | |
| --- | --- |
| Объём работ | **Низкий** (~150–250 строк, без новых deps) |
| Актуальность | Настраиваемый TTL; ручной `invalidate()` при необходимости |
| Offline | Только в рамках текущей вкладки до reload |
| UX | Мгновенный возврат на главную/турнир в сессии; нет дублирующих parallel fetch |
| Риски | Рост памяти при большом числе лиг; нужны тесты на dedup и invalidation |

### B. TanStack Query Vue (`@tanstack/vue-query`)

**Суть:** queries для manifest, league, sports, history; встроенные `staleTime`, `gcTime`, dedup, `placeholderData`, фоновый refetch.

| | |
| --- | --- |
| Объём работ | **Средний** (новая dep, рефактор composables, провайдер в `main.ts`, тесты) |
| Актуальность | `staleTime` + `refetchOnWindowFocus` — гибко |
| Offline | Базово in-memory; опционально persist plugin → localStorage/IndexedDB |
| UX | Лучший стандарт: loading/error/retry, dedup, фоновое обновление без мигания |
| Риски | Размер бандла (+~12 kB gzip); команда должна знать паттерн queries |

### C. Service Worker (Workbox) + HTTP Cache-Control на origin

**Суть:** SW кэширует GET к `VITE_DATA_BASE_URL` (cache-first для versioned JSON); API manifest — network-first с коротким TTL на сервере.

| | |
| --- | --- |
| Объём работ | **Высокий** (SW, deploy pipeline, согласование заголовков API/Pages) |
| Актуальность | Зависит от стратегии SW и CDN; риск stale predictions |
| Offline | **Да** для закэшированного static JSON |
| UX | Быстрый repeat visit после первой загрузки; сложнее отладка |
| Риски | Invalidation contest/latest; два origin; не решает dedup manifest внутри SPA без доп. слоя |

---

## Сравнение и рекоминация

| Критерий | A in-memory | B Vue Query | C Service Worker |
| --- | --- | --- | --- |
| Объём работ | ★★☆ | ★★★ | ★☆☆ |
| Dedup parallel | ✅ | ✅ | частично |
| Persist reload | ❌ | опционально | ✅ static |
| Актуальность manifest | TTL вручную | staleTime | network-first |
| Offline | ❌ | опционально | ✅ |
| Поддерживаемость | проще, но свой код | экосистема | infra-heavy |

**Рекомендация: вариант B** (TanStack Query Vue) как целевой — покрывает dedup, stale-while-revalidate, единый retry/refetch и путь к persist. Если нужен **минимальный быстрый win** без новых зависимостей — начать с **варианта A** (manifest + league payload + in-flight dedup), затем мигрировать на B.

**Не рекомендуется** начинать с C без явной product-задачи offline: высокая стоимость, слабый эффект на in-session навигацию.

---

## Чеклист для реализации (вне scope этого PR)

- [ ] Кэш manifest + dedup `fetchLeaguesManifest`
- [ ] Кэш `loadLeaguePayload` / `loadLeagueById` по `leagueId`
- [ ] Кэш sports catalog (shared, один fetch на сессию)
- [ ] Кэш history: `days.json` + snapshots по `(source, date)`
- [ ] Единая политика retry (3× с backoff?) или делегирование Query
- [ ] `staleTime`: manifest 30–60 s, static JSON 5–15 min (уточнить с product)
- [ ] Тесты: dedup, stale hit, navigation без лишних fetch (mock `fetch`)
- [ ] Документировать ожидания от `Cache-Control` на API

---

## Связанные файлы

| Файл | Роль |
| --- | --- |
| `src/lib/leagueData.ts` | fetch, retry, contest Map cache, orchestration |
| `src/lib/sportsData.ts` | sports catalog |
| `src/lib/contestData.ts` | трансформации contest JSON (без I/O) |
| `src/composables/useLeagues.ts` | главная, батчи |
| `src/composables/useLeague.ts` | страница турнира |
| `src/composables/useSports.ts` | фильтр спортов |
| `src/composables/useLeagueHistoryRanks.ts` | график рангов |
| `src/views/HomeView.vue` | триггеры batch load |
| `src/views/TournamentView.vue` | `useLeague` |
| `src/components/TournamentDetails.vue` | `useLeagueHistoryRanks` |
