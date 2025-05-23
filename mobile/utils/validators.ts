// Valider un numéro de téléphone
export const validatePhone = (phone: string): boolean => {
  // Format pour les numéros ivoiriens (avec ou sans +225)
  const phoneRegex = /^(?:\+225)?[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

// Valider une adresse email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valider un mot de passe (au moins 6 caractères)
export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

// Valider un code postal
export const validatePostalCode = (postalCode: string): boolean => {
  // Format pour les codes postaux ivoiriens
  const postalCodeRegex = /^[0-9]{5}$/
  return postalCodeRegex.test(postalCode)
}

// Valider un montant
export const validateAmount = (amount: string): boolean => {
  const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/
  return amountRegex.test(amount) && Number.parseFloat(amount) > 0
}

// Valider une adresse
export const validateAddress = (address: string): boolean => {
  return address.trim().length >= 5
}

// Valider un nom complet
export const validateFullName = (fullName: string): boolean => {
  return fullName.trim().length >= 3 && fullName.includes(" ")
}

// Valider une description
export const validateDescription = (description: string): boolean => {
  return description.trim().length >= 10
}

// Valider un code OTP
export const validateOTP = (otp: string): boolean => {
  const otpRegex = /^[0-9]{4,6}$/
  return otpRegex.test(otp)
}
