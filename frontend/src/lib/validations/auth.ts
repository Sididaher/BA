import { z } from 'zod'
import { MAURITANIA_PHONE_REGEX } from '@/constants'

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(MAURITANIA_PHONE_REGEX, 'Format invalide. Exemple: +22236123456'),
})

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Le code OTP doit contenir 6 chiffres')
    .regex(/^\d+$/, 'Le code OTP ne doit contenir que des chiffres'),
})

export type PhoneInput = z.infer<typeof phoneSchema>
export type OtpInput = z.infer<typeof otpSchema>
