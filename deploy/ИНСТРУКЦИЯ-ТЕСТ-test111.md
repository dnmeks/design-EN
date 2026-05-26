# Полный дизайн как 126.en.cx — kovrov-test111

Принцип как у **126.en.cx**: один большой CSS (`kovrov-global.css`) перекрывает стандартный `mainstyles.css` + своя шапка и разметка колонок.

## Файлы для закачки (7)

| Файл | Назначение |
|------|------------|
| `kovrov-global.css` | **Главный** глобальный скин (вместо `kovrov-theme-test.css`) |
| `kovrov-games-hub.css` | Карточки, вкладки, календари **+ мобильный адаптив в конце файла** |
| `kovrov-mobile.css` | Доп. мобильные правила (подключать последним) |
| `kovrov-responsive.css` | Мобильный адаптив без классов на body (запасной) |
| `games-hub.js` | Логика игр, карточки календаря на телефоне |
| `seasons-config.js` | Сезон |

**В DivTopDesign** добавьте ссылки из `divtop-css-links-snippet.html` (или дублируйте из `editor-top-full-test111.html`).

`kovrov_css.css`, `adaptive_kvrv.css`, картинки — уже на сервере.

## Редактор дизайна (HTML код)

| Вкладка | Файл |
|---------|------|
| Верхняя часть | `editor-top-full-test111.html` — подключает **kovrov-global.css** |
| Верхняя область на главной | `editor-main-home-FIX-test111.html` |
| Правая часть | `editor-right-test111.html` — **сетка спонсоров 2×N как в прототипе** |
| Нижняя часть | `editor-bottom-test111.html` |

**Удалите** ссылку на `kovrov-theme-test.css`, если осталась — всё в `kovrov-global.css`.

## Отличие от прототипа в браузере

Прототип — отдельная HTML-страница с CSS Grid.  
На Encounter остаётся табличная вёрстка, но **визуально** (цвета, панели, сетка спонсоров, карточки) должно совпадать.

100% пиксель-в-пиксель без своего хостинга невозможно — так устроена платформа.

## Мобильная шапка (зафиксировано)

**Не менять** без отдельного запроса: логотип слева, бургер справа на одной линии с низом лого. Звёзды — `top: 20px; left: 31px` в `.kv-head-brand`. На iOS — блок `@supports (-webkit-touch-callout: none)` для прижатия лого влево.

Стили: `editor-top-full-test111.html` (inline, главный источник), дубли в `kovrov-mobile.css`, `kovrov-games-hub.css`, `kovrov-global.css`, `kovrov-responsive.css`.  
Разметка: `#dnk_head > .kv-head-bar > .kv-head-left > .kv-head-brand > (.star + .logo)` + `.menu-wrap.kv-head-burger`.

## Чеклист после деплоя

- [ ] Тёмный фон, зелёные акценты
- [ ] Шапка `dnk_head`, стандартный логот EN скрыт
- [ ] **Мобила:** звёзды над логотипом слева, бургер справа на уровне лого
- [ ] **EnMail.aspx:** как на боевом — таблицы EN, без JS/grid (`kovrov-inner-pages.css`, `kovrov-global.css`)
- [ ] **Addons.aspx / FAQ / регламенты:** текст в `<pre>` переносится, колонки столбиком, без горизонтального обрезания (`kovrov-inner-pages.css`, `kovrov-responsive.css`)
- [ ] Меню тёмная полоса, белые пункты
- [ ] Спонсоры — **плитка 2 колонки**, не длинный столбик
- [ ] Карточки игр с постером (если картинка в анонсе)
- [ ] Ctrl+F5, консоль без ошибок
