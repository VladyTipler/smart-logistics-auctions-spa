# Использование AI

AI использовался как инженерный ассистент: для исследования OpenAPI, проработки вариантов, реализации по небольшим задачам, генерации тестовых сценариев и повторных независимых ревью. Финальные решения, scope и критерии приёмки оставались за кандидатом.

## Работа с участием AI

- разбор задания и OpenAPI-схемы, поиск nullable/optional и неоднозначных полей;
- подготовка архитектурного и поэтапного implementation plan;
- реализация typed HTTP boundary, stateful MSW, FSD-срезов и UI;
- составление unit, feature integration и Playwright сценариев;
- ревью accessibility, responsive behavior, ошибок, guard-политики и repository hygiene;
- проектирование изолированного GitHub Pages demo build, hash routing и CI/CD workflow;
- подготовка документации и списка остаточных рисков.

Скилл `frontend-design` помог сформировать визуальную систему Dispatch Board: палитру, типографику, route rail и правила плотности интерфейса. Кандидат лично утвердил архитектуру, границы FSD, трактовку guard-флагов, стратегию тестирования и приоритет интеграционных сценариев.

## Решения кандидата

- Tailwind CSS + Base UI вместо обязательной привязки к готовому component kit;
- один доменный визуальный мотив — route rail — без KPI-grid, градиентов и декоративного dashboard chrome;
- OpenAPI как источник DTO и отдельные ViewModel как защита UI от nullable/optional данных;
- TanStack Query для server state, URL для фильтров, Zustand только для Drawer;
- единая access policy с удалением закрытых данных до передачи в компоненты;
- stateful MSW + query invalidation вместо оптимистических обновлений;
- feature integration и E2E как основная гарантия работоспособности, unit — только для чистой логики;
- route-level lazy loading четырёх экранов с проверяемым entry budget 500 KiB;
- отдельный `demo` mode для Pages со stateful browser MSW и hash history без изменения production API boundary;
- GitHub Actions deployment только после lint, typecheck, Vitest/artifact contracts, production build, обычных E2E и Pages smoke;
- TypeScript 5.9 вместо предложенного TypeScript 7 из-за peer-контракта `openapi-typescript`.

## Отклонённые предложения

- shadcn/ui как обязательная основа — добавлял бы лишний визуальный слой поверх выбранного Base UI;
- оптимистическое обновление ставки — дублировало бы серверную модель и повышало риск рассинхронизации;
- преимущественно unit-тестовая стратегия — не доказывает связь Router, Query, API, MSW и UI;
- разрозненные проверки guard-флагов в компонентах — могли бы раскрыть скрытые поля;
- «проглотить» malformed JSON как обычную API-ошибку — скрывало бы нарушение transport-контракта;
- retry для любой неизвестной ошибки — маскировал бы programming/parse errors.

## Вручную проверенные зоны высокого риска

- generated types и соответствие request/response OpenAPI-контракту;
- прямое открытие всех четырёх маршрутов и SPA-навигация без потери QueryClient state;
- state transition после ставки: list, detail, own bid, history и ranks;
- decimal-safe min/max/step, включая дробные значения и направление торгов;
- `can_set_bet`, оба `hide_bets_history`, `hide_points_address_and_contacts`, `no_view_cargo_price`, `hide_places`;
- отсутствие закрытых данных в ViewModel/UI и отсутствие history-запроса при запрете;
- `401`, `404`, `422`, `503`, network recovery и сохранение введённой ставки;
- keyboard focus, Drawer focus trap/restore, mobile sticky action, contrast, reduced motion и горизонтальный overflow;
- production build на четыре независимых route chunks, entry budget и отсутствие browser MSW worker/chunks и служебных маркеров.
- локальный Pages topology: repository base, прямой hash route, переход в детали и reload со stateful browser MSW;
- структурный контракт workflow: `main`/manual triggers, минимальные Pages permissions, полные quality gates, `dist-demo` artifact и защищённый deploy job.
- публичный Pages deploy: полный GitHub Actions run и live smoke со ставкой, hash-навигацией, reload и подтверждённым Service Worker interception.

## Оставшиеся риски

- fixtures покрывают выбранные edge cases, но не всё пространство реальных backend-данных;
- нет проверки интеграции с реальной авторизацией и production API;
- browser-проверки ограничены Chromium и viewport emulation;
- нет автоматизированного axe/Accessibility Insights gate;
- mock-state неперсистентный и не моделирует конкурентные ставки нескольких клиентов;
- большие production-данные и сетевые профили вне локальных сценариев не измерялись.

## Что улучшил бы ещё за один день

- добавил регулярный внешний availability smoke для публичного demo;
- прогнал реальные Safari/Firefox и физический mobile device;
- добавил axe scan и проверку high-contrast/forced-colors;
- выполнил contract smoke against staging API при наличии доступа;
- добавил автоматические Lighthouse budgets и visual-regression baseline;
- расширил fixtures property-based тестами decimal/date/filter границ и конкурентных ставок.
