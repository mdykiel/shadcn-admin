import api from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED'
  isSystemAdmin: boolean
  createdAt: string
  updatedAt: string
  unitRole?: string
  isOwner?: boolean
  roles?: Role[]
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  isActive: boolean
}

export interface RoleAssignment {
  roleId: string
  journalId?: string | null
  fiscalPeriodId?: string | null
}

export interface CreateUserInput {
  email: string
  password?: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  roleIds?: string[]
  roleAssignments?: RoleAssignment[]
}

export interface UpdateUserInput {
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED'
  roleIds?: string[]
  roleAssignments?: RoleAssignment[]
}

export const usersService = {
  // Pobierz użytkowników jednostki
  async getByUnit(unitId: string): Promise<User[]> {
    const response = await api.get(`/users/unit/${unitId}`)
    return response.data
  },

  // Pobierz pojedynczego użytkownika
  async getById(userId: string): Promise<User> {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },

  // Utwórz użytkownika
  async create(unitId: string, data: CreateUserInput): Promise<User & { generatedPassword?: string }> {
    const response = await api.post(`/users/unit/${unitId}`, data)
    return response.data
  },

  // Aktualizuj użytkownika
  async update(unitId: string, userId: string, data: UpdateUserInput): Promise<User> {
    const response = await api.put(`/users/unit/${unitId}/${userId}`, data)
    return response.data
  },

  // Usuń użytkownika z jednostki
  async removeFromUnit(unitId: string, userId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/users/unit/${unitId}/${userId}`)
    return response.data
  },

  // Zmień status użytkownika
  async updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED'): Promise<User> {
    const response = await api.patch(`/users/${userId}/status`, { status })
    return response.data
  },

  // Zresetuj hasło
  async resetPassword(userId: string, newPassword?: string): Promise<{ generatedPassword?: string }> {
    const response = await api.post(`/users/${userId}/reset-password`, { newPassword })
    return response.data
  },

  // Przypisz role
  async assignRoles(unitId: string, userId: string, roleIds: string[]): Promise<{ success: boolean }> {
    const response = await api.post(`/users/unit/${unitId}/${userId}/roles`, { roleIds })
    return response.data
  },
}

