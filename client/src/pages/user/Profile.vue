<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const authStore = useAuthStore()

const loading = ref(true)
const saving  = ref(false)
const activeTab = ref('personal')
const toast = ref(null)

const tabs = [
  { id: 'personal',    label: 'Personal Info',     icon: 'pi-user'           },
  { id: 'contact',     label: 'Contact & Address', icon: 'pi-map-marker'     },
  { id: 'education',   label: 'Education',         icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility',       icon: 'pi-verified'       },
  { id: 'training',    label: 'Training',          icon: 'pi-star'           },
  { id: 'experience',  label: 'Experience',        icon: 'pi-briefcase'      },
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '',
  birthDate: '',
  civilStatus: '',
  bio: '',
  contact: { phone: '', email: '' },
  address: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  education: [],
  eligibility: [],
  training: [],
  experience: [],
  performanceRating: { score: '', adjective: '', periodCovered: '' },
  links: { facebook: '', linkedin: '' },
})

const avatarSrc = computed(() =>
  authStore.user?.avatarUrl
  || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=1d4ed8&color=fff&bold=true`
)

const fullName = computed(() => {
  const { firstName, middleName, lastName, suffix } = form.name
  const mi = middleName ? `${middleName.charAt(0)}.` : ''
  return [firstName, mi, lastName, suffix].filter(Boolean).join(' ') || authStore.user?.username
})

// ── Helpers to add/remove list items ──────────────────────────────
const addEducation = () => form.education.push({ level: '', degree: '', units: '', school: '', yearGraduated: '' })
const removeEducation = (i) => form.education.splice(i, 1)

const addEligibility = () => form.eligibility.push({ name: '', placeOfExam: '', dateOfExam: '', rating: '' })
const removeEligibility = (i) => form.eligibility.splice(i, 1)

const addTraining = () => form.training.push({ title: '', hours: '', dateIssued: '', provider: '' })
const removeTraining = (i) => form.training.splice(i, 1)

const addExperience = () => form.experience.push({ position: '', company: '', months: '', isGovernment: false, monthlySalary: '' })
const removeExperience = (i) => form.experience.splice(i, 1)

// ── Load profile ───────────────────────────────────────────────────
const loadProfile = async () => {
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) {
      const p = data.data
      Object.assign(form.name,              p.name              || {})
      Object.assign(form.contact,           p.contact           || {})
      Object.assign(form.address,           p.address           || {})
      Object.assign(form.links,             p.links             || {})
      Object.assign(form.performanceRating, p.performanceRating || {})
      form.sex          = p.sex          || ''
      form.civilStatus  = p.civilStatus  || ''
      form.bio          = p.bio          || ''
      form.birthDate    = p.birthDate ? p.birthDate.substring(0, 10) : ''
      form.education    = p.education   || []
      form.eligibility  = p.eligibility || []
      form.training     = p.training    || []
      form.experience   = p.experience  || []
    }
  } catch {
    // no profile yet — form stays blank
  } finally {
    loading.value = false
  }
}

// ── Save ───────────────────────────────────────────────────────────
const save = async () => {
  if (!form.name.firstName.trim() || !form.name.lastName.trim()) {
    alert('First name and last name are required.')
    return
  }
  saving.value = true
  try {
    await apiClient.put('/v1/profile/me', form)
    showToast('Profile saved successfully.', 'success')
  } catch (err) {
    showToast(err.response?.data?.message || 'Save failed.', 'error')
  } finally {
    saving.value = false
  }
}

const toastMsg  = ref('')
const toastType = ref('success')
const toastVisible = ref(false)
let toastTimer = null

const showToast = (msg, type = 'success') => {
  toastMsg.value   = msg
  toastType.value  = type
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3000)
}

onMounted(loadProfile)
</script>

<template>
  <div class="animate-fade-in-up max-w-3xl mx-auto py-2">

    <!-- Toast -->
    <Transition name="slide-down">
      <div v-if="toastVisible"
        :class="['fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border',
          toastType === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700']">
        <i :class="['pi', toastType === 'success' ? 'pi-check-circle' : 'pi-times-circle']"></i>
        {{ toastMsg }}
      </div>
    </Transition>

    <!-- Header card -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 mb-6 flex items-center gap-5">
      <img :src="avatarSrc" :alt="authStore.user?.username"
        class="w-16 h-16 rounded-full object-cover border-4 border-[var(--color-primary-light)] shrink-0" />
      <div class="min-w-0">
        <h1 class="text-lg font-bold text-[var(--text-main)] truncate">{{ fullName }}</h1>
        <p class="text-sm text-[var(--text-muted)] truncate">{{ authStore.user?.email }}</p>
        <span class="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2.5 py-0.5 rounded-full">
          <i class="pi pi-user text-[10px]"></i> Applicant
        </span>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="n in 4" :key="n" class="h-12 bg-[var(--border-main)] rounded-xl animate-pulse"></div>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-1 mb-6 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
            activeTab === tab.id
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-2)]']">
          <i :class="['pi text-[11px]', tab.icon]"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── PERSONAL INFO ─────────────────────────────────────── -->
      <div v-if="activeTab === 'personal'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-5">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">First Name *</label>
            <input v-model="form.name.firstName" class="input" placeholder="Juan" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Middle Name</label>
            <input v-model="form.name.middleName" class="input" placeholder="Santos" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Last Name *</label>
            <input v-model="form.name.lastName" class="input" placeholder="Dela Cruz" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Suffix</label>
            <input v-model="form.name.suffix" class="input" placeholder="Jr., Sr., III" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Sex</label>
            <select v-model="form.sex" class="input">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Birth Date</label>
            <input v-model="form.birthDate" type="date" class="input" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Civil Status</label>
            <select v-model="form.civilStatus" class="input">
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
              <option>Widowed</option>
              <option>Separated</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Bio <span class="normal-case font-normal">(max 240 chars)</span></label>
          <textarea v-model="form.bio" class="input resize-none" rows="3" maxlength="240"
            placeholder="A short bio about yourself..."></textarea>
          <p class="text-[11px] text-[var(--text-faint)] text-right">{{ form.bio.length }}/240</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Facebook URL</label>
            <input v-model="form.links.facebook" class="input" placeholder="https://facebook.com/..." />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">LinkedIn URL</label>
            <input v-model="form.links.linkedin" class="input" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      </div>

      <!-- ── CONTACT & ADDRESS ─────────────────────────────────── -->
      <div v-if="activeTab === 'contact'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-6">

        <div>
          <h3 class="text-sm font-bold text-[var(--text-main)] mb-4">Contact Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Phone Number</label>
              <input v-model="form.contact.phone" class="input" placeholder="09xx-xxx-xxxx" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contact Email</label>
              <input v-model="form.contact.email" type="email" class="input" placeholder="you@email.com" />
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold text-[var(--text-main)] mb-4">Address</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Sitio / Purok</label>
              <input v-model="form.address.sitio" class="input" placeholder="Purok 1" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Barangay</label>
              <input v-model="form.address.barangay" class="input" placeholder="Brgy. Name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Municipality</label>
              <input v-model="form.address.municipality" class="input" placeholder="Municipality" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">City</label>
              <input v-model="form.address.city" class="input" placeholder="City" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Province</label>
              <input v-model="form.address.province" class="input" placeholder="Province" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">ZIP Code</label>
              <input v-model="form.address.zipCode" class="input" placeholder="6000" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── EDUCATION ─────────────────────────────────────────── -->
      <div v-if="activeTab === 'education'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">

        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-[var(--text-main)]">Educational Background</h3>
          <button @click="addEducation"
            class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
            <i class="pi pi-plus text-[10px]"></i> Add
          </button>
        </div>

        <div v-if="form.education.length === 0"
          class="text-center py-10 text-[var(--text-muted)] text-sm">
          <i class="pi pi-graduation-cap text-3xl mb-2 block"></i>
          No education entries yet. Click "Add" to start.
        </div>

        <div v-for="(edu, i) in form.education" :key="i"
          class="border border-[var(--border-main)] rounded-xl p-4 space-y-3 relative">
          <button @click="removeEducation(i)"
            class="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Remove">
            <i class="pi pi-trash text-sm"></i>
          </button>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Level</label>
              <select v-model="edu.level" class="input">
                <option value="">Select</option>
                <option>Vocational</option>
                <option>Bachelor</option>
                <option>Masteral</option>
                <option>Doctorate</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Degree / Course</label>
              <input v-model="edu.degree" class="input" placeholder="e.g. BSEd Major in English" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">School / University</label>
              <input v-model="edu.school" class="input" placeholder="School name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Year Graduated</label>
              <input v-model.number="edu.yearGraduated" type="number" class="input" placeholder="2020" min="1900" max="2100" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Units Earned (if not graduated)</label>
              <input v-model.number="edu.units" type="number" class="input" placeholder="e.g. 18" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── ELIGIBILITY ──────────────────────────────────────────── -->
      <div v-if="activeTab === 'eligibility'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">

        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-[var(--text-main)]">Civil Service Eligibility</h3>
          <button @click="addEligibility"
            class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
            <i class="pi pi-plus text-[10px]"></i> Add
          </button>
        </div>

        <div v-if="form.eligibility.length === 0"
          class="text-center py-10 text-[var(--text-muted)] text-sm">
          <i class="pi pi-verified text-3xl mb-2 block"></i>
          No eligibility entries yet. Click "Add" to start.
        </div>

        <div v-for="(el, i) in form.eligibility" :key="i"
          class="border border-[var(--border-main)] rounded-xl p-4 space-y-3 relative">
          <button @click="removeEligibility(i)"
            class="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors" aria-label="Remove">
            <i class="pi pi-trash text-sm"></i>
          </button>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Name of Eligibility</label>
              <input v-model="el.name" class="input" placeholder="e.g. Civil Service Professional" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Place of Examination</label>
              <input v-model="el.placeOfExam" class="input" placeholder="e.g. Cebu City" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date of Examination</label>
              <input v-model="el.dateOfExam" type="date" class="input" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Rating</label>
              <input v-model="el.rating" class="input" placeholder="e.g. 81.38%" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── TRAINING ───────────────────────────────────────────── -->
      <div v-if="activeTab === 'training'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">

        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-[var(--text-main)]">Training & Seminars</h3>
          <button @click="addTraining"
            class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
            <i class="pi pi-plus text-[10px]"></i> Add
          </button>
        </div>

        <div v-if="form.training.length === 0"
          class="text-center py-10 text-[var(--text-muted)] text-sm">
          <i class="pi pi-star text-3xl mb-2 block"></i>
          No training entries yet. Click "Add" to start.
        </div>

        <div v-for="(tr, i) in form.training" :key="i"
          class="border border-[var(--border-main)] rounded-xl p-4 space-y-3 relative">
          <button @click="removeTraining(i)"
            class="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Remove">
            <i class="pi pi-trash text-sm"></i>
          </button>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Training Title</label>
              <input v-model="tr.title" class="input" placeholder="e.g. School-Based INSET" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Provider / Organizer</label>
              <input v-model="tr.provider" class="input" placeholder="Provider name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Hours</label>
              <input v-model.number="tr.hours" type="number" class="input" placeholder="e.g. 8" min="0" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date Issued / Completed</label>
              <input v-model="tr.dateIssued" type="date" class="input" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── EXPERIENCE ─────────────────────────────────────────── -->
      <div v-if="activeTab === 'experience'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 space-y-4">

        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-[var(--text-main)]">Work Experience</h3>
          <button @click="addExperience"
            class="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
            <i class="pi pi-plus text-[10px]"></i> Add
          </button>
        </div>

        <div v-if="form.experience.length === 0"
          class="text-center py-10 text-[var(--text-muted)] text-sm">
          <i class="pi pi-briefcase text-3xl mb-2 block"></i>
          No experience entries yet. Click "Add" to start.
        </div>

        <div v-for="(exp, i) in form.experience" :key="i"
          class="border border-[var(--border-main)] rounded-xl p-4 space-y-3 relative">
          <button @click="removeExperience(i)"
            class="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Remove">
            <i class="pi pi-trash text-sm"></i>
          </button>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Position / Designation</label>
              <input v-model="exp.position" class="input" placeholder="e.g. Teacher I" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Company / Agency</label>
              <input v-model="exp.company" class="input" placeholder="e.g. DepEd Division of..." />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Duration (months)</label>
              <input v-model.number="exp.months" type="number" class="input" placeholder="e.g. 12" min="0" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Monthly Salary</label>
              <input v-model.number="exp.monthlySalary" type="number" class="input" placeholder="e.g. 30000" min="0" />
            </div>
            <div class="flex items-center gap-2 pt-1">
              <input :id="`gov-${i}`" v-model="exp.isGovernment" type="checkbox"
                class="w-4 h-4 rounded accent-[var(--color-primary)]" />
              <label :for="`gov-${i}`" class="text-sm text-[var(--text-main)] cursor-pointer">Government position</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex justify-end mt-6">
        <button @click="save" :disabled="saving"
          class="btn-primary h-10 px-6 text-sm disabled:opacity-50 flex items-center gap-2">
          <i v-if="saving" class="pi pi-spin pi-spinner text-xs"></i>
          <i v-else class="pi pi-save text-xs"></i>
          {{ saving ? 'Saving...' : 'Save Profile' }}
        </button>
      </div>
    </template>
  </div>
</template>
