import { createRouter, createWebHistory } from "vue-router"
import { getToken } from "@/api/auth"

// Vues publiques
import LandingView from "@/views/LandingView.vue"
import LoginView from "@/views/auth/LoginView.vue"
import RegisterView from "@/views/auth/RegisterView.vue"
import ForgotPasswordView from "@/views/auth/ForgotPasswordView.vue"
import ResetPasswordView from "@/views/auth/ResetPasswordView.vue"
import OTPVerificationView from "@/views/auth/OTPVerificationView.vue"
import NotFoundView from "@/views/NotFoundView.vue"

// Vues business
import BusinessDashboardView from "@/views/business/DashboardView.vue"
import BusinessDeliveriesView from "@/views/business/DeliveriesView.vue"
import BusinessDeliveryDetailView from "@/views/business/DeliveryDetailView.vue"
import BusinessCouriersView from "@/views/business/CouriersView.vue"
import BusinessFinancesView from "@/views/business/FinancesView.vue"
import BusinessSettingsView from "@/views/business/SettingsView.vue"
import BusinessProfileView from "@/views/business/ProfileView.vue"
import BusinessMarketplaceView from "@/views/business/MarketplaceView.vue"
import BusinessComplaintsView from "@/views/business/ComplaintsView.vue"
import BusinessPaymentSettingsView from "@/views/business/PaymentSettingsView.vue"
import BusinessLanguageSettingsView from "@/views/business/LanguageSettingsView.vue"

// Vues manager
import ManagerDashboardView from "@/views/manager/DashboardView.vue"
import ManagerUsersView from "@/views/manager/UsersView.vue"
import ManagerDeliveriesView from "@/views/manager/DeliveriesView.vue"
import ManagerBusinessesView from "@/views/manager/BusinessesView.vue"
import ManagerFinancesView from "@/views/manager/FinancesView.vue"
import ManagerReportsView from "@/views/manager/ReportsView.vue"
import ManagerSettingsView from "@/views/manager/SettingsView.vue"
import ManagerPromotionsView from "@/views/manager/PromotionsView.vue"
import ManagerCouriersManagementView from "@/views/manager/CouriersManagementView.vue"
import ManagerNotificationsManagementView from "@/views/manager/NotificationsManagementView.vue"
import ManagerAnalyticsView from "@/views/manager/AnalyticsView.vue"
import ManagerZonesView from "@/views/manager/ZonesView.vue"
import ManagerAuditLogsView from "@/views/manager/AuditLogsView.vue"
import ManagerTrafficView from "@/views/manager/TrafficView.vue"
import ManagerKYCVerificationView from "@/views/manager/KYCVerificationView.vue"
import ManagerPoliciesView from "@/views/manager/PoliciesView.vue"
import ManagerKYCDragDropView from "@/views/manager/KYCDragDropView.vue"
import ManagerCommunityWalletView from "@/views/manager/CommunityWalletView.vue"
import ManagerCollaborativeDeliveryView from "@/views/manager/CollaborativeDeliveryView.vue"
import ManagerExpressDeliveryView from "@/views/manager/ExpressDeliveryView.vue"
import VehiclesManagementView from "@/views/manager/VehiclesManagementView.vue"
import TransportRulesView from "@/views/manager/TransportRulesView.vue"

// Vues communes
import NotificationsView from "@/views/NotificationsView.vue"
import ProfileView from "@/views/ProfileView.vue"

const routes = [
  // Routes publiques
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: ResetPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/otp-verification/:phone/:userId?",
    name: "otp-verification",
    component: OTPVerificationView,
    meta: { requiresAuth: false },
    props: true,
  },

  // Routes business
  {
    path: "/business",
    name: "business",
    component: BusinessDashboardView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/dashboard",
    name: "business-dashboard",
    component: BusinessDashboardView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/deliveries",
    name: "business-deliveries",
    component: BusinessDeliveriesView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/deliveries/:id",
    name: "business-delivery-detail",
    component: BusinessDeliveryDetailView,
    meta: { requiresAuth: true, role: "business" },
    props: true,
  },
  {
    path: "/business/couriers",
    name: "business-couriers",
    component: BusinessCouriersView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/finances",
    name: "business-finances",
    component: BusinessFinancesView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/settings",
    name: "business-settings",
    component: BusinessSettingsView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/profile",
    name: "business-profile",
    component: BusinessProfileView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/marketplace",
    name: "business-marketplace",
    component: BusinessMarketplaceView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/complaints",
    name: "business-complaints",
    component: BusinessComplaintsView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/settings/payment",
    name: "business-payment-settings",
    component: BusinessPaymentSettingsView,
    meta: { requiresAuth: true, role: "business" },
  },
  {
    path: "/business/settings/language",
    name: "business-language-settings",
    component: BusinessLanguageSettingsView,
    meta: { requiresAuth: true, role: "business" },
  },

  // Routes manager
  {
    path: "/manager",
    name: "manager",
    component: ManagerDashboardView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/dashboard",
    name: "manager-dashboard",
    component: ManagerDashboardView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/users",
    name: "manager-users",
    component: ManagerUsersView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/deliveries",
    name: "manager-deliveries",
    component: ManagerDeliveriesView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/businesses",
    name: "manager-businesses",
    component: ManagerBusinessesView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/finances",
    name: "manager-finances",
    component: ManagerFinancesView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/reports",
    name: "manager-reports",
    component: ManagerReportsView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/settings",
    name: "manager-settings",
    component: ManagerSettingsView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/promotions",
    name: "manager-promotions",
    component: ManagerPromotionsView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/couriers",
    name: "manager-couriers",
    component: ManagerCouriersManagementView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/notifications",
    name: "manager-notifications",
    component: ManagerNotificationsManagementView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/analytics",
    name: "manager-analytics",
    component: ManagerAnalyticsView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/zones",
    name: "manager-zones",
    component: ManagerZonesView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/audit-logs",
    name: "manager-audit-logs",
    component: ManagerAuditLogsView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/traffic",
    name: "manager-traffic",
    component: ManagerTrafficView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/kyc-verification",
    name: "manager-kyc-verification",
    component: ManagerKYCVerificationView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/kyc-drag-drop",
    name: "manager-kyc-drag-drop",
    component: ManagerKYCDragDropView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/policies",
    name: "manager-policies",
    component: ManagerPoliciesView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/community-wallet",
    name: "manager-community-wallet",
    component: ManagerCommunityWalletView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/collaborative-delivery",
    name: "manager-collaborative-delivery",
    component: ManagerCollaborativeDeliveryView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/express-delivery",
    name: "manager-express-delivery",
    component: ManagerExpressDeliveryView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/vehicles",
    name: "VehiclesManagement",
    component: VehiclesManagementView,
    meta: { requiresAuth: true, role: "manager" },
  },
  {
    path: "/manager/transport-rules",
    name: "TransportRules",
    component: TransportRulesView,
    meta: { requiresAuth: true, role: "manager" },
  },

  // Routes communes
  {
    path: "/notifications",
    name: "notifications",
    component: NotificationsView,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },

  // Route 404
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = getToken()
  const userRole = localStorage.getItem("userRole")
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresRole = to.matched.some((record) => record.meta.role)

  // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté
  if (requiresAuth && !token) {
    next({ name: "login", query: { redirect: to.fullPath } })
    return
  }

  // Si la route nécessite un rôle spécifique et que l'utilisateur n'a pas ce rôle
  if (requiresRole && to.meta.role !== userRole) {
    // Rediriger vers le dashboard correspondant au rôle de l'utilisateur
    if (userRole === "business") {
      next({ name: "business-dashboard" })
    } else if (userRole === "manager") {
      next({ name: "manager-dashboard" })
    } else {
      next({ name: "login" })
    }
    return
  }

  // Si l'utilisateur est connecté et essaie d'accéder à une page d'authentification
  if (
    token &&
    (to.name === "login" || to.name === "register" || to.name === "forgot-password" || to.name === "reset-password")
  ) {
    // Rediriger vers le dashboard correspondant au rôle de l'utilisateur
    if (userRole === "business") {
      next({ name: "business-dashboard" })
    } else if (userRole === "manager") {
      next({ name: "manager-dashboard" })
    } else {
      next({ name: "landing" })
    }
    return
  }

  // Si l'utilisateur est connecté et accède à la page d'accueil, rediriger vers le dashboard
  if (token && to.name === "landing") {
    if (userRole === "business") {
      next({ name: "business-dashboard" })
    } else if (userRole === "manager") {
      next({ name: "manager-dashboard" })
    } else {
      next()
    }
    return
  }

  next()
})

export default router
