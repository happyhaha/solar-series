# Аннотации скриншотов интерфейса — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реальные скрины интерфейса в кейсах показываются с навигацией — пины + пояснения, адаптивно (десктоп: боковая легенда на уровне пинов; мобила: крошечный пин + плашка справа), через переиспользуемый компонент.

**Architecture:** Кейсы переводятся `.md → .mdx` (+ интеграция `@astrojs/mdx`). Вёрстка варианта A инкапсулируется в `src/components/AnnotatedShot.astro` со scoped-CSS. В `case-one.mdx` 3 реальных скрина рендерятся через компонент с массивом `spots`. Сборка остаётся статической.

**Tech Stack:** Astro 5 (static), Content Collections (glob loader), `@astrojs/mdx`, Tailwind v4. Тестов в проекте нет — верификация: `npm run build` + визуальная проверка через dev-сервер (`curl` статус + просмотр страницы).

**Отклонение от спеки:** браузерный хром в аннотированных скринах НЕ делаем (YAGNI + стабильность выравнивания пин/легенда). Компонент без `url`-обёртки. Остальное по спеке.

---

## Task 1: MDX-интеграция

**Files:**
- Modify: `package.json` (dependency)
- Modify: `astro.config.mjs`
- Modify: `src/content.config.ts:5`

- [ ] **Step 1: Установить @astrojs/mdx**

Run: `cd /home/marlin/projects/solar-series && npx astro add mdx --yes`

Expected: ставит `@astrojs/mdx`, дописывает `integrations: [mdx()]` в `astro.config.mjs`. Если CLI не дописал конфиг — Step 2.

- [ ] **Step 2: Проверить/поправить astro.config.mjs**

Файл должен быть:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://marlindev.ru',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 3: Расширить glob на mdx**

В `src/content.config.ts` заменить строку:

```ts
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
```

на:

```ts
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cases' }),
```

- [ ] **Step 4: Сборка (регрессия, кейсы ещё .md)**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок, `dist/cases/case-one/index.html` существует.

- [ ] **Step 5: Commit**

```bash
cd /home/marlin/projects/solar-series
git add package.json package-lock.json astro.config.mjs src/content.config.ts
git commit -m "build: подключить @astrojs/mdx, glob на md+mdx"
```

---

## Task 2: Переименовать кейсы в .mdx

**Files:**
- Rename: `src/content/cases/case-one.md` → `case-one.mdx` (и case-two..five)

- [ ] **Step 1: git mv всех пяти файлов**

```bash
cd /home/marlin/projects/solar-series/src/content/cases
for f in case-one case-two case-three case-four case-five; do git mv "$f.md" "$f.mdx"; done
```

- [ ] **Step 2: Сборка**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок. Сгенерированы все страницы кейсов в `dist/cases/`.

Если ошибка MDX-парсинга в каком-то кейсе (MDX строже Markdown: голые `<`, `{`, незакрытые теги) — найти по сообщению, экранировать символ или закрыть тег, контент по смыслу не менять. Повторить сборку.

- [ ] **Step 3: Dev-проверка**

Run: `cd /home/marlin/projects/solar-series && (curl -s http://localhost:4321/cases/case-one -o /dev/null -w "%{http_code}\n" || echo "dev down")`
Expected: `200` (если dev-сервер запущен; иначе пропустить — Step 2 уже подтвердил сборку).

- [ ] **Step 4: Commit**

```bash
cd /home/marlin/projects/solar-series
git add -A src/content/cases
git commit -m "refactor: кейсы .md -> .mdx"
```

---

## Task 3: Компонент AnnotatedShot

**Files:**
- Create: `src/components/AnnotatedShot.astro`

- [ ] **Step 1: Создать компонент**

Создать `src/components/AnnotatedShot.astro` с содержимым:

```astro
---
interface Spot { n: number; x: number; y: number; title: string; text: string }
interface Props {
  src: string;
  alt: string;
  spots: Spot[];
  loading?: 'lazy' | 'eager';
}
const { src, alt, spots, loading = 'lazy' } = Astro.props;
---

<div class="ashot not-prose">
  <div class="ashot-grid">
    <div class="ashot-shot">
      <img src={src} alt={alt} loading={loading} />
      {spots.map((s) => (
        <span class="ashot-pin" style={`left:${s.x}%;top:${s.y}%`}>{s.n}</span>
      ))}
      {spots.map((s) => (
        <div class="ashot-note" style={`left:${s.x}%;top:${s.y}%`}>
          <strong>{s.n}. {s.title}</strong>{s.text}
        </div>
      ))}
    </div>
    <ul class="ashot-legend">
      {spots.map((s) => (
        <li style={`top:${s.y}%`}>
          <span class="ashot-b">{s.n}</span>
          <span class="ashot-t"><strong>{s.title}</strong><span>{s.text}</span></span>
        </li>
      ))}
    </ul>
  </div>
</div>

<style>
  .ashot { --pin: #9aa0a6; margin: 2rem 0; }
  .ashot-grid { display: flex; flex-direction: column; gap: 20px; }
  .ashot-shot { position: relative; width: 100%; }
  .ashot-shot img {
    display: block; width: 100%; height: auto;
    border-radius: 10px; border: 1px solid #e0e0e0;
  }

  /* пин: мобила — крошечный */
  .ashot-pin {
    position: absolute; width: 14px; height: 14px;
    transform: translate(-50%, -50%);
    background: var(--pin); color: #fff; border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 500; line-height: 1;
    font-variant-numeric: tabular-nums; text-align: center;
    border: 1px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,.18); z-index: 2;
  }

  /* плашка: мобила, всегда справа от пина */
  .ashot-note {
    position: absolute; width: 96px; background: #111; color: #fff;
    z-index: 3; padding: 4px 6px; border-radius: 5px;
    font-size: 8px; line-height: 1.3;
    box-shadow: 0 2px 7px rgba(0,0,0,.3);
    transform: translate(12px, -50%);
  }
  .ashot-note strong { display: block; font-size: 8px; margin-bottom: 1px; }
  .ashot-note::after {
    content: ''; position: absolute; top: 50%; left: -3px;
    width: 6px; height: 6px; background: #111;
    transform: translateY(-50%) rotate(45deg);
  }

  .ashot-legend { list-style: none; display: none; margin: 0; padding: 0; }
  .ashot-legend li { display: flex; gap: 12px; }
  .ashot-b {
    flex: 0 0 22px; height: 22px; background: var(--pin); color: #fff;
    border-radius: 999px; display: flex; align-items: center;
    justify-content: center; font-size: 12px; font-weight: 500;
    line-height: 1; font-variant-numeric: tabular-nums;
  }
  .ashot-t strong { display: block; font-size: .98rem; }
  .ashot-t span { color: #666; font-size: .92rem; }

  @media (min-width: 1024px) {
    .ashot-grid {
      display: grid; grid-template-columns: 1fr 320px; align-items: stretch;
    }
    .ashot-legend {
      position: relative; height: 100%; display: flex; flex-direction: column;
    }
    .ashot-legend li {
      position: absolute; left: 0; right: 0; transform: translateY(-50%);
    }
    .ashot-note { display: none; }
    .ashot-pin {
      width: 54px; height: 54px; font-size: 28px;
      border-width: 3px; box-shadow: 0 2px 6px rgba(0,0,0,.18);
    }
  }
</style>
```

- [ ] **Step 2: Сборка (компонент не используется, должен не ломать)**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок.

- [ ] **Step 3: Commit**

```bash
cd /home/marlin/projects/solar-series
git add src/components/AnnotatedShot.astro
git commit -m "feat: компонент AnnotatedShot (пины + легенда, адаптив)"
```

---

## Task 4: Аннотировать admin-dashboard в case-one.mdx

**Files:**
- Modify: `src/content/cases/case-one.mdx` (раздел «Со стороны администратора», блок `admin-dashboard.png`)

- [ ] **Step 1: Добавить импорт компонента**

В `src/content/cases/case-one.mdx` сразу после строки фронтматтера `---` (закрывающей) и пустой строки добавить:

```mdx
import AnnotatedShot from '../../components/AnnotatedShot.astro';
```

(Импорт в MDX размещается в теле, до первого использования; одной строки достаточно на весь файл.)

- [ ] **Step 2: Заменить блок admin-dashboard**

Найти в файле фигуру с `img src="/img/cases/case-one/admin-dashboard.png"` (обёрнута в `<div class="w-full overflow-hidden rounded-lg ...">` мокап-хром, внутри `<figure>` с лид-абзацем и `<figcaption>`).

Заменить весь мокап-`<div>` (от `<div class="w-full overflow-hidden rounded-lg border ...">` до его закрывающего `</div>` перед `<figcaption>`) на:

```mdx
<AnnotatedShot
  src="/img/cases/case-one/admin-dashboard.png"
  alt="Дашборд администратора платформы"
  spots={[
    { n: 1, x: 58, y: 16, title: 'Состояние потока', text: 'Работы на проверке, активность за 2 дня, средний прогресс. Видно за пару секунд.' },
    { n: 2, x: 63, y: 33, title: 'Очередь проверки', text: 'Кто сдал и ждёт ответа. Раньше терялось в чате.' },
    { n: 3, x: 60, y: 58, title: 'Ближайшие занятия', text: 'Что и когда разбираем, с кем. Расписание не в голове.' },
    { n: 4, x: 58, y: 84, title: 'Кто давно не заходил', text: 'Кто пропал. Сразу видно, к кому подойти.' }
  ]}
/>
```

Лид-абзац (`<p>`) и `<figcaption>` оставить как есть. Внешний `<figure>` оставить.

- [ ] **Step 3: Сборка**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок, страница `dist/cases/case-one/index.html` собрана.

- [ ] **Step 4: Визуальная проверка координат**

Run: `cd /home/marlin/projects/solar-series && curl -s http://localhost:4321/cases/case-one -o /dev/null -w "%{http_code}\n"`
Expected: `200`.

Открыть `/cases/case-one`, секция «Со стороны администратора». Проверить на широком окне (легенда на уровне пинов) и узком (<1024 — крошечные пины + плашки справа). Координаты выверены в прототипе `/mock/annotate` — правок обычно не нужно. Если пин лёг на текст: подвинуть `x`/`y` соответствующего spot на ±2–4% и пересобрать.

- [ ] **Step 5: Commit**

```bash
cd /home/marlin/projects/solar-series
git add src/content/cases/case-one.mdx
git commit -m "feat(case-one): аннотации на admin-dashboard"
```

---

## Task 5: Аннотировать admin-students в case-one.mdx

**Files:**
- Modify: `src/content/cases/case-one.mdx` (блок `admin-students.png`)

- [ ] **Step 1: Заменить блок admin-students**

Найти мокап-`<div>` с `img src="/img/cases/case-one/admin-students.png"`. Заменить мокап-`<div>` (как в Task 4, Step 2) на:

```mdx
<AnnotatedShot
  src="/img/cases/case-one/admin-students.png"
  alt="Список учеников потока"
  spots={[
    { n: 1, x: 70, y: 11, title: 'Поток и счётчик', text: 'Какой поток и сколько учеников сейчас на обучении.' },
    { n: 2, x: 50, y: 34, title: 'Прогресс по курсам', text: 'Сколько пройдено у каждого — наглядной полосой.' },
    { n: 3, x: 66, y: 34, title: 'Срок сдачи', text: 'Дедлайн ближайшей работы. Видно, кто горит.' },
    { n: 4, x: 84, y: 34, title: 'Статус проверки', text: 'У кого работа ждёт ответа — отметка справа.' }
  ]}
/>
```

Лид-абзац и `<figcaption>` не трогать.

- [ ] **Step 2: Сборка**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок.

- [ ] **Step 3: Визуальная проверка и подгонка координат**

Run: `cd /home/marlin/projects/solar-series && curl -s http://localhost:4321/cases/case-one -o /dev/null -w "%{http_code}\n"`
Expected: `200`.

Открыть `/cases/case-one`, блок `admin-students`. Скрин — таблица «Ученики потока» (колонки: ученик, курсы, прогресс, срок сдачи, активность, проверка). Координаты выше — стартовые на глаз. Сверить, что spot 1 на строке заголовка «15 учеников сейчас на обучении», spots 2–4 на строке первого ученика над колонками прогресс/срок/проверка. Подвинуть `x`/`y` на ±2–5% до попадания на пустое место рядом с нужным элементом, пересобрать.

- [ ] **Step 4: Commit**

```bash
cd /home/marlin/projects/solar-series
git add src/content/cases/case-one.mdx
git commit -m "feat(case-one): аннотации на admin-students"
```

---

## Task 6: Аннотировать lesson-discussion в case-one.mdx

**Files:**
- Modify: `src/content/cases/case-one.mdx` (блок `lesson-discussion.png` в галерее «Интерфейс»)

- [ ] **Step 1: Заменить блок lesson-discussion**

Найти в галерее «Интерфейс» фигуру экрана «Обсуждение урока» с `img src="/img/cases/case-one/lesson-discussion.png"` (в мокап-хроме). Заменить мокап-`<div>` на:

```mdx
<AnnotatedShot
  src="/img/cases/case-one/lesson-discussion.png"
  alt="Обсуждение урока на платформе: вопрос ученика и разбор преподавателя с кодом"
  spots={[
    { n: 1, x: 66, y: 5, title: 'Привязано к уроку', text: 'Обсуждение внутри конкретного урока, не в общем чате.' },
    { n: 2, x: 60, y: 18, title: 'Вопрос ученика', text: 'Спрашивает прямо по теме урока.' },
    { n: 3, x: 40, y: 46, title: 'Разбор с кодом', text: 'Отвечаю там же, с примерами кода.' },
    { n: 4, x: 66, y: 78, title: 'Видит вся группа', text: 'Ответ остаётся в уроке — получает и следующий поток.' }
  ]}
/>
```

Лид-абзац и `<figcaption>` не трогать. Этот блок внутри галереи-`<figure>` с `flex flex-col gap-12` — компонент сам даёт свои отступы (`margin: 2rem 0`), визуально проверить в Step 3.

- [ ] **Step 2: Сборка**

Run: `cd /home/marlin/projects/solar-series && npm run build`
Expected: BUILD без ошибок.

- [ ] **Step 3: Визуальная проверка и подгонка координат**

Run: `cd /home/marlin/projects/solar-series && curl -s http://localhost:4321/cases/case-one -o /dev/null -w "%{http_code}\n"`
Expected: `200`.

Открыть `/cases/case-one`, галерея «Интерфейс», экран «Обсуждение урока». Скрин очень длинный (1920×3345) — чат «XSS и SQL-инъекции», реплики ученик/преподаватель, блоки кода. Координаты стартовые: spot 1 — шапка темы урока, 2 — первый вопрос ученика, 3 — развёрнутый ответ с кодом, 4 — низ треда. Подогнать `y` на ±3–6% так, чтобы пины стояли на пустых местах рядом с нужными репликами, не на тексте. Пересобрать. На десктопе из-за высоты картинки легенда (320px-колонка) растягивается — проверить, что пункты против своих пинов; при сильном расхождении подвинуть `y` в spots.

- [ ] **Step 4: Commit**

```bash
cd /home/marlin/projects/solar-series
git add src/content/cases/case-one.mdx
git commit -m "feat(case-one): аннотации на lesson-discussion"
```

---

## Task 7: Обновить CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Поправить упоминания формата кейсов**

В `CLAUDE.md` заменить упоминания, что кейсы — `src/content/cases/*.md`, на `*.mdx`. Конкретно:

- В разделе «Архитектура»: `Кейсы — `src/content/cases/*.md`` → `Кейсы — `src/content/cases/*.mdx`` .
- В разделе «Структура кейса»: `Frontmatter (`src/content/cases/*.md`):` → `Frontmatter (`src/content/cases/*.mdx`):` .
- В «Команда переноса» п.3: `Создаёт / обновляет `src/content/cases/<slug>.md`` → `...<slug>.mdx` .
- Добавить в «Архитектура» строку: `Скрины интерфейса аннотируются компонентом `<AnnotatedShot>` (src, alt, spots[]); кейсы поэтому в MDX.`

- [ ] **Step 2: Commit**

```bash
cd /home/marlin/projects/solar-series
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — кейсы в .mdx, AnnotatedShot"
```

---

## Task 8: Финальная проверка

- [ ] **Step 1: Чистая сборка**

Run: `cd /home/marlin/projects/solar-series && rm -rf dist && npm run build`
Expected: BUILD без ошибок. Существуют `dist/cases/case-one/index.html` ... `case-five/index.html`.

- [ ] **Step 2: Прогон всех кейсов на dev**

Run:
```bash
cd /home/marlin/projects/solar-series
for s in case-one case-two case-three case-four case-five; do \
  echo -n "$s "; curl -s "http://localhost:4321/cases/$s" -o /dev/null -w "%{http_code}\n"; done
```
Expected: каждая строка `200`.

- [ ] **Step 3: Визуальный смоук**

Открыть `/cases/case-one`: 3 реальных скрина (lesson-discussion, admin-dashboard, admin-students) — через `AnnotatedShot`, на десктопе боковая легенда против пинов, на мобиле плашки справа от крошечных пинов. Плейсхолдеры lms-* — обычные мокапы, без изменений. Остальные кейсы открываются как раньше.

- [ ] **Step 4: Финальный commit (если остались правки координат)**

```bash
cd /home/marlin/projects/solar-series
git add -A src/content/cases/case-one.mdx
git commit -m "fix(case-one): финальная подгонка координат аннотаций" || echo "нет изменений"
```

---

## Self-Review (выполнено при написании)

- **Покрытие спеки:** MDX-инфра (T1), переименование .mdx (T2), компонент (T3), 3 реальных скрина (T4–T6), CLAUDE.md (T7), критерии готовности (T8). Прототип не трогаем — остаётся. ✔
- **Плейсхолдеры:** координаты заданы конкретными числами + шаг подгонки (не «TBD»). Полный код компонента приведён. ✔
- **Согласованность типов:** `Spot {n,x,y,title,text}` един во всех вызовах T4–T6 и в компоненте T3. Классы `ashot-*` определены в T3, используются только там. ✔
- **Отклонение от спеки:** браузерный хром не реализуем (зафиксировано в шапке плана, обосновано стабильностью). ✔
