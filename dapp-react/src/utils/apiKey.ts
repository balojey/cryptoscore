const API_KEYS = [
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_1,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_2,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_3,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_4,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_5,
].filter(Boolean)

export function getRandomApiKey() {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys found. Make sure to set VITE_FOOTBALL_DATA_API_KEY variables in your .env file.')
  }
  const randomIndex = Math.floor(Math.random() * API_KEYS.length)
  return API_KEYS[randomIndex]
}
