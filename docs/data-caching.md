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
