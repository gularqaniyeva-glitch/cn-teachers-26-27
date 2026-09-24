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
//   GOOGLE_SHEET_SENIOR_TAB       — по умолчанию "ИТ классы 25/26"
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
    const seniorTabName = process.env.GOOGLE_SHEET_SENIOR_TAB || 'ИТ классы 25/26';
    const scheduleTabName = process.env.GOOGLE_SHEET_SCHEDULE_TAB || '(АЗ) График 26/27';

    const teachersSheet = doc.sheetsByTitle[teachersTabName];
    const seniorSheet = doc.sheetsByTitle[seniorTabName];

    if (!teachersSheet) {
      throw new Error(`Лист "${teachersTabName}" не найден в таблице. Проверьте название вкладки.`);
    }
    if (!seniorSheet) {
      throw new Error(`Лист "${seniorTabName}" не найден в таблице. Проверьте название вкладки.`);
    }

    // График дедлайнов — не критичный источник (без него модули просто не
    // фильтруются по датам): если точное имя вкладки не совпало — например,
    // из-за лишнего пробела или другого вида дефиса/скобок в названии —
    // пробуем найти вкладку по ключевым словам, а не сразу сдаёмся на
    // пустом графике. availableTabs в диагностике ниже как раз для этого:
    // чтобы при следующей проверке сразу увидеть точные реальные названия
    // листов, а не гадать.
    let scheduleSheet = doc.sheetsByTitle[scheduleTabName];
    if (!scheduleSheet) {
      const keywords = ['график', 'qrafik', 'cədvəl', 'schedule'];
      scheduleSheet = doc.sheetsByIndex.find((sheet) => {
        const title = sheet.title.toLowerCase();
        return keywords.some((kw) => title.includes(kw));
      });
      if (scheduleSheet) {
        console.warn(
          `api/sheets: лист "${scheduleTabName}" не найден точным именем, использую похожий по названию: "${scheduleSheet.title}".`,
        );
      } else {
        console.warn(
          `api/sheets: лист "${scheduleTabName}" не найден — график дедлайнов будет пустым. Доступные вкладки: ${doc.sheetsByIndex.map((s) => `"${s.title}"`).join(', ')}`,
        );
      }
    }

    const [teacherRows, seniorRows, scheduleRows] = await Promise.all([
      teachersSheet.getRows(),
      seniorSheet.getRows(),
      scheduleSheet ? scheduleSheet.getRows() : Promise.resolve([]),
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
