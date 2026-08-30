# Аудит кэширования данных (Vue SPA)

Дата: 2026-08-19  
Репозиторий: `win-predict-ai`  
Связанный issue: [#47](https://github.com/onlyzoran/win-predict-ai/issues/47)

## Краткий вывод

Приложение загружает данные через `fetch` из двух origin: **admin API** (manifest лиг, каталог спортов) и **GitHub Pages / `win-predict-ai-data`** (прогнозы, история, contest-файлы).

**Реализовано (вариант B):** TanStack Query Vue — shared in-memory кэш с `staleTime`, dedup параллельных запросов и stale-while-revalidate для manifest, league payload, sports catalog, history days/snapshots. Конфигурация — `src/lib/queryClient.ts`, ключи — `src/lib/queryKeys.ts`, fetch-обёртки — `src/lib/dataQueries.ts`.

**Дополнительно:** два in-memory `Map` в `leagueData.ts` для contest participants/facts index внутри цепочки fetch.

**Остаётся вне scope:** persist между сессиями (localStorage/IndexedDB), Service Worker, offline, явная документация `Cache-Control` на API.

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

### TanStack Query Vue (сессия SPA, с `staleTime`)

Провайдер — `main.ts` (`VueQueryPlugin` + `createQueryClient()`).

| Query key | Источник | `staleTime` | Где |
| --- | --- | --- | --- |
| `['manifest']` | `leagues.json` | 60 s | `useLeagues`, `useLeague` (через `fetchLeague`) |
| `['league', id]` | полный `League` | 3 h | `useLeague` |
| `['league-card', id]` | card payload | 3 h | `useLeagues` (батчи) |
| `['league-payload', id]` | raw payload | 3 h | `fetchLeague` |
| `['sports']` | sports catalog | 20 min | `useSports` |
| `['history-days', …]` | days.json / facts index | 3 h | `useLeagueHistoryRanks` |
| `['history-snapshot', …, date]` | dated snapshot | ∞ | `useLeagueHistoryRanks` |

- **Dedup:** параллельные запросы с одним query key → один in-flight fetch.
- **Stale-while-revalidate:** данные stale показываются сразу; фоновый refetch при mount/focus/reconnect (см. секцию «Как не показывать устаревшие данные»).
- **Retry:** `QueryClient` default `retry: 2` поверх fetch-слоя.

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

- Manifest через `useQuery` (`queryKeys.manifest`); при remount в пределах `staleTime` — **cache hit**, без повторного fetch.
- Card payload — `fetchLeagueCardTeams` → shared cache по `league-card` key; повторный батч той же лиги в сессии не дублирует fetch.
- Локальное состояние `slotOverrides` / `failedIds` — только UI-прогресс батча на текущем mount; league payload при этом уже в Query cache.
- Retry на уровне UI: `retryFailed()` для упавших лиг.

### `useLeague` (`TournamentView`)

- `useQuery` по `queryKeys.league(id)` → внутри `fetchLeague` отдельный fetch по `['league-payload', id]` (`loadLeaguePayload`).
- **Manifest** переиспользуется с главной (общий `queryKeys.manifest`). **Payload лиги с главной не переиспользуется:** Home кэширует card-данные по `['league-card', id]` (`loadLeagueCardPayload` — для contest это `predictions/card.json`, для legacy — тот же `{file}`, но другой query key), турнир — полный payload по `['league-payload', id]` (`loadLeaguePayload` — contest: `latest.json` + facts + participants; legacy: `{file}` + standings). При переходе home → tournament возможен **повторный fetch** тех же или других URL.
- Смена `id` — новый query key; возврат к ранее открытому турниру — cache hit по `league` / `league-payload`.
- `reload()` → `query.refetch()`.

### `useSports` (`SportFilter` на главной)

- `useQuery` (`queryKeys.sports`); один fetch на сессию, shared между remount.
- При ошибке — `FALLBACK_SPORTS`; `placeholderData` до первого ответа.

### `useLeagueHistoryRanks` (`TournamentDetails`, только full view с `showChart`)

- `days.json` / facts index — query с `staleTime` 3 h.
- Snapshots — отдельный query key на `(source, date)` с `staleTime: ∞`; повторное открытие турнира — cache hit на все dated файлы.
- Contest index/participants — дополнительно Map-кэш в `leagueData.ts`.
- Preview sheet (`compact`, без `leagueId`) — composable **не активен**.

---

## Пробелы по критериям

| Критерий | Состояние |
| --- | --- |
| TTL / устаревание | ✅ `staleTime` в Query (60 s – 3 h, snapshots ∞) |
| Persist между сессиями | ❌ только UI prefs; Query — in-memory |
| Dedup параллельных запросов | ✅ Query in-flight dedup |
| Кэш manifest | ✅ `queryKeys.manifest` |
| Кэш league payload (legacy/contest) | ✅ `league` / `league-card` / `league-payload` keys (раздельно) |
| Card ↔ full payload между home и tournament | ❌ разные keys; общий только manifest; возможен повторный fetch |
| Кэш sports catalog | ✅ `queryKeys.sports` |
| Кэш history snapshots | ✅ per-date keys, `staleTime: ∞` |
| Retry единообразный | ✅ Query default `retry: 2` + legacy `fetchJsonWithRetry` |
| Offline | ❌ |
| Keep-alive / shared store | ⚠️ `RouterView` без `keep-alive`; shared cache — QueryClient |
| Документация `Cache-Control` API | ❌ |

---

## Сценарии навигации (UX)

1. **Главная → турнир → назад (в пределах `staleTime`):** manifest **1 fetch** (shared `queryKeys.manifest`). Card payload на главной (`league-card`) и полный payload на турнире (`league-payload`) — **разные query keys**, между экранами **не переиспользуются**; при первом открытии турнира после card на главной — отдельный fetch (для contest — другие файлы: `card.json` vs `latest.json` + facts; для legacy — тот же `{file}` может запроситься повторно). При возврате на главную card payload берётся из cache `league-card`; при повторном заходе на тот же турнир — cache hit по `league` / `league-payload`.
2. **Два быстрых клика по разным турнирам:** manifest dedup — один in-flight fetch; payload — параллельно по разным keys.
3. **Contest лига с графиком рангов:** первое открытие — fetch snapshots; повторное в сессии — cache hit (dated keys ∞).
4. **Обновление данных в admin / после cron deploy:** stale data показывается сразу; фоновый refetch при mount/focus после `staleTime`; принудительно — `reload()` / `invalidateQueries`.

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

#### Как не показывать устаревшие данные (вариант B)

Кэш в TanStack Query **не означает «заморозить навсегда»**. Данные считаются **свежими** внутри `staleTime`; после этого — **устаревшими** (`stale`), но остаются в памяти и показываются пользователю, пока идёт фоновый refetch. Это паттерн **stale-while-revalidate**: мгновенный UI из кэша + тихое обновление, если на сервере появилось новое.

**Механизмы обновления**

| Механизм | Когда срабатывает | Зачем |
| --- | --- | --- |
| `staleTime` | Истёк TTL свежести для query key | Разная «живучесть» manifest vs dated snapshot |
| `refetchOnMount` | Component смонтирован, данные stale | Возврат home ↔ tournament подтягивает новое без полного спиннера |
| `refetchOnWindowFocus` | Пользователь вернулся на вкладку, данные stale | После правки в admin / деплоя JSON данные подтянутся при фокусе |
| `refetchOnReconnect` | Сеть восстановилась | Актуализация после offline |
| `refetchInterval` | Опционально, для «живых» contest | Только если product захочет polling во время тура |
| `queryClient.invalidateQueries()` | Явный вызов (кнопка «Обновить», post-mutation) | Принудительный refetch без ожидания TTL |

**Предлагаемые `staleTime` по типу данных** (согласованы с расписанием backend — см. следующую секцию):

| Query key | Источник | `staleTime` | Обоснование |
| --- | --- | --- | --- |
| `['manifest']` | `leagues.json` (API) | **30–60 s** | Меняется при действиях в admin; короткий TTL + refetch on focus |
| `['league', id]` | legacy/contest payload | **2–4 h** | Contest-прогнозы — раз в сутки; legacy — реже; кэш для UX, не polling |
| `['contest-prediction', path]` | `predictions/latest.json` | **2–4 h** | Backend: ~1 push/сутки (21:00 UTC); короткий TTL не нужен |
| `['sports']` | sports catalog | **15–30 min** | Редко меняется |
| `['history-days', id]` | `days.json` / facts index | **2–4 h** | Индекс растёт каждые 8 h (standings); snapshots — immutable |
| `['history-snapshot', id, date]` | dated JSON | **∞** (или 24 h) | Файл с датой в пути не меняется; refetch только при invalidate |

**Что видит пользователь**

1. **Первый заход** — обычная загрузка (`isLoading`), как сейчас.
2. **Повторная навигация в сессии** — данные из кэша **сразу**; если stale, параллельно `isFetching` (можно показать тонкий индикатор «Обновление…», не блокируя таблицу).
3. **Данные на сервере обновились** — при следующем триггере (mount/focus/TTL) UI **заменится** новым JSON; пользователь не застревает на вечно старом снимке, если вкладка хоть иногда получает refetch.
4. **Критично свежее** — кнопка «Обновить» на турнире: `invalidateQueries(['league', id])` + `invalidateQueries(['contest-prediction', path])` → принудительный fetch.

**Persist (localStorage / IndexedDB) — опционально**

Persist plugin **не отменяет** устаревание: при старте приложения hydrated данные помечаются stale и refetch'атся по тем же правилам (`refetchOnMount` / focus). Без persist риск «вчерашний JSON после перезагрузки вкладки» отсутствует — кэш только in-memory на сессию.

**Чего вариант B сам не решает**

- Push/real-time (WebSocket) — не нужен для текущей модели «статический JSON + manifest API».
- Мгновенное отражение правки admin **без** refetch — нужен либо короткий `staleTime` для manifest, либо invalidate с admin-side hook (вне scope SPA).
- Contest «live» во время матча — **не соответствует текущему пайплайну** (см. расписание ниже): `refetchInterval` имеет смысл только если backend начнёт обновлять чаще раза в сутки.

#### Расписание обновления backend (`win-predict-ai-data`)

SPA читает JSON с GitHub Pages (`VITE_DATA_BASE_URL`); manifest — с admin API (`VITE_LEAGUES_URL`). Обновление файлов в data-репо **не push/real-time** — batch-пайплайн:

| Что обновляется | Механизм | Расписание (UTC) | Затронутые пути в SPA |
| --- | --- | --- | --- |
| Standings / facts snapshots | GitHub Action [`snapshot-standings.yml`](https://github.com/onlyzoran/win-predict-ai-data/blob/main/.github/workflows/snapshot-standings.yml) | **Каждые 8 h** — `0 */8 * * *` (00:00, 08:00, 16:00) | `history/{id}/*.json`, `contests/*/facts/standings/*`, `facts/latest.json`, `facts/index.json`, `days.json` |
| Contest predictions (14 лиг) | Cursor cloud agent `win-predict-all-refresh` | **~1×/сутки** — push после standings или cron fallback **21:00 UTC** (`0 21 * * *`); список: `data/contests/prediction-refresh.json` | `predictions/latest.json`, `predictions/card.json`, dated `predictions/YYYY-MM-DD.json` |
| Legacy league JSON | Тот же snapshot для history; прогнозы — вне ежедневного agent для contest-лиг | History: каждые 8 h; `{league}.json` — вручную / отдельно | `data/{league}.json`, `history/{id}/` |
| Manifest `leagues.json` (fallback) | Коммит в data / синхронизация с admin | По событию | Только если `VITE_LEAGUES_URL` не задан |
| Manifest (admin API) | SQLite, панель admin | **Сразу** при сохранении | `VITE_LEAGUES_URL` → `/api/leagues.json` |
| Sports catalog | Admin API | Редко, по событию | `VITE_SPORTS_URL` |

**Задержка доставки:** после push в `main` data-репо GitHub Pages пересобирается (~1–5 min). Клиентский refetch подхватит новое только после деплоя Pages + истечения `staleTime` или триггера focus/mount.

#### Согласованность варианта B с расписанием

**Вывод: план реализации (stale-while-revalidate + dedup) соответствует batch-модели backend; стартовые `staleTime` из первой версии аудита (1–2 min для predictions) — **не соответствовали** фактической частоте обновлений и пересмотрены выше.**

| Аспект | Backend-реальность | Как ведёт себя вариант B | Вердикт |
| --- | --- | --- | --- |
| Частота predictions | ~1×/сутки (21 UTC) + возможный push после standings | `staleTime` 2–4 h + `refetchOnWindowFocus` — без лишнего polling каждые 1–2 min | ✅ согласовано после правки TTL |
| Standings / history index | Каждые 8 h | `staleTime` 2–4 h на index; dated snapshots — ∞ | ✅ index обновится при следующем refetch после deploy |
| Manifest admin | Мгновенно | `staleTime` 30–60 s | ✅ |
| Долгая вкладка без focus | Новые данные после 21 UTC / 8 h cron | После `staleTime` (2–4 h) данные stale → refetch при mount или focus; иначе — кнопка «Обновить» | ⚠️ tab open > staleTime без focus — edge case; focus-refetch закрывает типичный сценарий |
| `refetchInterval` polling | Нет sub-hour обновлений | **Не включать** по умолчанию — не даст более свежих данных, только лишний трафик | ✅ |
| Service Worker cache-first (вариант C) | Batch + Pages delay | Риск показа вчерашнего `latest.json` дольше, чем при Query + focus refetch | ⚠️ C менее согласован с cron, чем B |

**Практическая политика для реализации B:**

1. **`latest.json` / league payload:** `staleTime: 2–4 h`, `refetchOnWindowFocus: true`, `refetchOnMount: true` (refetch только если stale).
2. **После известного окна деплоя (≈21:30 UTC):** опционально `refetchOnReconnect` или ручной invalidate — не обязательно, focus покрывает большинство случаев.
3. **Dated snapshots:** `staleTime: Infinity` — файл с датой в URL не перезаписывается cron'ом.
4. **Manifest API:** короткий TTL (30–60 s) — не зависит от data-cron.
5. **Не полагаться на `refetchInterval`** до смены пайплайна на более частые обновления.

```ts
// Пример политики для manifest (иллюстрация, не код PR)
useQuery({
  queryKey: ['manifest'],
  queryFn: fetchLeaguesManifest,
  staleTime: 60_000,
  refetchOnWindowFocus: true,
  refetchOnMount: 'always', // или true — refetch только если stale
})
```

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

## Сравнение и рекомендация

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

## Чеклист для реализации

- [x] Кэш manifest + dedup `fetchLeaguesManifest` — `useQuery` / `queryKeys.manifest`
- [x] Кэш `loadLeaguePayload` / `loadLeagueById` по `leagueId` — `fetchLeague`, `queryKeys.league`
- [x] Кэш sports catalog (shared, один fetch на сессию) — `useSports`, `queryKeys.sports`
- [x] Кэш history: `days.json` + snapshots по `(source, date)` — `useLeagueHistoryRanks`
- [x] Единая политика retry — `QueryClient` default `retry: 2`
- [x] `staleTime`: manifest 60 s; payload 3 h; sports 20 min; dated snapshots ∞
- [x] Тесты: dedup manifest при remount (`useLeague.spec.ts`)
- [ ] Документировать ожидания от `Cache-Control` на API

Реализация: **вариант B** (`@tanstack/vue-query`) — `src/lib/queryClient.ts`, `src/lib/queryKeys.ts`, `src/lib/dataQueries.ts`, провайдер в `main.ts`.

---

## Связанные файлы

| Файл | Роль |
| --- | --- |
| `src/lib/queryClient.ts` | QueryClient, `STALE_TIME` |
| `src/lib/queryKeys.ts` | ключи queries |
| `src/lib/dataQueries.ts` | fetch manifest/league с dedup |
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
