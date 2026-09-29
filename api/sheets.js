// Vercel serverless function — читает данные из Google Sheets от имени
// сервисного аккаунта Google. Секретный ключ живёт только здесь, в
// переменных окружения Vercel, и никогда не попадает в код, который
// отправляется в браузер.
//
// Требуемые переменные окружения (Vercel → Settings → Environment Variables):
//   GOOGLE_SHEET_ID               — ID таблицы (часть ссылки между /d/ и /edit)
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — email сервисного аккаунта (…@…iam.gserviceaccount.com)
//   GOOGLE_PRIVATE_KEY            — приватный ключ сервисного аккаунта (весь блок
//                                   -----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY-----)
// Необязательные (если названия листов отличаются от значений по умолчанию):
//   GOOGLE_SHEET_TEACHERS_TAB     — по умолчанию "Все учителя 26/27"
//   GOOGLE_SHEET_SENIOR_TAB       — по умолчанию "IT-классы 26/27" (было "ИТ классы 25/26" — лист переименовали под новый учебный год; оба варианта, и ещё пара похожих, распознаются автоматически, см. findSheet)
//   GOOGLE_SHEET_SCHEDULE_TAB     — по умолчанию "(АЗ) График 26/27"
//
// Лист "Statistika" здесь намеренно НЕ читается: все KPI считаются
// напрямую по сырым данным листа "Все учителя 26/27" (см. src/utils/stats.ts),
// без зависимости от промежуточных агрегатов.
//
// Таблицу нужно расшарить сервисному аккаунту как минимум "Читатель" —
// саму таблицу при этом НЕ нужно делать публичной.

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new Error(
      'Не заданы переменные окружения GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY на Vercel.',
    );
  }
  return new JWT({ email, key, scopes: SCOPES });
}

// Google Sheets API (через getRows/values.get) всегда отдаёт ВСЕ строки и
// столбцы листа, независимо от того, что скрыто в интерфейсе (скрытые
// строки/столбцы, обычные фильтры) — это состояние отображения, а не
// данных, оно не проксируется в ответ API. Единственное, что реально может
// "потерять" данные — неверное имя вкладки (переименовали лист) или
// обрезка по числу строк (см. MAX_ROWS ниже) — поэтому именно от них и
// защищаемся ниже, а не от скрытых ячеек, которые API и так не фильтрует.
//
// Поиск листа по имени — с запасным вариантом по ключевым словам: точное
// имя может слегка отличаться (переименовали вкладку под новый учебный
// год, лишний пробел, другой дефис) — тогда ищем среди всех вкладок
// таблицы по подстроке. Один хардкод названия не должен ронять весь сайт.
function findSheet(doc, exactCandidates, keywords) {
  for (const name of exactCandidates) {
    const sheet = doc.sheetsByTitle[name];
    if (sheet) return sheet;
  }
  const found = doc.sheetsByIndex.find((sheet) => {
    const title = sheet.title.toLowerCase();
    return keywords.some((kw) => title.includes(kw));
  });
  return found ?? null;
}

// row.toObject() уже возвращает объект {заголовок: значение} — не позиции
// колонок. Один битый ряд (редкая ошибка библиотеки на пустой/повреждённой
// строке листа) не должен ронять весь ответ — просто пропускаем его.
function rowsToObjects(rows) {
  const result = [];
  for (const row of rows) {
    try {
      result.push(row.toObject());
    } catch (err) {
      console.warn('api/sheets: пропущена строка при чтении — ошибка toObject():', err);
    }
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('Не задана переменная окружения GOOGLE_SHEET_ID на Vercel.');
    }

    const doc = new GoogleSpreadsheet(sheetId, getAuth());
    await doc.loadInfo();

    const teachersTabName = process.env.GOOGLE_SHEET_TEACHERS_TAB || 'Все учителя 26/27';
    // Вкладка ИТ/IT-классов уже переименовывалась под новый учебный год
    // (25/26 → 26/27) — держим оба варианта названия как точные кандидаты,
    // плюс общий поиск по ключевым словам ниже, чтобы следующее
    // переименование не роняло сайт снова.
    const seniorTabName = process.env.GOOGLE_SHEET_SENIOR_TAB || 'IT-классы 26/27';
    const scheduleTabName = process.env.GOOGLE_SHEET_SCHEDULE_TAB || '(АЗ) График 26/27';

    const teachersSheet = findSheet(doc, [teachersTabName, 'Все учителя 26/27'], ['все учителя']);
    const seniorSheet = findSheet(
      doc,
      [seniorTabName, 'IT-классы 26/27', 'ИТ классы 26/27', 'IT классы 26/27', 'ИТ классы 25/26'],
      ['ит-класс', 'ит класс', 'it-класс', 'it класс', 'ит классы'],
    );

    if (!teachersSheet) {
      throw new Error(
        `Лист "${teachersTabName}" не найден в таблице. Доступные вкладки: ${doc.sheetsByIndex.map((s) => `"${s.title}"`).join(', ')}`,
      );
    }
    if (!seniorSheet) {
      throw new Error(
        `Лист "${seniorTabName}" не найден в таблице. Доступные вкладки: ${doc.sheetsByIndex.map((s) => `"${s.title}"`).join(', ')}`,
      );
    }
    if (teachersSheet.title !== teachersTabName) {
      console.warn(`api/sheets: лист учителей найден по похожему названию: "${teachersSheet.title}" (искали "${teachersTabName}").`);
    }
    if (seniorSheet.title !== seniorTabName) {
      console.warn(`api/sheets: лист ИТ/IT-классов найден по похожему названию: "${seniorSheet.title}" (искали "${seniorTabName}").`);
    }

    // График дедлайнов — не критичный источник (без него модули просто не
    // фильтруются по датам): при отсутствии точного совпадения ищем по
    // ключевым словам, а не сразу сдаёмся на пустом графике. availableTabs
    // в диагностике ниже — чтобы при следующей проверке сразу увидеть
    // точные реальные названия листов, а не гадать.
    const scheduleSheet = findSheet(doc, [scheduleTabName], ['график', 'qrafik', 'cədvəl', 'schedule']);
    if (scheduleSheet && scheduleSheet.title !== scheduleTabName) {
      console.warn(
        `api/sheets: лист "${scheduleTabName}" не найден точным именем, использую похожий по названию: "${scheduleSheet.title}".`,
      );
    } else if (!scheduleSheet) {
      console.warn(
        `api/sheets: лист "${scheduleTabName}" не найден — график дедлайнов будет пустым. Доступные вкладки: ${doc.sheetsByIndex.map((s) => `"${s.title}"`).join(', ')}`,
      );
    }

    // ВАЖНО: getRows() без явного limit по умолчанию берёт максимум
    // (sheet.rowCount - 1) строк — а sheet.rowCount это НЕ количество строк
    // с данными, а размер сетки листа в Google Sheets (может быть меньше
    // реального числа заполненных строк, если сетка не была расширена).
    // Из-за этого часть реальных учителей в конце листа молча обрезалась.
    // Передаём заведомо большой limit, чтобы всегда забирать ВСЕ строки
    // листа независимо от размера его сетки.
    const MAX_ROWS = 20000;
    const [teacherRows, seniorRows, scheduleRows] = await Promise.all([
      teachersSheet.getRows({ limit: MAX_ROWS }),
      seniorSheet.getRows({ limit: MAX_ROWS }),
      scheduleSheet ? scheduleSheet.getRows({ limit: MAX_ROWS }) : Promise.resolve([]),
    ]);

    const scheduleObjects = rowsToObjects(scheduleRows);
    // Диагностика графика — не влияет на работу сайта, но видна на вкладке
    // Network в браузере (ответ /api/sheets) даже без доступа к логам
    // Vercel: какая вкладка реально использовалась и какие у неё заголовки
    // в первой строке — по ним сразу видно, совпадают ли они с тем, что
    // ищет scheduleMapping.ts (Modul/Modul Total/Sinif/Deadline/
    // Açılmasını yoxla), или лист называет их иначе.
    const scheduleDebug = {
      matchedTab: scheduleSheet ? scheduleSheet.title : null,
      availableTabs: doc.sheetsByIndex.map((s) => s.title),
      rowCount: scheduleObjects.length,
      firstRowHeaders: scheduleObjects.length > 0 ? Object.keys(scheduleObjects[0]) : [],
    };

    res.status(200).json({
      teachers: rowsToObjects(teacherRows),
      senior: rowsToObjects(seniorRows),
      schedule: scheduleObjects,
      scheduleDebug,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('api/sheets error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
