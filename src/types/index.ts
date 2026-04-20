export type Role = 'student' | 'admin'

export interface Profile {
  id: string
  phone: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  level: string | null
  total_duration: number
  rating: number
  is_published: boolean
  created_at: string
  lessons?: Lesson[]
  _count?: { lessons: number }
  user_progress?: UserProgress[]
  is_favorited?: boolean
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  // Legacy URL field — kept for backward compatibility
  video_url: string | null
  // Storage-based delivery (preferred)
  video_bucket: string | null
  video_path:   string | null
  video_type:   'storage' | 'youtube' | 'vimeo' | 'direct' | null
  duration: number
  order_index: number
  is_downloadable: boolean
  is_protected: boolean
  created_at: string
  course?: Pick<Course, 'id' | 'title' | 'slug'>
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  watched_seconds: number
  completed_at: string | null
}

export interface Note {
  id: string
  user_id: string
  lesson_id: string
  title: string | null
  content: string | null
  created_at: string
  updated_at: string
  lesson?: Pick<Lesson, 'id' | 'title' | 'course_id'> & { course?: Pick<Course, 'id' | 'title' | 'slug'> }
}

export interface Favorite {
  id: string
  user_id: string
  course_id: string
  created_at: string
  course?: Course
}

export interface HistoryEntry {
  id: string
  user_id: string
  lesson_id: string
  viewed_at: string
  lesson?: Lesson & { course?: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail_url'> }
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Download {
  id: string
  user_id: string
  lesson_id: string
  file_name: string | null
  file_url: string | null
  downloaded_at: string
  status: string | null
  lesson?: Pick<Lesson, 'id' | 'title' | 'is_downloadable'> & { course?: Pick<Course, 'id' | 'title' | 'slug'> }
}

export interface DashboardStats {
  completedLessons: number
  inProgress: number
  totalNotes: number
  totalFavorites: number
}

export interface StudentLessonAccess {
  id: string
  student_id: string
  lesson_id: string
  granted_at: string
  granted_by: string | null
}
