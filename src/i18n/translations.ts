import type { GradeGroup, TeachingLanguage, TrainingType } from '../types/teacher';

export type Locale = 'ru' | 'az';

export interface Dict {
  nav: {
    home: string;
    teachers: string;
    seniorGrades: string;
    statistics: string;
    footerNote: string;
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
  };
  moduleStatus: {
    passed: string;
    failed: string;
    notStarted: string;
    onReview: string;
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
    };
    notePlaceholder: string;
  };
  exportMenu: {
    title: string;
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
      home: 'Главная',
      teachers: 'Учителя',
      seniorGrades: '10–11 классы',
      statistics: 'Статистика',
      footerNote: 'Тестовые данные · 50 учителей',
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
    },
    moduleStatus: {
      passed: '🟢 Сдал',
      failed: '🔴 Не сдал',
      notStarted: '⚪ Не начал',
      onReview: '🔍 На проверку',
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
      district: 'Район',
      gradeGroup: 'Классы',
      trainingType: 'Тип обучения',
      lifecycleStatus: 'OLD/NEW',
      platformStatus: 'Платформа',
      result: 'Результат',
      averageScore: '📈 Средний результат, %',
      note: 'Заметка',
    },
    dashboard: {
      title: 'Главная',
      subtitle: 'Общая картина по учителям проекта «ЦН обучение 26/27»',
      totalTeachers: 'Всего учителей',
      entered: 'Вошли на платформу',
      notEntered: 'Не вошли',
      successRate: 'Успеваемость по модулям',
      successRateHint: 'доля пройденных результатов среди начатых',
      ofTotal: 'от общего числа',
      moduleStatsTitle: 'Статистика по модулям (по группам классов)',
      moduleDetailTitle: 'Детализация по каждому модулю',
      passedOf: 'сдали',
      successRateTooltip: 'Доля модулей со статусом «Сдал» среди всех модулей, которые учителя уже начали проходить (не считая «Не начал»).',
      enteredTooltip: 'Учителя, которые хотя бы раз заходили на обучающую платформу.',
      notEnteredTooltip: 'Учителя, которые ни разу не заходили на платформу — у них все модули со статусом «Не начал».',
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
      locationSection: 'Район / город и школа',
      gradeSection: 'Параллель',
      lifecycleSection: 'Статус учителя (OLD / NEW)',
      moduleSection: 'Статус модуля',
      sectorSection: 'Сектор',
      sectorAll: 'Все',
      anyModule: 'Любой модуль',
      anyStatus: 'Любой статус',
      trainingTypeLabel: 'Тип обучения',
      platformStatusLabel: 'Статус платформы',
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
      fields: {
        fullName: 'ФИО',
        fin: 'FIN',
        phone: 'Телефон',
        lmsId: 'LMS ID',
        language: 'Язык',
        school: 'Школа',
        district: 'Район',
        trainingType: 'Тип обучения',
        gradeGroup: 'Классы',
        lifecycleStatus: 'OLD / NEW',
        platformStatus: 'Статус платформы',
        classesTaught: 'Назначенные классы',
      },
      notePlaceholder: 'Внутренняя заметка администратора — не видна учителю…',
    },
    exportMenu: {
      title: 'Столбцы для экспорта',
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
      expandHint: 'нажмите, чтобы раскрыть модули',
      tooltipTrainingType: 'Распределение учителей по способу обучения: асинхронно, онлайн или очно.',
      tooltipGradeGroup: 'Сколько учителей ведут какую параллель классов. Нажмите на строку, чтобы увидеть результаты по модулям этой параллели.',
      tooltipLifecycle: 'OLD — учителя, уже работавшие в системе ранее. NEW — новые учителя, добавленные в этом цикле обучения.',
      tooltipPlatformStatus: 'Доля учителей, которые хотя бы раз заходили на обучающую платформу.',
      tooltipModule: 'Доля со статусом «Сдал» среди учителей, которые уже начали проходить этот модуль.',
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
      home: 'Əsas səhifə',
      teachers: 'Müəllimlər',
      seniorGrades: '10–11-ci siniflər',
      statistics: 'Statistika',
      footerNote: 'Test məlumatları · 50 müəllim',
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
    },
    moduleStatus: {
      passed: '🟢 Keçdi',
      failed: '🔴 Keçmədi',
      notStarted: '⚪ Başlamayıb',
      onReview: '🔍 Yoxlanılmalı',
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
      district: 'Rayon',
      gradeGroup: 'Sinif',
      trainingType: 'Təhsil növü',
      lifecycleStatus: 'OLD/NEW',
      platformStatus: 'Platforma',
      result: 'Nəticə',
      averageScore: '📈 Orta nəticə, %',
      note: 'Qeyd',
    },
    dashboard: {
      title: 'Əsas səhifə',
      subtitle: '«ÇN təhsil 26/27» layihəsi üzrə müəllimlər haqqında ümumi mənzərə',
      totalTeachers: 'Ümumi müəllim sayı',
      entered: 'Platformaya daxil olanlar',
      notEntered: 'Daxil olmayanlar',
      successRate: 'Modullar üzrə müvəffəqiyyət',
      successRateHint: 'başlanmış nəticələr arasında keçilmiş faiz',
      ofTotal: 'ümumi sayın',
      moduleStatsTitle: 'Modullar üzrə statistika (sinif qrupları üzrə)',
      moduleDetailTitle: 'Hər modul üzrə təfərrüat',
      passedOf: 'keçdi',
      successRateTooltip: 'Müəllimlərin artıq başladığı modullar arasında (Başlamayıb hesaba alınmır) «Keçdi» statuslu modulların payı.',
      enteredTooltip: 'Ən azı bir dəfə tədris platformasına daxil olmuş müəllimlər.',
      notEnteredTooltip: 'Platformaya heç vaxt daxil olmayan müəllimlər — bütün modulları «Başlamayıb» statusundadır.',
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
      locationSection: 'Rayon / şəhər və məktəb',
      gradeSection: 'Paralel',
      lifecycleSection: 'Müəllim statusu (OLD / NEW)',
      moduleSection: 'Modul statusu',
      sectorSection: 'Bölmə',
      sectorAll: 'Hamısı',
      anyModule: 'İstənilən modul',
      anyStatus: 'İstənilən status',
      trainingTypeLabel: 'Təhsil növü',
      platformStatusLabel: 'Platforma statusu',
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
      fields: {
        fullName: 'Ad, soyad',
        fin: 'FİN',
        phone: 'Telefon',
        lmsId: 'LMS ID',
        language: 'Dil',
        school: 'Məktəb',
        district: 'Rayon',
        trainingType: 'Təhsil növü',
        gradeGroup: 'Sinif',
        lifecycleStatus: 'OLD / NEW',
        platformStatus: 'Platforma statusu',
        classesTaught: 'Təyin edilmiş siniflər',
      },
      notePlaceholder: 'Administrasiyanın daxili qeydi — müəllimə görünmür…',
    },
    exportMenu: {
      title: 'İxrac üçün sütunlar',
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
      expandHint: 'modulları görmək üçün klikləyin',
      tooltipTrainingType: 'Müəllimlərin təhsil üsuluna görə bölgüsü: asinxron, onlayn və ya əyani.',
      tooltipGradeGroup: 'Hansı paralellə neçə müəllimin işlədiyi. Həmin paralelin modul nəticələrini görmək üçün sətrə klikləyin.',
      tooltipLifecycle: 'OLD — sistemdə əvvəllər işləmiş müəllimlər. NEW — bu tədris dövründə əlavə olunan yeni müəllimlər.',
      tooltipPlatformStatus: 'Ən azı bir dəfə tədris platformasına daxil olmuş müəllimlərin payı.',
      tooltipModule: 'Bu modula artıq başlamış müəllimlər arasında «Keçdi» statuslu olanların payı.',
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
