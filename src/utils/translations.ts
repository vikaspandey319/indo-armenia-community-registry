import { AppLanguage } from '../types/member';

export interface Translations {
  orgName: string;
  tagline: string;
  formTitle: string;
  formSubtitle: string;
  adminPortalTitle: string;
  photoUploadLabel: string;
  photoUploadHint: string;
  photoChangeLabel: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  countryLabel: string;
  countryPlaceholder: string;
  whatsappLabel: string;
  whatsappPlaceholder: string;
  whatsappHelp: string;
  arrivalDateLabel: string;
  arrivalDatePlaceholder: string;
  agentNameLabel: string;
  agentNamePlaceholder: string;
  submitButton: string;
  submittingButton: string;
  successTitle: string;
  successSubtitle: string;
  memberIdBadge: string;
  downloadCardButton: string;
  printCardButton: string;
  registerAnotherButton: string;
  navRegister: string;
  navAdmin: string;
  seniorMode: string;
  highContrast: string;
  dataSecurityNotice: string;
}

export const translations: Record<AppLanguage, Translations> = {
  en: {
    orgName: 'Indo Armenia LLC',
    tagline: 'Global Partnership · Indian Community Registration',
    formTitle: 'Member Registration Portal',
    formSubtitle:
      'Official digital registry for members of the Indian community. Register to receive your official Indo Armenia LLC Member ID Card.',
    adminPortalTitle: 'Admin Central Console',
    photoUploadLabel: 'Upload Photo *',
    photoUploadHint: 'Click to upload or take a portrait photo. Supported: JPG, PNG, WEBP.',
    photoChangeLabel: 'Change Photo',
    fullNameLabel: 'Full Name (as per Passport / ID) *',
    fullNamePlaceholder: 'e.g. Rajesh Kumar Sharma',
    countryLabel: 'Home country *',
    countryPlaceholder: 'e.g. India',
    whatsappLabel: 'WhatsApp No *',
    whatsappPlaceholder: '98 123456',
    whatsappHelp: 'Required for official digital ID card dispatch and community notifications.',
    arrivalDateLabel: 'Arrival Date in Armenia *',
    arrivalDatePlaceholder: 'YYYY-MM-DD',
    agentNameLabel: 'Agency / Agent Name (home country) *',
    agentNamePlaceholder: 'e.g. Global Overseas Travels, Agent name, or Direct / Self',
    submitButton: 'Register & Generate Member ID',
    submittingButton: 'Generating Secure ID...',
    successTitle: 'Registration Successful!',
    successSubtitle: 'Welcome to Indo Armenia LLC! Your official Member ID has been generated.',
    memberIdBadge: 'Official Member ID',
    downloadCardButton: 'Download Digital ID Badge',
    printCardButton: 'Print ID Card',
    registerAnotherButton: 'Register Another Member',
    navRegister: 'Registration Form',
    navAdmin: 'Admin Portal',
    seniorMode: 'Text Size',
    highContrast: 'High Contrast',
    dataSecurityNotice:
      'All submitted data is safe and encrypted with secure cloud backup integration.',
  },

  hi: {
    orgName: 'इंडो आर्मेनिया एलएलसी (Indo Armenia LLC)',
    tagline: 'ग्लोबल पार्टनरशिप · भारतीय समुदाय पंजीकरण',
    formTitle: 'सदस्य पंजीकरण पोर्टल',
    formSubtitle:
      'भारतीय समुदाय के सदस्यों के लिए आधिकारिक डिजिटल पंजीकरण। अपना आधिकारिक सदस्य पहचान पत्र (ID Card) प्राप्त करें।',
    adminPortalTitle: 'प्रशासक पोर्टल (Admin Portal)',
    photoUploadLabel: 'फोटो अपलोड करें *',
    photoUploadHint: 'स्पष्ट फोटो अपलोड करने के लिए यहां क्लिक करें।',
    photoChangeLabel: 'फोटो बदलें',
    fullNameLabel: 'पूरा नाम (पासपोर्ट / पहचान पत्र के अनुसार) *',
    fullNamePlaceholder: 'उदा. राजेश कुमार शर्मा',
    countryLabel: 'Home country / गृह देश *',
    countryPlaceholder: 'उदा. भारत (India)',
    whatsappLabel: 'WhatsApp No *',
    whatsappPlaceholder: '98 123456',
    whatsappHelp: 'आधिकारिक डिजिटल पहचान पत्र एवं सूचनाएं व्हाट्सएप पर भेजने के लिए आवश्यक।',
    arrivalDateLabel: 'आर्मेनिया आगमन तिथि (Arrival Date in Armenia) *',
    arrivalDatePlaceholder: 'YYYY-MM-DD',
    agentNameLabel: 'Agency / Agent Name (home country) *',
    agentNamePlaceholder: 'उदा. एजेंसी का नाम, एजेंट का नाम अथवा स्वयं / डायरेक्ट',
    submitButton: 'पंजीकरण करें एवं सदस्य ID प्राप्त करें',
    submittingButton: 'सुरक्षित ID जनरेट हो रही है...',
    successTitle: 'पंजीकरण सफलतापूर्वक पूर्ण हुआ!',
    successSubtitle: 'इंडो आर्मेनिया एलएलसी में आपका स्वागत है! आपका सदस्य ID सुरक्षित रूप से जनरेट हो चुका है।',
    memberIdBadge: 'आधिकारिक सदस्य पहचान संख्या (Member ID)',
    downloadCardButton: 'डिजिटल ID कार्ड डाउनलोड करें',
    printCardButton: 'ID कार्ड प्रिंट करें',
    registerAnotherButton: 'अन्य सदस्य का पंजीकरण करें',
    navRegister: 'पंजीकरण फॉर्म',
    navAdmin: 'एडमिन पोर्टल',
    seniorMode: 'अक्षर आकार',
    highContrast: 'उच्च कंट्रास्ट',
    dataSecurityNotice:
      'सभी प्रस्तुत डेटा सुरक्षित, एन्क्रिप्टेड एवं क्लाउड बैकअप एकीकृत है।',
  },

  hy: {
    orgName: 'Ինդո Արմենիա ՍՊԸ (Indo Armenia LLC)',
    tagline: 'Գլոբալ Գործընկերություն · Հնդկական համայնքի գրանցում',
    formTitle: 'Անդամների գրանցման պորտալ',
    formSubtitle:
      'Հնդկական համայնքի անդամների պաշտոնական թվային գրանցում: Ստացեք պաշտոնական անդամատոմս:',
    adminPortalTitle: 'Ադմինիստրատիվ վահանակ',
    photoUploadLabel: 'Վերբեռնել լուսանկարը *',
    photoUploadHint: 'Սեղմեք լուսանկար վերբեռնելու համար:',
    photoChangeLabel: 'Փոխել լուսանկարը',
    fullNameLabel: 'Ամբողջական անուն (ըստ անձնագրի) *',
    fullNamePlaceholder: 'օրինակ՝ Ռաջեշ Կումար',
    countryLabel: 'Home country / Երկիր *',
    countryPlaceholder: 'օրինակ՝ Հնդկաստան',
    whatsappLabel: 'WhatsApp No *',
    whatsappPlaceholder: '98 123456',
    whatsappHelp: 'Անհրաժեշտ է թվային անդամատոմսն ուղարկելու համար:',
    arrivalDateLabel: 'Arrival Date in Armenia (Ժամանման ամսաթիվ) *',
    arrivalDatePlaceholder: 'YYYY-MM-DD',
    agentNameLabel: 'Agency / Agent Name (home country) *',
    agentNamePlaceholder: 'Գործակալության կամ գործակալի անունը',
    submitButton: 'Գրանցվել և ստանալ անդամատոմս',
    submittingButton: 'Գեներացվում է ID-ն...',
    successTitle: 'Գրանցումը հաջողությամբ կատարվեց:',
    successSubtitle: 'Բարի գալուստ Indo Armenia LLC: Ձեր պաշտոնական անդամատոմսը պատրաստ է:',
    memberIdBadge: 'Պաշտոնական անդամի ID',
    downloadCardButton: 'Ներբեռնել անդամատոմսը',
    printCardButton: 'Տպել անդամատոմսը',
    registerAnotherButton: 'Գրանցել նոր անդամ',
    navRegister: 'Գրանցման ձև',
    navAdmin: 'Ադմին պորտալ',
    seniorMode: 'Տառաչափ',
    highContrast: 'Բարձր կոնտրաստ',
    dataSecurityNotice:
      'Բոլոր տվյալները պաշտպանված են 256-բիթանոց կոդավորմամբ և ապահով ամպային պահուստավորմամբ:',
  },

  ru: {
    orgName: 'Индо Армения ООО (Indo Armenia LLC)',
    tagline: 'Глобальное Партнерство · Регистрация индийской общины',
    formTitle: 'Портал регистрации участников',
    formSubtitle:
      'Официальный цифровой реестр членов индийской общины. Зарегистрируйтесь для получения официального членского удостоверения.',
    adminPortalTitle: 'Панель управления администратора',
    photoUploadLabel: 'Загрузить фото *',
    photoUploadHint: 'Нажмите для загрузки фото (JPG, PNG, WEBP).',
    photoChangeLabel: 'Изменить фото',
    fullNameLabel: 'Полное имя (как в паспорте) *',
    fullNamePlaceholder: 'напр. Раджеш Кумар Шарма',
    countryLabel: 'Home country / Страна *',
    countryPlaceholder: 'напр. Индия',
    whatsappLabel: 'WhatsApp No *',
    whatsappPlaceholder: '98 123456',
    whatsappHelp: 'Необходим для отправки официального электронного удостоверения.',
    arrivalDateLabel: 'Arrival Date in Armenia (Дата прибытия) *',
    arrivalDatePlaceholder: 'YYYY-MM-DD',
    agentNameLabel: 'Agency / Agent Name (home country) *',
    agentNamePlaceholder: 'напр. Название агентства или имя агента',
    submitButton: 'Зарегистрироваться и получить ID',
    submittingButton: 'Генерация защищенного ID...',
    successTitle: 'Регистрация успешно завершена!',
    successSubtitle: 'Добро пожаловать в Indo Armenia LLC! Ваш официальный ID участника сгенерирован.',
    memberIdBadge: 'Официальный номер ID',
    downloadCardButton: 'Скачать цифровой билет',
    printCardButton: 'Распечатать карту',
    registerAnotherButton: 'Зарегистрировать другого участника',
    navRegister: 'Форма регистрации',
    navAdmin: 'Панель администратора',
    seniorMode: 'Размер текста',
    highContrast: 'Высокий контраст',
    dataSecurityNotice:
      'Все персональные данные защищены 256-битным шифрованием и надежным облачным резервным копированием.',
  },
};
