import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ─── Landing (Login) ────────────────────────────────
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

    // ─── User Register ──────────────────────────────────
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

    // ─── Protected Routes (Logged in users) ─────────────
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
        }
      ]
    },

    // ─── Admin & Manager Console Routes ──────────────────
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAdminOrManager: true },
      children: [
        {
          path: '',
          redirect: '/admin/assets'
        },
        {
          path: 'assets',
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

  // Already logged in? Redirect from Login page to Home
  if (to.name === 'Login' && auth.user) {
    return next({ name: 'Home' })
  }

  // Auth-required routes
  if (to.meta.requiresAuth && !auth.user) {
    return next({ name: 'Login' })
  }

  // Admin or Manager required routes
  if (to.matched.some(record => record.meta.requiresAdminOrManager)) {
    if (!auth.user) return next({ name: 'Login' })
    if (!auth.isAdmin && !auth.isManager) return next({ name: 'Home' })
  }

  // Specific Admin-required routes
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!auth.user) return next({ name: 'Login' })
    if (!auth.isAdmin) {
      // If it's a manager, redirect them to their allowed page (assets)
      if (auth.isManager) return next({ name: 'AdminAssets' })
      return next({ name: 'Home' })
    }
  }

  // Mandatory password change check
  if (auth.user?.mustChangePassword && !['ChangePassword', 'Login'].includes(to.name)) {
    return next({ name: 'ChangePassword' })
  }

  next()
})

export default router
