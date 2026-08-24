import type { GradeGroup, TeachingLanguage, TrainingType } from '../types/teacher';

export type Locale = 'ru' | 'az';

export interface Dict {
  nav: {
    brandTitle: string;
    brandSubtitle: string;
    projectLabel: string;
    home: string;
    teachers: string;
    seniorGrades: string;
    statistics: string;
  };
  common: {
    search: string;
    reset: string;
    resetAllFilters: string;
    apply: string;
    exportCsv: string;
    save: string;
    saveNote: string;
    cancel: string;
    edit: string;
    backToList: string;
    saved: string;
    any: string;
    all: string;
    loading: string;
    notFound: string;
    noData: string;
    selected: string;
    clearSelection: string;
    selectAllOnPage: string;
    filtersToggle: string;
    of: string;
    found: string;
    close: string;
    refreshData: string;
    refreshing: string;
    retry: string;
    columnsToggle: string;
    classNotAssigned: string;
    classNotAssignedFilter: string;
  };
  moduleStatus: {
    passed: string;
    failed: string;
    notStarted: string;
    onReview: string;
    notAssigned: string;
    notAssignedTooltip: string;
    oldTeacher: string;
    oldTeacherShort: string;
  };
  platformStatus: {
    entered: string;
    notEntered: string;
  };
  gradeGroup: Record<GradeGroup, string>;
  trainingType: Record<TrainingType, string>;
  language: Record<TeachingLanguage, string>;
  columns: {
    fullName: string;
    school: string;
    district: string;
    gradeGroup: string;
    trainingType: string;
    lifecycleStatus: string;
    platformStatus: string;
    result: string;
    averageScore: string;
    note: string;
    moduleColumns: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalTeachers: string;
    entered: string;
    notEntered: string;
    successRate: string;
    successRateHint: string;
    ofTotal: string;
    moduleStatsTitle: string;
    moduleDetailTitle: string;
    passedOf: string;
    successRateTooltip: string;
    enteredTooltip: string;
    notEnteredTooltip: string;
    teachersPassedFormat: string;
    moduleGridEmpty: string;
  };
  teachers: {
    title: string;
    subtitle: string;
  };
  senior: {
    title: string;
    subtitle: string;
  };
  tabs: {
    allTeachers: string;
    moduleReport: string;
  };
  filters: {
    treeTitle: string;
    locationSection: string;
    gradeSection: string;
    lifecycleSection: string;
    moduleSection: string;
    sectorSection: string;
    sectorAll: string;
    anyModule: string;
    anyStatus: string;
    trainingTypeLabel: string;
    platformStatusLabel: string;
    districtLabel: string;
    allDistricts: string;
    startYearLabel: string;
    classesTaughtLabel: string;
    multiSelectAny: string;
    multiSelectCountSuffix: string;
    selectAll: string;
    clearSelection: string;
  };
  quickList: {
    title: string;
    hint: string;
    gradeGroupLabel: string;
    moduleLabel: string;
    statusLabel: string;
    resultCount: string;
    exportButton: string;
    columnScore: string;
    columnFormat: string;
    empty: string;
    allGradeGroups: string;
    allModules: string;
    columnModule: string;
  };
  bulk: {
    changeModuleStatus: string;
    assignCourseSchool: string;
    trainingTypeNoChange: string;
    schoolNoChange: string;
    applyButton: string;
    notApplicableWarning: string;
    partiallyAppliedWarning: string;
  };
  detail: {
    basicInfo: string;
    schoolAndTraining: string;
    moduleResults: string;
    averageResult: string;
    internalNote: string;
    editTitle: string;
    saveChanges: string;
    openFullProfile: string;
    openInLms: string;
    fields: {
      fullName: string;
      fin: string;
      phone: string;
      lmsId: string;
      language: string;
      school: string;
      district: string;
      trainingType: string;
      gradeGroup: string;
      lifecycleStatus: string;
      platformStatus: string;
      classesTaught: string;
      startYear: string;
      email: string;
    };
    notePlaceholder: string;
  };
  exportMenu: {
    title: string;
    selectAll: string;
    clearAll: string;
    download: string;
    modulesLabel: string;
  };
  statistics: {
    title: string;
    subtitle: string;
    byTrainingType: string;
    byGradeGroup: string;
    byLifecycle: string;
    byPlatformStatus: string;
    byModule: string;
    passedOf: string;
    expandHint: string;
    tooltipTrainingType: string;
    tooltipGradeGroup: string;
    tooltipLifecycle: string;
    tooltipPlatformStatus: string;
    tooltipModule: string;
    tabOverview: string;
    kpiAttestationTitle: string;
    kpiAttestationHint: string;
    kpiPlatformActivityTitle: string;
    trainingTypeSummaryTitle: string;
    columnTeacherCount: string;
    columnEnteredPercent: string;
    columnSuccessRatePercent: string;
    moduleByTrainingTypeTitle: string;
    moduleByLifecycleTitle: string;
  };
  pagination: {
    shown: string;
    perPage: string;
    page: string;
  };
  deadlines: {
    assignedLabel: string;
    dueLabel: string;
    passedLabel: string;
    percentLabel: string;
    resultHint: string;
    resultHintAllModules: string;
    cardTitle: string;
    notAvailable: string;
  };
  anomalies: {
    title: string;
    hint: string;
    checkLms: string;
    tooltipText: string;
    groupRowLabel: string;
    noneFound: string;
    individualSectionTitle: string;
    groupSectionTitle: string;
    groupErrorLabel: string;
    flaggedModulesLabel: string;
    zeroRatioSuffix: string;
    teachersSuffix: string;
    onlyAnomaliesFilter: string;
  };
}

export const TRANSLATIONS: Record<Locale, Dict> = {
  ru: {
    nav: {
      brandTitle: 'ЦН Обучение учителей 26/27',
      brandSubtitle: 'Мониторинг обучения учителей',
      projectLabel: 'ЦН Обучение учителей 26/27',
      home: 'Главная',
      teachers: 'Учителя (2–9 классы)',
      seniorGrades: '10–11 классы (ИТ)',
      statistics: 'Статистика',
    },
    common: {
      search: 'Поиск по ФИО, школе, FIN или LMS ID…',
      reset: 'Сбросить',
      resetAllFilters: 'Сбросить все фильтры',
      apply: 'Применить',
      exportCsv: 'Экспорт в Excel/CSV',
      save: 'Сохранить',
      saveNote: 'Сохранить заметку',
      cancel: 'Отмена',
      edit: 'Редактировать',
      backToList: 'Назад к списку',
      saved: 'Сохранено',
      any: 'Любой',
      all: 'Все',
      loading: 'Загрузка данных…',
      notFound: 'Учитель не найден.',
      noData: 'нет данных',
      selected: 'Выбрано',
      clearSelection: 'Снять выделение',
      selectAllOnPage: 'Выбрать всех на странице',
      filtersToggle: 'Фильтры ⚙️',
      of: 'из',
      found: 'Найдено',
      close: 'Закрыть',
      refreshData: 'Обновить данные',
      refreshing: 'Обновление…',
      retry: 'Повторить',
      columnsToggle: 'Столбцы',
      classNotAssigned: 'Класс не назначен',
      classNotAssignedFilter: 'Не назначен класс',
    },
    moduleStatus: {
      passed: '🟢 Сдал',
      failed: '🔴 Не сдал',
      notStarted: '⚪ Не начал',
      onReview: '🔍 На проверку',
      notAssigned: 'N/A',
      notAssignedTooltip: 'Параллель не назначена учителю',
      oldTeacher: 'Старый учитель',
      oldTeacherShort: 'OLD',
    },
    platformStatus: {
      entered: 'Вошёл',
      notEntered: 'Не вошёл',
    },
    gradeGroup: {
      '2-4': '2–4 классы',
      '5-9': '5–9 классы',
      '10-11': '10–11 классы',
    },
    trainingType: {
      asinxron: 'Asinxron',
      onlayn: 'Onlayn',
      əyani: 'Əyani',
    },
    language: {
      az: 'Азербайджанский',
      ru: 'Русский',
    },
    columns: {
      fullName: 'ФИО',
      school: 'Школа',
      district: 'Tabeçilik',
      gradeGroup: 'Классы',
      trainingType: 'Тип обучения',
      lifecycleStatus: 'OLD/NEW',
      platformStatus: 'Платформа',
      result: 'Результат',
      averageScore: '📈 Средний результат, %',
      note: 'Заметка',
      moduleColumns: 'Отдельные модули (M1, M2, M3…)',
    },
    dashboard: {
      title: 'Главная',
      subtitle: 'Общая картина по учителям проекта «ЦН Обучение учителей 26/27»',
      totalTeachers: 'Всего учителей',
      entered: 'Вошли на платформу',
      notEntered: 'Не вошли',
      successRate: 'Прошли курс',
      successRateHint: 'учителей, а не сумма отдельных модулей',
      ofTotal: 'от общего числа',
      moduleStatsTitle: 'Прошли курс (по параллелям)',
      moduleDetailTitle: 'Детализация по каждому модулю',
      passedOf: 'сдали',
      successRateTooltip: 'Учитель считается прошедшим курс, если у него сданы (≥70%) все назначенные модули, либо у него статус «Старый учитель».',
      enteredTooltip: 'Учителя, которые хотя бы раз заходили на обучающую платформу.',
      notEnteredTooltip: 'Учителя, которые ни разу не заходили на платформу — у них все модули со статусом «Не начал».',
      teachersPassedFormat: '{passed} из {total} учителей прошли курс ({percent}%)',
      moduleGridEmpty: 'Нет данных по этой параллели',
    },
    teachers: {
      title: 'Учителя',
      subtitle: '2–4 и 5–9 классы. Для 10–11 классов — отдельная вкладка в меню.',
    },
    senior: {
      title: '10–11 классы',
      subtitle: 'Отдельная программа и модули для старших классов',
    },
    tabs: {
      allTeachers: 'Все учителя',
      moduleReport: 'Отчёт по модулю',
    },
    filters: {
      treeTitle: 'Дерево фильтров',
      locationSection: 'Tabeçilik и школа',
      gradeSection: 'Параллель',
      lifecycleSection: 'Статус учителя (OLD / NEW)',
      moduleSection: 'Статус модуля',
      sectorSection: 'Сектор',
      sectorAll: 'Все',
      anyModule: 'Любой модуль',
      anyStatus: 'Любой статус',
      trainingTypeLabel: 'Тип обучения',
      platformStatusLabel: 'Статус прохождения',
      districtLabel: 'Tabeçilik / Управление',
      allDistricts: 'Все',
      startYearLabel: 'Год начала / Стаж',
      classesTaughtLabel: 'Классы',
      multiSelectAny: 'Все',
      multiSelectCountSuffix: 'выбрано',
      selectAll: 'Выбрать все',
      clearSelection: 'Сбросить',
    },
    quickList: {
      title: 'Список по модулю',
      hint: 'Выберите параллель, модуль и статус — получите готовый список учителей.',
      gradeGroupLabel: 'Параллель',
      moduleLabel: 'Модуль',
      statusLabel: 'Статус',
      resultCount: 'учителей в списке',
      exportButton: 'Экспорт в Excel/CSV',
      columnScore: 'Результат / Статус',
      columnFormat: 'Формат',
      allGradeGroups: 'Все параллели',
      allModules: 'Все модули',
      columnModule: 'Модуль',
      empty: 'Никого не найдено по этим условиям',
    },
    bulk: {
      changeModuleStatus: 'Изменить статус модуля',
      assignCourseSchool: 'Назначить курс / школу',
      trainingTypeNoChange: 'Тип обучения — не менять',
      schoolNoChange: 'Школа — не менять',
      applyButton: 'Применить',
      notApplicableWarning: 'Этот модуль не назначен ни одному из выбранных учителей (не совпадает группа классов).',
      partiallyAppliedWarning: 'Статус применён к {applied} из {total} выбранных — остальным этот модуль не назначен.',
    },
    detail: {
      basicInfo: 'Основная информация',
      schoolAndTraining: 'Школа и обучение',
      moduleResults: 'Результаты модулей',
      averageResult: 'Средний результат',
      internalNote: 'Внутренняя заметка',
      editTitle: 'Редактирование данных',
      saveChanges: 'Сохранить изменения',
      openFullProfile: 'Открыть полную карточку',
      openInLms: 'Перейти в LMS',
      fields: {
        fullName: 'ФИО',
        fin: 'FIN',
        phone: 'Телефон',
        lmsId: 'LMS ID',
        language: 'Язык',
        school: 'Школа',
        district: 'Tabeçilik',
        trainingType: 'Тип обучения',
        gradeGroup: 'Классы',
        lifecycleStatus: 'OLD / NEW',
        platformStatus: 'Статус платформы',
        classesTaught: 'Назначенные классы',
        startYear: 'Год начала / стаж',
        email: 'Email / Почта',
      },
      notePlaceholder: 'Внутренняя заметка администратора — не видна учителю…',
    },
    exportMenu: {
      title: 'Настройка экспорта Excel',
      selectAll: 'Выбрать все',
      clearAll: 'Сбросить все',
      download: 'Скачать файл',
      modulesLabel: 'Модули (сводная ведомость)',
    },
    statistics: {
      title: 'Статистика',
      subtitle: 'Распределение учителей по ключевым признакам',
      byTrainingType: 'По типу обучения',
      byGradeGroup: 'По классам',
      byLifecycle: 'По статусу OLD / NEW',
      byPlatformStatus: 'По статусу платформы',
      byModule: 'По результатам модулей (доля прошедших)',
      passedOf: 'сдали',
      expandHint: 'Подробности по каждому модулю — во вкладках «2–4 классы» и «5–9 классы» выше',
      tooltipTrainingType: 'Распределение учителей по способу обучения: асинхронно, онлайн или очно.',
      tooltipGradeGroup: 'Доля учителей каждой параллели, у которых сданы все назначенные модули (≥70%) или статус «Старый учитель».',
      tooltipLifecycle: 'OLD — учителя, уже работавшие в системе ранее. NEW — новые учителя, добавленные в этом цикле обучения.',
      tooltipPlatformStatus: 'Доля учителей, которые хотя бы раз заходили на обучающую платформу.',
      tooltipModule: 'Доля со статусом «Сдал» среди учителей, которые уже начали проходить этот модуль.',
      tabOverview: 'Общая статистика',
      kpiAttestationTitle: 'Сдали аттестацию',
      kpiAttestationHint: '% учителей, сдавших все свои модули (или статус OLD)',
      kpiPlatformActivityTitle: 'Активность на платформе',
      trainingTypeSummaryTitle: 'Сводка по типам обучения',
      columnTeacherCount: 'Учителей',
      columnEnteredPercent: '% заходивших',
      columnSuccessRatePercent: '% успеваемости',
      moduleByTrainingTypeTitle: 'По типам обучения (Tədris növü)',
      moduleByLifecycleTitle: 'По стажу (Old / New)',
    },
    pagination: {
      shown: 'Показано',
      perPage: 'на странице',
      page: 'Стр.',
    },
    deadlines: {
      assignedLabel: 'Назначено аттестаций',
      dueLabel: 'Наступило дедлайнов',
      passedLabel: 'Фактически сдал',
      percentLabel: '% Успеваемости',
      resultHint: 'Сдано {passed} из {due} наступивших дедлайнов',
      resultHintAllModules: 'Сдано {passed} из {assigned} назначенных модулей',
      cardTitle: 'Аттестации по программе',
      notAvailable: '—',
    },
    anomalies: {
      title: 'Выявленные аномалии данных LMS',
      hint: 'Автоматический поиск технических сбоев выгрузки: одиночные пропуски у в целом успешных учителей и массовые пропуски по модулю в конкретной группе.',
      checkLms: 'Проверить LMS',
      tooltipText: 'Высокая вероятность сбоя выгрузки LMS: остальные модули сданы успешно',
      groupRowLabel: '⚠️ Подозрение на сбой LMS (0% у всей группы)',
      noneFound: 'Аномалий не найдено — данные выглядят последовательно.',
      individualSectionTitle: 'Индивидуальные аномалии',
      groupSectionTitle: 'Массовые аномалии по группам',
      groupErrorLabel: 'Ошибка выгрузки LMS',
      flaggedModulesLabel: 'Подозрительные модули',
      zeroRatioSuffix: 'нулей',
      teachersSuffix: 'учителей',
      onlyAnomaliesFilter: 'Только на проверку LMS',
    },
  },
  az: {
    nav: {
      brandTitle: 'Müəllimlərin təlimi 26/27',
      brandSubtitle: 'Müəllim təliminin monitorinqi',
      projectLabel: 'Müəllimlərin təlimi 26/27',
      home: 'Əsas səhifə',
      teachers: 'Müəllimlər (2–9-cu siniflər)',
      seniorGrades: '10–11-ci siniflər (İT)',
      statistics: 'Statistika',
    },
    common: {
      search: 'Ad, soyad, məktəb, FİN və ya LMS ID üzrə axtarış…',
      reset: 'Sıfırla',
      resetAllFilters: 'Bütün filtrləri sıfırla',
      apply: 'Tətbiq et',
      exportCsv: 'Excel/CSV ixracı',
      save: 'Yadda saxla',
      saveNote: 'Qeydi yadda saxla',
      cancel: 'Ləğv et',
      edit: 'Redaktə et',
      backToList: 'Siyahıya qayıt',
      saved: 'Yadda saxlanıldı',
      any: 'İstənilən',
      all: 'Hamısı',
      loading: 'Məlumatlar yüklənir…',
      notFound: 'Müəllim tapılmadı.',
      noData: 'məlumat yoxdur',
      selected: 'Seçildi',
      clearSelection: 'Seçimi ləğv et',
      selectAllOnPage: 'Səhifədəki hamısını seç',
      filtersToggle: 'Filtrlər ⚙️',
      of: '/',
      found: 'Tapıldı',
      close: 'Bağla',
      refreshData: 'Məlumatları yenilə',
      refreshing: 'Yenilənir…',
      retry: 'Yenidən cəhd et',
      columnsToggle: 'Sütunlar',
      classNotAssigned: 'Sinif təyin edilməyib',
      classNotAssignedFilter: 'Sinif təyin edilməyib',
    },
    moduleStatus: {
      passed: '🟢 Keçdi',
      failed: '🔴 Keçmədi',
      notStarted: '⚪ Başlamayıb',
      onReview: '🔍 Yoxlanılmalı',
      notAssigned: 'N/A',
      notAssignedTooltip: 'Paralel müəllimə təyin edilməyib',
      oldTeacher: 'Köhnə müəllim',
      oldTeacherShort: 'OLD',
    },
    platformStatus: {
      entered: 'Daxil olub',
      notEntered: 'Daxil olmayıb',
    },
    gradeGroup: {
      '2-4': '2–4-cü siniflər',
      '5-9': '5–9-cu siniflər',
      '10-11': '10–11-ci siniflər',
    },
    trainingType: {
      asinxron: 'Asinxron',
      onlayn: 'Onlayn',
      əyani: 'Əyani',
    },
    language: {
      az: 'Azərbaycan',
      ru: 'Rus',
    },
    columns: {
      fullName: 'Ad, soyad',
      school: 'Məktəb',
      district: 'Tabeçilik',
      gradeGroup: 'Sinif',
      trainingType: 'Təhsil növü',
      lifecycleStatus: 'OLD/NEW',
      platformStatus: 'Platforma',
      result: 'Nəticə',
      averageScore: '📈 Orta nəticə, %',
      note: 'Qeyd',
      moduleColumns: 'Ayrı-ayrı modullar (M1, M2, M3…)',
    },
    dashboard: {
      title: 'Əsas səhifə',
      subtitle: '«Müəllimlərin təlimi 26/27» layihəsi üzrə müəllimlər haqqında ümumi mənzərə',
      totalTeachers: 'Ümumi müəllim sayı',
      entered: 'Platformaya daxil olanlar',
      notEntered: 'Daxil olmayanlar',
      successRate: 'Kursu keçdi',
      successRateHint: 'müəllim sayı, modul cəmi deyil',
      ofTotal: 'ümumi sayın',
      moduleStatsTitle: 'Kursu keçdi (paralellər üzrə)',
      moduleDetailTitle: 'Hər modul üzrə təfərrüat',
      passedOf: 'keçdi',
      successRateTooltip: 'Müəllim, təyin edilmiş bütün modulları (≥70%) keçibsə, ya da «Köhnə müəllim» statusundadırsa, kursu keçmiş sayılır.',
      enteredTooltip: 'Ən azı bir dəfə tədris platformasına daxil olmuş müəllimlər.',
      notEnteredTooltip: 'Platformaya heç vaxt daxil olmayan müəllimlər — bütün modulları «Başlamayıb» statusundadır.',
      teachersPassedFormat: '{total} müəllimdən {passed}-i kursu keçib ({percent}%)',
      moduleGridEmpty: 'Bu paralel üzrə məlumat yoxdur',
    },
    teachers: {
      title: 'Müəllimlər',
      subtitle: '2–4 və 5–9-cu siniflər. 10–11-ci siniflər üçün menyuda ayrıca bölmə var.',
    },
    senior: {
      title: '10–11-ci siniflər',
      subtitle: 'Yuxarı siniflər üçün ayrıca proqram və modullar',
    },
    tabs: {
      allTeachers: 'Bütün müəllimlər',
      moduleReport: 'Modul üzrə hesabat',
    },
    filters: {
      treeTitle: 'Filtr ağacı',
      locationSection: 'Tabeçilik və məktəb',
      gradeSection: 'Paralel',
      lifecycleSection: 'Müəllim statusu (OLD / NEW)',
      moduleSection: 'Modul statusu',
      sectorSection: 'Bölmə',
      sectorAll: 'Hamısı',
      anyModule: 'İstənilən modul',
      anyStatus: 'İstənilən status',
      trainingTypeLabel: 'Təhsil növü',
      platformStatusLabel: 'Keçmə statusu',
      districtLabel: 'Tabeçilik',
      allDistricts: 'Hamısı',
      startYearLabel: 'Başlama ili / Təcrübə',
      classesTaughtLabel: 'Siniflər',
      multiSelectAny: 'Hamısı',
      multiSelectCountSuffix: 'seçildi',
      selectAll: 'Hamısını seç',
      clearSelection: 'Təmizlə',
    },
    quickList: {
      title: 'Modula görə siyahı',
      hint: 'Paralel, modul və statusu seçin — hazır müəllim siyahısını alın.',
      gradeGroupLabel: 'Paralel',
      moduleLabel: 'Modul',
      statusLabel: 'Status',
      resultCount: 'müəllim siyahıda',
      exportButton: 'Excel/CSV ixracı',
      columnScore: 'Nəticə / Status',
      columnFormat: 'Format',
      allGradeGroups: 'Bütün paralellər',
      allModules: 'Bütün modullar',
      columnModule: 'Modul',
      empty: 'Bu şərtlərə uyğun heç kim tapılmadı',
    },
    bulk: {
      changeModuleStatus: 'Modul statusunu dəyiş',
      assignCourseSchool: 'Kurs / məktəb təyin et',
      trainingTypeNoChange: 'Təhsil növü — dəyişməyin',
      schoolNoChange: 'Məktəb — dəyişməyin',
      applyButton: 'Tətbiq et',
      notApplicableWarning: 'Bu modul seçilmiş müəllimlərin heç birinə təyin edilməyib (sinif qrupu uyğun gəlmir).',
      partiallyAppliedWarning: 'Status seçilmiş {total} müəllimdən {applied}-ə tətbiq edildi — qalanlarına bu modul təyin edilməyib.',
    },
    detail: {
      basicInfo: 'Əsas məlumat',
      schoolAndTraining: 'Məktəb və təhsil',
      moduleResults: 'Modul nəticələri',
      averageResult: 'Orta nəticə',
      internalNote: 'Daxili qeyd',
      editTitle: 'Məlumatların redaktəsi',
      saveChanges: 'Dəyişiklikləri yadda saxla',
      openFullProfile: 'Tam kartı aç',
      openInLms: 'LMS-ə keç',
      fields: {
        fullName: 'Ad, soyad',
        fin: 'FİN',
        phone: 'Telefon',
        lmsId: 'LMS ID',
        language: 'Dil',
        school: 'Məktəb',
        district: 'Tabeçilik',
        trainingType: 'Təhsil növü',
        gradeGroup: 'Sinif',
        lifecycleStatus: 'OLD / NEW',
        platformStatus: 'Platforma statusu',
        classesTaught: 'Təyin edilmiş siniflər',
        startYear: 'Başlama ili / təcrübə',
        email: 'E-mail / Poçt',
      },
      notePlaceholder: 'Administrasiyanın daxili qeydi — müəllimə görünmür…',
    },
    exportMenu: {
      title: 'Excel ixracının tənzimlənməsi',
      selectAll: 'Hamısını seç',
      clearAll: 'Hamısını təmizlə',
      download: 'Faylı yüklə',
      modulesLabel: 'Modullar (tam cədvəl)',
    },
    statistics: {
      title: 'Statistika',
      subtitle: 'Müəllimlərin əsas göstəricilər üzrə bölgüsü',
      byTrainingType: 'Təhsil növü üzrə',
      byGradeGroup: 'Siniflər üzrə',
      byLifecycle: 'OLD / NEW statusu üzrə',
      byPlatformStatus: 'Platforma statusu üzrə',
      byModule: 'Modul nəticələri üzrə (keçmə payı)',
      passedOf: 'keçdi',
      expandHint: 'Hər modul üzrə təfərrüat — yuxarıdakı «2–4 sinif» və «5–9 sinif» sekmelerinde',
      tooltipTrainingType: 'Müəllimlərin təhsil üsuluna görə bölgüsü: asinxron, onlayn və ya əyani.',
      tooltipGradeGroup: 'Hər paraleldə təyin edilmiş bütün modulları (≥70%) keçmiş və ya «Köhnə müəllim» statuslu müəllimlərin payı.',
      tooltipLifecycle: 'OLD — sistemdə əvvəllər işləmiş müəllimlər. NEW — bu tədris dövründə əlavə olunan yeni müəllimlər.',
      tooltipPlatformStatus: 'Ən azı bir dəfə tədris platformasına daxil olmuş müəllimlərin payı.',
      tooltipModule: 'Bu modula artıq başlamış müəllimlər arasında «Keçdi» statuslu olanların payı.',
      tabOverview: 'Ümumi statistika',
      kpiAttestationTitle: 'Attestasiyanı keçdi',
      kpiAttestationHint: 'bütün modulları keçmiş (və ya OLD statuslu) müəllimlərin %-i',
      kpiPlatformActivityTitle: 'Platformada aktivlik',
      trainingTypeSummaryTitle: 'Təhsil növləri üzrə xülasə',
      columnTeacherCount: 'Müəllim',
      columnEnteredPercent: '% daxil olub',
      columnSuccessRatePercent: '% müvəffəqiyyət',
      moduleByTrainingTypeTitle: 'Tədris növü üzrə',
      moduleByLifecycleTitle: 'Təcrübəyə görə (Old / New)',
    },
    pagination: {
      shown: 'Göstərilir:',
      perPage: 'səhifədə',
      page: 'Səh.',
    },
    deadlines: {
      assignedLabel: 'Təyin edilmiş attestasiyalar',
      dueLabel: 'Çatmış son tarixlər',
      passedLabel: 'Faktiki keçdi',
      percentLabel: '% Müvəffəqiyyət',
      resultHint: 'Çatmış son tarixlərdən {due}-dan {passed}-i təhvil verilib',
      resultHintAllModules: 'Təyin edilmiş {assigned} moduldan {passed}-i təhvil verilib',
      cardTitle: 'Proqram üzrə attestasiyalar',
      notAvailable: '—',
    },
    anomalies: {
      title: 'Aşkar edilmiş LMS məlumat anomaliyaları',
      hint: 'Yükləmə xətalarının avtomatik axtarışı: ümumilikdə uğurlu müəllimlərdə tək boşluqlar və konkret qrupda modul üzrə kütləvi boşluqlar.',
      checkLms: 'LMS-i yoxla',
      tooltipText: 'LMS yükləmə xətası ehtimalı yüksəkdir: qalan modullar uğurla keçilib',
      groupRowLabel: '⚠️ LMS nasazlığı şübhəsi (bütün qrupda 0%)',
      noneFound: 'Anomaliya tapılmadı — məlumatlar ardıcıl görünür.',
      individualSectionTitle: 'Fərdi anomaliyalar',
      groupSectionTitle: 'Qruplar üzrə kütləvi anomaliyalar',
      groupErrorLabel: 'LMS yükləmə xətası',
      flaggedModulesLabel: 'Şübhəli modullar',
      zeroRatioSuffix: 'sıfır',
      teachersSuffix: 'müəllim',
      onlyAnomaliesFilter: 'Yalnız LMS yoxlanılası',
    },
  },
};
