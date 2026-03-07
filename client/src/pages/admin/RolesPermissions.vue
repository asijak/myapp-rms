<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoleStore } from '@/stores/roles'

// --- Injections & Stores ---
const toast = inject('$toast')
const roleStore = useRoleStore()

// --- UI State ---
const showCreateModal = ref(false)
const isSaving = ref(false)
const newRoleName = ref('')
const newRoleDesc = ref('')
const activeRoleId = ref(null)

onMounted(async () => {
    try {
        await roleStore.fetchRoles()
        if (roleStore.roles.length > 0) {
            activeRoleId.value = roleStore.roles[0]._id
        }
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch roles.' })
    }
})

// --- Mock Data: Permission Groups ---
const permissionGroups = ref([
    {
        module: 'USER',
        description: 'Manage employee accounts and system access.',
        icon: 'pi-users',
        permissions: [
            { id: 'user_view', name: 'View User' },
            { id: 'user_create', name: 'Create User' },
            { id: 'user_edit', name: 'Edit User' },
            { id: 'user_delete', name: 'Delete User' },
            { id: 'user_reset_pwd', name: 'Reset Password' }
        ]
    },
    {
        module: 'ROLE',
        description: 'Manage system roles.',
        icon: 'pi-shield',
        permissions: [
            { id: 'role_view', name: 'View Role' },
            { id: 'role_create', name: 'Create Role' },
            { id: 'role_edit', name: 'Edit Role' },
            { id: 'role_delete', name: 'Delete Role' }
        ]
    },
    {
        module: 'JOB VACANCIES',
        description: 'Manage job postings.',
        icon: 'pi-briefcase',
        permissions: [
            { id: 'vac_view', name: 'View Vacancy' },
            { id: 'vac_create', name: 'Create Vacancy' },
            { id: 'vac_edit', name: 'Edit Vacancy' },
            { id: 'vac_delete', name: 'Delete Vacancy' }
        ]
    },
    {
        module: 'APPLICATIONS',
        description: 'Manage submitted applications.',
        icon: 'pi-folder-open',
        permissions: [
            { id: 'app_view', name: 'View Application' },
            { id: 'app_create', name: 'Create Application' },
            { id: 'app_edit', name: 'Update Status' },
            { id: 'app_delete', name: 'Delete Application' }
        ]
    }
])

// --- Computed Properties ---
const activeRole = computed(() => roleStore.roles.find(r => r._id === activeRoleId.value))
const isSuperAdmin = computed(() => activeRole.value?.permissions?.includes('all'))

// --- Methods ---
const selectRole = (id) => {
    activeRoleId.value = id
}

const hasPermission = (permId) => {
    if (!activeRole.value?.permissions) return false
    if (isSuperAdmin.value) return true
    return activeRole.value.permissions.includes(permId)
}

const togglePermission = (permId) => {
    if (isSuperAdmin.value) {
        toast.fire({ icon: 'warning', title: 'Restricted', text: 'Super Admin permissions cannot be modified.' })
        return
    }

    if (!activeRole.value.permissions) activeRole.value.permissions = []

    const perms = activeRole.value.permissions
    const index = perms.indexOf(permId)

    if (index === -1) {
        perms.push(permId)
    } else {
        perms.splice(index, 1)
    }
}

// Module-level "Select All" Logic
const isModuleAllSelected = (module) => {
    if (isSuperAdmin.value) return true;
    if (!activeRole.value?.permissions) return false;
    return module.permissions.every(p => activeRole.value.permissions.includes(p.id));
}

const toggleModuleAll = (module) => {
    if (isSuperAdmin.value) {
        toast.fire({ icon: 'warning', title: 'Restricted', text: 'Super Admin permissions cannot be modified.' });
        return;
    }

    if (!activeRole.value.permissions) activeRole.value.permissions = [];

    const allSelected = isModuleAllSelected(module);

    if (allSelected) {
        module.permissions.forEach(p => {
            const index = activeRole.value.permissions.indexOf(p.id);
            if (index !== -1) activeRole.value.permissions.splice(index, 1);
        });
    } else {
        module.permissions.forEach(p => {
            if (!activeRole.value.permissions.includes(p.id)) {
                activeRole.value.permissions.push(p.id);
            }
        });
    }
}

// --- API Actions ---
const handleSaveChanges = async () => {
    isSaving.value = true
    try {
        await roleStore.upsertRole({
            _id: activeRole.value._id,
            name: activeRole.value.name,
            description: activeRole.value.description,
            permissions: activeRole.value.permissions
        })
        toast.fire({ icon: 'success', title: 'Saved', text: 'Role updated successfully.' })
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update role.' })
    } finally {
        isSaving.value = false
    }
}

const handleCreateRole = async () => {
    if (!newRoleName.value) return
    isSaving.value = true

    try {
        const payload = {
            name: newRoleName.value,
            description: newRoleDesc.value || 'New custom role.',
            permissions: []
        }

        const response = await roleStore.upsertRole(payload)
        await roleStore.fetchRoles()

        if (response.data && response.data.data) {
            activeRoleId.value = response.data.data._id
        }

        showCreateModal.value = false
        newRoleName.value = ''
        newRoleDesc.value = ''

        toast.fire({ icon: 'success', title: 'Created', text: 'New role created.' })
    } catch (error) {
        toast.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to create role.' })
    } finally {
        isSaving.value = false
    }
}

const moduleGrantedCount = (module) => {
    if (isSuperAdmin.value) return module.permissions.length
    if (!activeRole.value?.permissions) return 0
    return module.permissions.filter(p => activeRole.value.permissions.includes(p.id)).length
}
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Roles &amp; Permissions</h1>
                <p class="text-sm text-[var(--text-muted)] mt-0.5">Configure system access levels and module permissions.</p>
            </div>
            <button @click="showCreateModal = true"
                class="btn-primary h-9 px-4 text-sm flex items-center gap-2">
                <i class="pi pi-plus text-xs"></i>
                Create Role
            </button>
        </div>

        <!-- ── Role Selector ───────────────────────────────────────── -->
        <div class="flex gap-2.5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
            <button v-for="role in roleStore.roles" :key="role._id"
                @click="selectRole(role._id)"
                :class="[
                    'flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-left',
                    activeRoleId === role._id
                        ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-ring)] shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border-main)] hover:border-slate-300 hover:bg-[var(--bg-app)]'
                ]">
                <div :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    activeRoleId === role._id ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                ]">
                    <i class="pi pi-shield text-xs"></i>
                </div>
                <div class="min-w-0">
                    <p :class="['text-sm font-semibold truncate leading-tight', activeRoleId === role._id ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]']">
                        {{ role.name }}
                    </p>
                    <p class="text-[10px] text-[var(--text-muted)] truncate">
                        {{ role.permissions?.includes('all') ? 'Full access' : `${role.permissions?.length || 0} permissions` }}
                    </p>
                </div>
            </button>
        </div>

        <!-- ── Active Role Panel ───────────────────────────────────── -->
        <div v-if="activeRole" class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden animate-fade-in">

            <!-- Role header -->
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-[var(--bg-app)]/50">
                <div class="flex items-center gap-4 flex-1 w-full">
                    <div class="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-shield text-white text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Role Name</label>
                        <input v-model="activeRole.name" type="text" :disabled="isSuperAdmin"
                            class="w-full md:max-w-xs h-9 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] disabled:bg-[var(--bg-app)] disabled:text-[var(--text-muted)] transition-shadow" />
                    </div>
                </div>
                <div v-if="isSuperAdmin"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold flex-shrink-0">
                    <i class="pi pi-lock text-xs"></i>
                    Protected — Full Access
                </div>
            </div>

            <!-- Permission Groups -->
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div v-for="(group, idx) in permissionGroups" :key="idx"
                        class="border border-[var(--border-main)] rounded-xl overflow-hidden">

                        <!-- Group header -->
                        <div class="bg-[var(--bg-app)] border-b border-[var(--border-main)] px-4 py-3 flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2.5">
                                <div class="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center flex-shrink-0">
                                    <i :class="['pi text-sm text-[var(--text-muted)]', group.icon]"></i>
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-[var(--text-main)] leading-tight">{{ group.module }}</p>
                                    <p class="text-[10px] text-[var(--text-muted)]">{{ moduleGrantedCount(group) }}/{{ group.permissions.length }} granted</p>
                                </div>
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer select-none group">
                                <span class="text-[10px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">All</span>
                                <div class="relative">
                                    <input type="checkbox" :checked="isModuleAllSelected(group)"
                                        @change="toggleModuleAll(group)" :disabled="isSuperAdmin"
                                        class="sr-only" />
                                    <div @click="!isSuperAdmin && toggleModuleAll(group)"
                                        :class="[
                                            'w-8 h-4 rounded-full transition-colors cursor-pointer',
                                            isModuleAllSelected(group) ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-main)]',
                                            isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                        ]">
                                        <div :class="[
                                            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform',
                                            isModuleAllSelected(group) ? 'translate-x-4' : 'translate-x-0.5'
                                        ]"></div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <!-- Permissions grid -->
                        <div class="p-3 grid grid-cols-1 gap-1">
                            <label v-for="perm in group.permissions" :key="perm.id"
                                :class="[
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all select-none group',
                                    hasPermission(perm.id)
                                        ? 'bg-[var(--color-primary-light)] border border-[var(--color-primary-ring)]/50'
                                        : 'hover:bg-[var(--bg-app)] border border-transparent',
                                    isSuperAdmin ? 'cursor-not-allowed opacity-75' : ''
                                ]"
                                @click.prevent="!isSuperAdmin && togglePermission(perm.id)">

                                <!-- Visual toggle indicator -->
                                <div :class="[
                                    'w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all',
                                    hasPermission(perm.id)
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                                        : 'border-[var(--border-main)] bg-[var(--surface)]'
                                ]">
                                    <i v-if="hasPermission(perm.id)" class="pi pi-check text-white text-[9px]"></i>
                                </div>

                                <span :class="[
                                    'text-sm transition-colors flex-1',
                                    hasPermission(perm.id) ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--text-main)]'
                                ]">{{ perm.name }}</span>

                                <input type="checkbox" :checked="hasPermission(perm.id)" class="sr-only" readonly />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)]/50 flex items-center justify-between gap-3">
                <p v-if="isSuperAdmin" class="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <i class="pi pi-info-circle text-[11px]"></i>
                    Super Admin role cannot be modified.
                </p>
                <p v-else class="text-xs text-[var(--text-muted)]">
                    Changes are saved manually — click Update Role to apply.
                </p>
                <div class="flex items-center gap-3 flex-shrink-0">
                    <button
                        class="h-9 px-4 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        Discard
                    </button>
                    <button @click="handleSaveChanges" :disabled="isSaving || isSuperAdmin"
                        class="btn-primary h-9 px-5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs"></i>
                        <i v-else class="pi pi-save text-xs"></i>
                        {{ isSaving ? 'Saving...' : 'Update Role' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="flex items-center justify-center bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20">
            <div class="text-center text-[var(--text-muted)] flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-shield text-2xl text-[var(--text-muted)]"></i>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[var(--text-main)]">No roles found</p>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5">Create a role to get started.</p>
                </div>
                <button @click="showCreateModal = true" class="btn-primary h-9 px-4 text-sm flex items-center gap-2">
                    <i class="pi pi-plus text-xs"></i> Create Role
                </button>
            </div>
        </div>

    </div>

    <!-- ── Create Role Modal ───────────────────────────────────────── -->
    <Teleport to="body">
    <Transition name="fade">
    <div v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-bold text-[var(--text-main)]">Create New Role</h3>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5">Define a new access role for the system.</p>
                </div>
                <button @click="showCreateModal = false"
                    class="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors">
                    <i class="pi pi-times text-sm"></i>
                </button>
            </div>

            <div class="p-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Role Name <span class="text-red-500">*</span></label>
                    <input v-model="newRoleName" type="text" placeholder="e.g. HR Manager"
                        class="h-9 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Description <span class="text-[var(--text-faint)] font-normal normal-case">(optional)</span></label>
                    <textarea v-model="newRoleDesc" rows="3" placeholder="Brief description of this role..."
                        class="px-3 py-2.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] transition-shadow resize-none"></textarea>
                </div>
            </div>

            <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3">
                <button @click="showCreateModal = false"
                    class="btn-secondary h-9 px-4 text-sm">Cancel</button>
                <button @click="handleCreateRole" :disabled="!newRoleName || isSaving"
                    class="btn-primary h-9 px-5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs"></i>
                    {{ isSaving ? 'Creating...' : 'Create Role' }}
                </button>
            </div>
        </div>
    </div>
    </Transition>
    </Teleport>
</template>
