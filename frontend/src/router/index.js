import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const isMobileDevice = () => {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    return window.innerWidth < 768 || /android|webos|blackberry|iemobile|opera mini|mobile|mobi/i.test(userAgent) || isIOS
  }
  return false
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ==========================================
    // 🖥️ DESKTOP ROUTES
    // ==========================================
    {
      path: '/',
      name: 'Login',
      component: () => import('../views/AdminLoginView.vue'),
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore()
        if (auth.user) {
          next({ name: 'Home' })
        } else {
          next()
        }
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/change-password',
      name: 'ChangePassword',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/home',
      component: () => import('../layouts/PublicLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'assets',
          name: 'Assets',
          component: () => import('../views/AssetListView.vue')
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('../views/ProfileView.vue')
        },
        {
          path: 'admin-assets',
          name: 'AdminAssets',
          component: () => import('../views/AdminAssetManagementView.vue'),
          meta: { requiresAdminOrManager: true }
        },
        {
          path: 'approvals',
          name: 'AdminApprovals',
          component: () => import('../views/AdminApprovalView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('../views/UserManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'departments',
          name: 'DepartmentManagement',
          component: () => import('../views/DepartmentManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'categories',
          name: 'CategoryManagement',
          component: () => import('../views/CategoryManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'locations',
          name: 'LocationManagement',
          component: () => import('../views/LocationManagementView.vue'),
          meta: { requiresAdminOrManager: true }
        }
      ]
    },

    // ==========================================
    // 📱 MOBILE ROUTES (Prefixed with /m)
    // ==========================================
    {
      path: '/m',
      name: 'MobileLogin',
      component: () => import('../views/mobile/AdminLoginView.vue'),
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore()
        if (auth.user) {
          next({ name: 'MobileHome' })
        } else {
          next()
        }
      }
    },
    {
      path: '/m/register',
      name: 'MobileRegister',
      component: () => import('../views/mobile/RegisterView.vue')
    },
    {
      path: '/m/change-password',
      name: 'MobileChangePassword',
      component: () => import('../views/mobile/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/m/home',
      component: () => import('../layouts/mobile/MobilePublicLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'MobileHome',
          component: () => import('../views/mobile/HomeView.vue')
        },
        {
          path: 'assets',
          name: 'MobileAssets',
          component: () => import('../views/mobile/AssetListView.vue')
        },
        {
          path: 'profile',
          name: 'MobileProfile',
          component: () => import('../views/mobile/ProfileView.vue')
        },
        {
          path: 'admin-assets',
          name: 'MobileAdminAssets',
          component: () => import('../views/mobile/AdminAssetManagementView.vue'),
          meta: { requiresAdminOrManager: true }
        },
        {
          path: 'approvals',
          name: 'MobileAdminApprovals',
          component: () => import('../views/mobile/AdminApprovalView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'MobileUserManagement',
          component: () => import('../views/mobile/UserManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'departments',
          name: 'MobileDepartmentManagement',
          component: () => import('../views/mobile/DepartmentManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'categories',
          name: 'MobileCategoryManagement',
          component: () => import('../views/mobile/CategoryManagementView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'locations',
          name: 'MobileLocationManagement',
          component: () => import('../views/mobile/LocationManagementView.vue'),
          meta: { requiresAdminOrManager: true }
        }
      ]
    },

    // ─── Fallback Redirect ──────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.checkSession()
  }

  // 1. Mobile Detection & Automatic Redirection Redirect Guard
  const isMobile = isMobileDevice()
  const toPath = to.path

  if (isMobile && !toPath.startsWith('/m')) {
    let target = '/m' + toPath
    if (toPath === '/') target = '/m'
    target = target.replace(/\/+/g, '/')
    return next({ path: target, query: to.query, hash: to.hash })
  } else if (!isMobile && toPath.startsWith('/m')) {
    let target = toPath.slice(2)
    if (target === '' || target === '/') target = '/'
    if (!target.startsWith('/')) target = '/' + target
    target = target.replace(/\/+/g, '/')
    return next({ path: target, query: to.query, hash: to.hash })
  }

  // Already logged in? Redirect from Login page to Home
  if (['Login', 'MobileLogin'].includes(to.name) && auth.user) {
    return next(isMobile ? { name: 'MobileHome' } : { name: 'Home' })
  }

  // Auth-required routes
  if (to.meta.requiresAuth && !auth.user) {
    return next(isMobile 
      ? { name: 'MobileLogin', query: { redirect: to.fullPath } } 
      : { name: 'Login', query: { redirect: to.fullPath } }
    )
  }

  // Admin or Manager required routes
  if (to.matched.some(record => record.meta.requiresAdminOrManager)) {
    if (!auth.user) return next(isMobile ? { name: 'MobileLogin', query: { redirect: to.fullPath } } : { name: 'Login', query: { redirect: to.fullPath } })
    if (!auth.isAdmin && !auth.isManager) return next(isMobile ? { name: 'MobileHome' } : { name: 'Home' })
  }

  // Specific Admin-required routes
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!auth.user) return next(isMobile ? { name: 'MobileLogin', query: { redirect: to.fullPath } } : { name: 'Login', query: { redirect: to.fullPath } })
    if (!auth.isAdmin) {
      // If it's a manager, redirect them to their allowed page (assets)
      if (auth.isManager) return next(isMobile ? { name: 'MobileAdminAssets' } : { name: 'AdminAssets' })
      return next(isMobile ? { name: 'MobileHome' } : { name: 'Home' })
    }
  }

  // Mandatory password change check
  if (auth.user?.mustChangePassword && !['ChangePassword', 'MobileChangePassword', 'Login', 'MobileLogin'].includes(to.name)) {
    return next(isMobile ? { name: 'MobileChangePassword' } : { name: 'ChangePassword' })
  }

  next()
})

export default router
