import api from '@/lib/api'

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  description?: string
}

export interface PermissionsResponse {
  permissions: Permission[]
  grouped: Record<string, Permission[]>
}

export interface Role {
  id: string
  unitId?: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: Permission[]
  usersCount?: number
  users?: { id: string; name: string; email: string }[]
}

export interface CreateRoleInput {
  name: string
  code: string
  description?: string
  permissionIds: string[]
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissionIds?: string[]
  isActive?: boolean
}

export const rolesService = {
  // ============ UPRAWNIENIA ============

  // Pobierz wszystkie uprawnienia
  async getAllPermissions(): Promise<PermissionsResponse> {
    const response = await api.get('/roles/permissions')
    return response.data
  },

  // ============ ROLE ============

  // Pobierz role jednostki
  async getByUnit(unitId: string): Promise<Role[]> {
    const response = await api.get(`/roles/unit/${unitId}`)
    return response.data
  },

  // Pobierz pojedynczą rolę
  async getById(roleId: string): Promise<Role> {
    const response = await api.get(`/roles/${roleId}`)
    return response.data
  },

  // Utwórz rolę
  async create(unitId: string, data: CreateRoleInput): Promise<Role> {
    const response = await api.post(`/roles/unit/${unitId}`, data)
    return response.data
  },

  // Aktualizuj rolę
  async update(unitId: string, roleId: string, data: UpdateRoleInput): Promise<Role> {
    const response = await api.put(`/roles/unit/${unitId}/${roleId}`, data)
    return response.data
  },

  // Usuń rolę
  async delete(unitId: string, roleId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/roles/unit/${unitId}/${roleId}`)
    return response.data
  },

  // Kopiuj rolę
  async copy(unitId: string, roleId: string, name: string, code: string): Promise<Role> {
    const response = await api.post(`/roles/unit/${unitId}/${roleId}/copy`, { name, code })
    return response.data
  },

  // ============ SPRAWDZANIE UPRAWNIEŃ ============

  // Pobierz uprawnienia użytkownika
  async getUserPermissions(unitId: string, userId: string): Promise<{ permissions: string[] }> {
    const response = await api.get(`/roles/unit/${unitId}/user/${userId}/permissions`)
    return response.data
  },

  // Sprawdź czy użytkownik ma uprawnienie
  async checkPermission(unitId: string, userId: string, permission: string): Promise<{ hasPermission: boolean }> {
    const response = await api.get(`/roles/unit/${unitId}/user/${userId}/check`, {
      params: { permission },
    })
    return response.data
  },
}

// Moduły uprawnień z polskimi nazwami
export const PERMISSION_MODULES: Record<string, string> = {
  accounts: 'Plan kont',
  operations: 'Księgowania',
  reports: 'Sprawozdania',
  classification: 'Klasyfikacja budżetowa',
  journals: 'Dzienniki',
  'fiscal-periods': 'Okresy obrachunkowe',
  users: 'Użytkownicy',
  roles: 'Role i uprawnienia',
  settings: 'Ustawienia',
}

