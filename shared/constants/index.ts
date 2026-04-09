export const PLATFORM = 'web' as const

export const PHONE_OTP = {
  type: 'phone',
  cause: 'verify_phone',
} as const

export const SUBSCRIBE_TO_PLAN = {
  type: 'email',
  cause: 'subscribe_plan',
} as const

export const DEAL_CREATION = {
  type: 'email',
  cause: 'deal_creation',
} as const

export const EMAIL_OTP = {
  type: 'email',
  cause: 'verify_email',
} as const

export const DELETE_OTP = {
  type: 'email',
  cause: 'delete_account',
} as const

export const PASSWORD_OTP = {
  type: 'email',
  cause: 'password',
} as const

export const LOGIN_TYPE = {
  email: 'email',
  phone: 'phone',
} as const

export const SERVICE_TYPES = ['provided', 'requested'] as const

export const REPORT_REASONS = [
  {
    value: 'Not in compliance with laws, morals and public morals.',
    label: 'report-modal.report1',
  },
  {
    value: 'Alcohol, tobacco products, drugs and medicinal drugs.',
    label: 'report-modal.report2',
  },
  {
    value: 'Defective, false, damaged, misleading, stolen, or may cause damage when used.',
    label: 'report-modal.report3',
  },
  {
    value: 'The image or description does not match the product.',
    label: 'report-modal.report4',
  },
  {
    value: 'Contrary to copyright laws.',
    label: 'report-modal.report5',
  },
] as const

export const REPORT_REASONS_FOR_CHAT = [
  {
    value: 'The user sent illegal content',
    label: 'chat.report_reasons.illegal',
  },
  {
    value: 'The user sent spam',
    label: 'chat.report_reasons.spam',
  },
  {
    value: 'The user asked for payment or wanted to communicate outside of DoWorkss',
    label: 'chat.report_reasons.financial',
  },
  {
    value: 'The user behaved inappropriately',
    label: 'chat.report_reasons.harassment',
  },
  {
    value: 'The user attempted fraud or phishing',
    label: 'chat.report_reasons.scam',
  },
  {
    value: 'The user made discriminatory or hateful remarks',
    label: 'chat.report_reasons.discrimination',
  },
  {
    value: 'The user is pretending to be someone else',
    label: 'chat.report_reasons.impersonation',
  },
  {
    value: 'The user is using a fake or misleading profile',
    label: 'chat.report_reasons.fake_profile',
  },
  {
    value: 'The user made threats or tried to intimidate',
    label: 'chat.report_reasons.threats',
  },
  {
    value: 'The user delivered extremely poor or plagiarized work',
    label: 'chat.report_reasons.low_quality',
  },
] as const

export const CANCELLATION_REASONS = [
  {
    value: 'My subscription was useful for a specific time',
    label: 'plan.reason1',
  },
  {
    value: 'I did not benefit from the subscription benefits',
    label: 'plan.reason2',
  },
  {
    value: 'Subscription costs are very high',
    label: 'plan.reason3',
  },
  {
    value: 'I will use another platform',
    label: 'plan.reason4',
  },
  {
    value: 'other',
    label: 'other',
  },
] as const

export const SOCIAL_MEDIA_SHARE = {
  facebook: (link: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  twitter: (link: string, msg: string) =>
    `https://x.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}`,
  linkedIn: (link: string, msg: string) =>
    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(link)}&title=${encodeURIComponent(msg)}`,
  telegram: (link: string, msg?: string) =>
    `https://telegram.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg ?? '')}`,
  whatsapp: (link: string, msg: string) =>
    `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)} ${encodeURIComponent(link)}`,
  mailTo: (email: string) =>
    `mailto:${email}`,
} as const
