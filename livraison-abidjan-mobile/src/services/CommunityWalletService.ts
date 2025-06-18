import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "./api"

interface Transaction {
  id: string
  amount: number
  type: "deposit" | "withdrawal" | "payment" | "refund" | "bonus" | "loan" | "repayment" | "contribution"
  status: "pending" | "completed" | "failed"
  reference?: string
  description?: string
  created_at: string
}

interface Loan {
  id: string
  user_id: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected" | "repaid"
  approved_at?: string
  repaid_at?: string
  due_date?: string
  created_at: string
}

interface WalletBalance {
  balance: number
  currency: string
  total_contributed: number
  total_borrowed: number
  available_credit: number
}

class CommunityWalletService {
  // Clés pour le cache
  private BALANCE_CACHE_KEY = "community_wallet_balance_cache"
  private TRANSACTIONS_CACHE_KEY = "community_wallet_transactions_cache"
  private ACTIVE_LOAN_CACHE_KEY = "community_wallet_active_loan_cache"
  private LOAN_HISTORY_CACHE_KEY = "community_wallet_loan_history_cache"
  private CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  /**
   * Récupère le solde du portefeuille communautaire
   */
  async getBalance(): Promise<WalletBalance | null> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedBalance()
      if (cachedData) {
        return cachedData
      }

      // Récupérer les données depuis l'API
      const response = await api.get("/community-wallet/balance")
      const balance = response.data

      // Mettre en cache les données
      await this.cacheBalance(balance)

      return balance
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
      return null
    }
  }

  /**
   * Récupère les transactions du portefeuille communautaire
   */
  async getTransactions(type?: string): Promise<Transaction[]> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedTransactions(type)
      if (cachedData) {
        return cachedData
      }

      // Récupérer les données depuis l'API
      let url = "/community-wallet/transactions"
      if (type) {
        url += `?type=${type}`
      }

      const response = await api.get(url)
      const transactions = response.data

      // Mettre en cache les données
      await this.cacheTransactions(transactions, type)

      return transactions
    } catch (error) {
      console.error("Error fetching wallet transactions:", error)
      return []
    }
  }

  /**
   * Récupère le prêt actif
   */
  async getActiveLoan(): Promise<Loan | null> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedActiveLoan()
      if (cachedData) {
        return cachedData
      }

      // Récupérer les données depuis l'API
      const response = await api.get("/community-wallet/loans/active")
      const loan = response.data

      // Mettre en cache les données
      await this.cacheActiveLoan(loan)

      return loan
    } catch (error) {
      console.error("Error fetching active loan:", error)
      return null
    }
  }

  /**
   * Récupère l'historique des prêts
   */
  async getLoanHistory(): Promise<Loan[]> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedLoanHistory()
      if (cachedData) {
        return cachedData
      }

      // Récupérer les données depuis l'API
      const response = await api.get("/community-wallet/loans/history")
      const loanHistory = response.data

      // Mettre en cache les données
      await this.cacheLoanHistory(loanHistory)

      return loanHistory
    } catch (error) {
      console.error("Error fetching loan history:", error)
      return []
    }
  }

  /**
   * Demande un prêt
   */
  async requestLoan(amount: number, reason: string): Promise<boolean> {
    try {
      const response = await api.post("/community-wallet/loans/request", { amount, reason })

      // Invalider le cache
      await this.invalidateCache()

      return response.data.success
    } catch (error) {
      console.error("Error requesting loan:", error)
      return false
    }
  }

  /**
   * Rembourse un prêt
   */
  async repayLoan(loanId: string): Promise<boolean> {
    try {
      const response = await api.post(`/community-wallet/loans/${loanId}/repay`)

      // Invalider le cache
      await this.invalidateCache()

      return response.data.success
    } catch (error) {
      console.error("Error repaying loan:", error)
      return false
    }
  }

  /**
   * Récupère le solde en cache
   */
  private async getCachedBalance(): Promise<WalletBalance | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.BALANCE_CACHE_KEY)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < this.CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached wallet balance:", error)
      return null
    }
  }

  /**
   * Met en cache le solde
   */
  private async cacheBalance(data: WalletBalance): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(this.BALANCE_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching wallet balance:", error)
    }
  }

  /**
   * Récupère les transactions en cache
   */
  private async getCachedTransactions(type?: string): Promise<Transaction[] | null> {
    try {
      const cacheKey = type ? `${this.TRANSACTIONS_CACHE_KEY}_${type}` : this.TRANSACTIONS_CACHE_KEY
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < this.CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached wallet transactions:", error)
      return null
    }
  }

  /**
   * Met en cache les transactions
   */
  private async cacheTransactions(data: Transaction[], type?: string): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      const cacheKey = type ? `${this.TRANSACTIONS_CACHE_KEY}_${type}` : this.TRANSACTIONS_CACHE_KEY
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching wallet transactions:", error)
    }
  }

  /**
   * Récupère le prêt actif en cache
   */
  private async getCachedActiveLoan(): Promise<Loan | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.ACTIVE_LOAN_CACHE_KEY)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < this.CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached active loan:", error)
      return null
    }
  }

  /**
   * Met en cache le prêt actif
   */
  private async cacheActiveLoan(data: Loan | null): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(this.ACTIVE_LOAN_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching active loan:", error)
    }
  }

  /**
   * Récupère l'historique des prêts en cache
   */
  private async getCachedLoanHistory(): Promise<Loan[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.LOAN_HISTORY_CACHE_KEY)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < this.CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached loan history:", error)
      return null
    }
  }

  /**
   * Met en cache l'historique des prêts
   */
  private async cacheLoanHistory(data: Loan[]): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(this.LOAN_HISTORY_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching loan history:", error)
    }
  }

  /**
   * Invalide le cache
   */
  private async invalidateCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BALANCE_CACHE_KEY)

      // Supprimer toutes les clés de cache de transactions
      const keys = await AsyncStorage.getAllKeys()
      const transactionCacheKeys = keys.filter((key) => key.startsWith(this.TRANSACTIONS_CACHE_KEY))
      if (transactionCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(transactionCacheKeys)
      }

      await AsyncStorage.removeItem(this.ACTIVE_LOAN_CACHE_KEY)
      await AsyncStorage.removeItem(this.LOAN_HISTORY_CACHE_KEY)
    } catch (error) {
      console.error("Error invalidating wallet cache:", error)
    }
  }

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    await this.invalidateCache()
  }
}

export default new CommunityWalletService()
