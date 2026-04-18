export const APP_NAME = 'BacEnglish'
export const APP_DESCRIPTION = 'Plateforme d\'apprentissage de l\'anglais pour les lycéens mauritaniens'

export const BAC_EXAM_DATE = new Date('2026-06-15')

export const MAURITANIA_PHONE_REGEX = /^\+222[234678]\d{7}$/

export const COURSE_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'] as const
export const COURSE_CATEGORIES = [
  'Grammaire',
  'Vocabulaire',
  'Compréhension',
  'Expression',
  'Listening',
  'Speaking',
  'Exam Prep',
] as const

export const ROUTES = {
  home: '/',
  login: '/login',
  verifyOtp: '/verify-otp',
  dashboard: '/dashboard',
  courses: '/courses',
  notes: '/notes',
  favorites: '/favorites',
  history: '/history',
  downloads: '/downloads',
  notifications: '/notifications',
  profile: '/profile',
  settings: '/settings',
  help: '/help',
  admin: '/admin',
  adminStudents: '/admin/students',
  adminCourses: '/admin/courses',
  adminLessons: '/admin/lessons',
  adminNotifications: '/admin/notifications',
  adminAnalytics: '/admin/analytics',
} as const
