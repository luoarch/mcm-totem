const DEFAULT_SURVEY_URL = ''

export const SURVEY_FORM_URL =
  import.meta.env.VITE_SURVEY_FORM_URL && import.meta.env.VITE_SURVEY_FORM_URL.trim().length > 0
    ? import.meta.env.VITE_SURVEY_FORM_URL
    : DEFAULT_SURVEY_URL

