<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'
import { ELIGIBILITY_GROUPS } from '@/utils/eligibilityOptions'
import { AppButton } from '@/components/ui'

const authStore = useAuthStore()
const toast = inject('$toast')

const loading = ref(true)
const saving = ref(false)
const showPdsPreview = ref(false)
const activeTab = ref('personal')

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: 'pi-user' },
  { id: 'family', label: 'Family Background', icon: 'pi-users' },
  { id: 'education', label: 'Education', icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified' },
  { id: 'experience', label: 'Work Experience', icon: 'pi-briefcase' },
  { id: 'training', label: 'L&D / Trainings', icon: 'pi-book' },
  { id: 'voluntary', label: 'Voluntary Work', icon: 'pi-heart' },
  { id: 'others', label: 'Other Info', icon: 'pi-list' },
]

const form = reactive({
  name: { firstName: '', middleName: '', lastName: '', suffix: '' },
  sex: '',
  birthDate: '',
  ethnicGroup: '',
  religion: '',
  disability: '',
  civilStatus: '',
  contact: { phones: [''], emails: [''] },
  address: { sitio: '', barangay: '', municipality: '', city: '', province: '', zipCode: '', country: 'Philippines' },
  family: {
    spouse: { firstName: '', middleName: '', lastName: '', suffix: '', occupation: '', employer: '', businessAddress: '', phone: '' },
    father: { firstName: '', middleName: '', lastName: '', suffix: '' },
    mother: { firstName: '', middleName: '', lastName: '', suffix: '' },
    children: [],
  },
  education: [],
  eligibility: [],
  experience: [],
  voluntaryWork: [],
  training: [],
  competencies: [],
  specialSkills: [],
  nonAcademicDistinctions: [],
  memberships: [],
  performanceRating: { score: null, adjective: '', periodCovered: '' },
  visibility: { phone: false, email: false, address: false },
})

// Relationships for Family Tab
const familyRelations = [
  { id: 'spouse', label: 'Spouse Details' },
  { id: 'father', label: "Father's Name" },
  { id: 'mother', label: "Mother's Details (Maiden Name)" }
]

// Others list config
const othersLists = [
  { id: 'skills', field: 'specialSkills', label: 'Skills & Hobbies' },
  { id: 'distinctions', field: 'nonAcademicDistinctions', label: 'Distinctions' },
  { id: 'competencies', field: 'competencies', label: 'Core Competencies' }
]

// ── COMPLETENESS ─────────────────────────────────────────────────
const completenessStats = computed(() => {
  const sections = {
    personal: !!(form.name.firstName && form.name.lastName && form.birthDate && form.sex),
    education: form.education.length > 0,
    eligibility: form.eligibility.length > 0,
    experience: form.experience.length > 0,
    training: form.training.length > 0,
    family: !!(form.family.father.lastName || form.family.mother.lastName),
    others: (form.competencies.length > 0 || form.specialSkills.length > 0),
  }
  const keys = Object.keys(sections)
  const completedCount = keys.filter(k => sections[k]).length
  const percent = Math.round((completedCount / keys.length) * 100)
  const criticalMissing = []
  if (!sections.education) criticalMissing.push('Education')
  if (!sections.eligibility) criticalMissing.push('Eligibility')
  if (!sections.experience) criticalMissing.push('Experience')
  return { percent, sections, criticalMissing }
})

const fullName = computed(() => {
  const { firstName, middleName, lastName, suffix } = form.name
  const mi = middleName ? `${middleName.charAt(0)}.` : ''
  return [firstName, mi, lastName, suffix].filter(Boolean).join(' ') || authStore.user?.username
})

const calcAge = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  const birth = new Date(dateStr)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const addPhone = () => form.contact.phones.push('')
const removePhone = (i) => { if (form.contact.phones.length > 1) form.contact.phones.splice(i, 1) }
const addEmail = () => form.contact.emails.push('')
const removeEmail = (i) => { if (form.contact.emails.length > 1) form.contact.emails.splice(i, 1) }

const addItem = (list) => {
  if (list === 'children') form.family.children.push({ firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '' })
  if (list === 'education') form.education.push({ level: 'Bachelor', school: '', degree: '', periodFrom: '', periodTo: '', notGraduated: false, unitsEarned: null, yearGraduated: null, honorsReceived: '' })
  if (list === 'eligibility') form.eligibility.push({ type: '', name: '', rating: '', dateOfExam: '', placeOfExam: '', licenseNumber: '', licenseValidity: '' })
  if (list === 'experience') form.experience.push({ periodFrom: '', periodTo: '', position: '', company: '', monthlySalary: null, salaryGrade: '', statusOfAppointment: 'Permanent', isGovernment: false, keyResponsibilities: [] })
  if (list === 'voluntary') form.voluntaryWork.push({ organization: '', periodFrom: '', periodTo: '', hours: null, position: '' })
  if (list === 'training') form.training.push({ title: '', periodFrom: '', periodTo: '', hours: 0, typeOfLD: 'Technical', provider: '' })
  if (['skills', 'distinctions', 'competencies'].includes(list)) {
    const map = { skills: 'specialSkills', distinctions: 'nonAcademicDistinctions', competencies: 'competencies' }
    form[map[list]].push('')
  }
}

const removeItem = (list, index) => {
  const map = { children: form.family.children, education: form.education, eligibility: form.eligibility, experience: form.experience, training: form.training, voluntary: form.voluntaryWork, skills: form.specialSkills, distinctions: form.nonAcademicDistinctions, competencies: form.competencies, phones: form.contact.phones, emails: form.contact.emails }
  map[list].splice(index, 1)
}

const loadProfile = async () => {
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    if (data.data) {
      const d = data.data
      Object.assign(form, d)
      if (form.birthDate) form.birthDate = form.birthDate.substring(0, 10)
      if (form.family?.children) {
        form.family.children.forEach(c => {
          if (c.birthDate) c.birthDate = c.birthDate.substring(0, 10)
        })
      }
      form.eligibility?.forEach(e => {
        if (e.dateOfExam) e.dateOfExam = e.dateOfExam.substring(0, 10)
        if (e.licenseValidity) e.licenseValidity = e.licenseValidity.substring(0, 10)
      })
      form.experience?.forEach(e => {
        if (e.periodFrom) e.periodFrom = e.periodFrom.substring(0, 10)
        if (e.periodTo) e.periodTo = e.periodTo.substring(0, 10)
      })
      form.training?.forEach(t => {
        if (t.periodFrom) t.periodFrom = t.periodFrom.substring(0, 10)
        if (t.periodTo) t.periodTo = t.periodTo.substring(0, 10)
      })
      form.voluntaryWork?.forEach(v => {
        if (v.periodFrom) v.periodFrom = v.periodFrom.substring(0, 10)
        if (v.periodTo) v.periodTo = v.periodTo.substring(0, 10)
      })
    }
  } catch (err) { } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const p = JSON.parse(JSON.stringify(form))
    const stripKeys = ['_id', 'id', '__v', 'user', 'createdAt', 'updatedAt', 'fullName', 'age']
    stripKeys.forEach(k => delete p[k])
    
    // Cleanup
    p.contact.phones = (p.contact.phones || []).filter(x => x.trim())
    p.contact.emails = (p.contact.emails || []).filter(x => x.trim())
    const clean = (arr, key) => (arr || []).filter(x => x[key]?.trim())
    p.education = clean(p.education, 'school')
    p.eligibility = clean(p.eligibility, 'name')
    p.experience = clean(p.experience, 'position')
    p.training = clean(p.training, 'title')
    p.voluntaryWork = clean(p.voluntaryWork, 'organization')

    await apiClient.put('/v1/profile/me', p)
    toast.fire({ icon: 'success', title: 'Profile Updated' })
  } catch (err) {
    toast.fire({ icon: 'error', title: 'Update Failed', text: err.response?.data?.message })
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)

// ── CONSTANTS ──────────────────────────────────────────────────
const F = 'w-full h-11 px-4 text-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] text-[var(--text-main)] transition-all shadow-sm'
const LABEL = 'text-[10px] font-bold text-[var(--text-muted)]'
const SECTION = 'bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm relative'
const H3 = 'text-sm font-bold text-[var(--text-main)] mb-4'

// ── SHARED STYLES ──
const ADD_BTN = 'text-[9px] font-black text-[var(--color-primary)] hover:text-white bg-[var(--color-primary-light)]/30 hover:bg-[var(--color-primary)] hover:shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 uppercase tracking-widest'
const REMOVE_BTN = 'w-10 h-10 flex items-center justify-center text-red-400 hover:text-white bg-transparent hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-lg transition-all shrink-0'
</script>

<template>
  <div class="animate-fade-in-up max-w-5xl mx-auto py-4 px-4 sm:px-6">

    <!-- HEADER -->
    <div :class="[SECTION, 'mb-6 flex flex-col md:flex-row items-center gap-8 overflow-hidden group']">
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-[var(--color-primary)]/10"></div>
      <div class="relative w-24 h-24 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" class="text-[var(--border-main)]" />
          <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent"
            :stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * completenessStats.percent) / 100"
            class="text-[var(--color-primary)] transition-all duration-1000 ease-out" stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-black text-[var(--text-main)]">{{ completenessStats.percent }}%</span>
          <span class="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center leading-none">Data<br/>Ready</span>
        </div>
      </div>
      <div class="flex-1 text-center md:text-left relative z-10">
        <h2 class="text-lg font-bold text-[var(--text-main)] tracking-tight">Personal Data Sheet (CS Form 212)</h2>
        <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">{{ fullName }}</p>
        
        <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
          <template v-if="completenessStats.criticalMissing.length > 0">
            <span v-for="miss in completenessStats.criticalMissing" :key="miss"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
              <i class="pi pi-exclamation-triangle"></i> {{ miss }} Missing
            </span>
          </template>
          <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
            <i class="pi pi-check-circle"></i> Profile Validated
          </span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-1.5 mb-8 overflow-x-auto no-scrollbar shadow-sm">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all relative',
          activeTab === tab.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]']">
        <i :class="['pi text-[11px]', tab.icon]"></i>{{ tab.label }}
        <div v-if="completenessStats.sections[tab.id]"
          class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-white"></div>
      </button>
    </div>

    <div v-if="loading" class="flex p-20 justify-center"><i class="pi pi-spin pi-spinner text-3xl opacity-20"></i></div>

    <div v-else class="space-y-8 pb-32">

      <!-- ══ TAB 1: PERSONAL ════════════════════════════════════════ -->
      <section v-if="activeTab === 'personal'" class="space-y-6 animate-fade-in">
        <div :class="SECTION">
          <h3 :class="H3">Personal Information</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">First Name</label><input v-model="form.name.firstName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Middle Name</label><input v-model="form.name.middleName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Last Name</label><input v-model="form.name.lastName" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Suffix</label><input v-model="form.name.suffix" :class="F" /></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Birth</label><input v-model="form.birthDate" type="date" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Sex</label><select v-model="form.sex" :class="F"><option value="male">Male</option><option value="female">Female</option></select></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Civil Status</label><select v-model="form.civilStatus" :class="F"><option value="">Select...</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option><option>Other</option></select></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Ethnic Group</label><input v-model="form.ethnicGroup" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Religion</label><input v-model="form.religion" :class="F" /></div>
            <div class="flex flex-col gap-1.5"><label :class="LABEL">Disability (if any)</label><input v-model="form.disability" :class="F" /></div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Contact Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Mobile Numbers</label><button @click="addPhone" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Phone</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(phone, i) in form.contact.phones" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.phones[i]" :class="F" placeholder="Phone Number" />
                  <button @click="removeItem('phones', i)" :disabled="form.contact.phones.length === 1" :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between"><label :class="LABEL">Email Addresses</label><button @click="addEmail" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Email</button></div>
              <transition-group name="list" tag="div" class="space-y-2">
                <div v-for="(email, i) in form.contact.emails" :key="i" class="flex gap-2 items-center">
                  <input v-model="form.contact.emails[i]" :class="F" placeholder="Email Address" />
                  <button @click="removeItem('emails', i)" :disabled="form.contact.emails.length === 1" :class="REMOVE_BTN"><i class="pi pi-trash text-xs"></i></button>
                </div>
              </transition-group>
            </div>
          </div>
        </div>

        <div :class="SECTION">
          <h3 :class="H3">Residential Address</h3>
          <div class="grid grid-cols-2 gap-4">
            <input v-model="form.address.sitio" :class="F" class="col-span-2" placeholder="Sitio / House No. / Street" />
            <input v-model="form.address.barangay" :class="F" placeholder="Barangay" />
            <input v-model="form.address.municipality" :class="F" placeholder="Municipality / City" />
            <input v-model="form.address.province" :class="F" placeholder="Province" />
            <input v-model="form.address.zipCode" :class="F" placeholder="ZIP Code" />
          </div>
        </div>
      </section>

      <!-- ══ TAB 2: FAMILY ══════════════════════════════════════════ -->
      <section v-if="activeTab === 'family'" class="space-y-6 animate-fade-in">
        <div v-for="rel in familyRelations" :key="rel.id" :class="SECTION">
          <h3 :class="H3">{{ rel.label }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input v-model="form.family[rel.id].firstName" :class="F" placeholder="First Name" />
            <input v-model="form.family[rel.id].middleName" :class="F" placeholder="Middle Name" />
            <input v-model="form.family[rel.id].lastName" :class="F" placeholder="Last Name" />
            <input v-model="form.family[rel.id].suffix" :class="F" placeholder="Suffix" />
          </div>
        </div>
        <div :class="SECTION">
          <div class="flex justify-between items-center mb-6"><h3 :class="H3" class="mb-0">Children</h3><button @click="addItem('children')" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Child</button></div>
          <transition-group name="list" tag="div" class="space-y-3">
            <div v-for="(c, i) in form.family.children" :key="i" class="p-5 bg-[var(--bg-app)]/50 rounded-xl border border-[var(--border-main)] flex flex-col sm:flex-row gap-4 items-end transition-all hover:border-[var(--color-primary)]">
              <div class="flex-1 grid grid-cols-2 gap-3 w-full">
                <input v-model="c.firstName" :class="F" placeholder="Child's Full Name" />
                <input v-model="c.birthDate" type="date" :class="F" />
              </div>
              <button @click="removeItem('children', i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
            </div>
          </transition-group>
          <div v-if="form.family.children.length === 0" class="py-10 text-center text-[var(--text-faint)] italic text-xs">No children added yet.</div>
        </div>
      </section>

      <!-- ══ TAB 3: EDUCATION ═══════════════════════════════════════ -->
      <section v-if="activeTab === 'education'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Educational Background</h3><AppButton size="sm" icon="pi-plus" @click="addItem('education')">Add Educational Level</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.education" :key="i" :class="SECTION" class="group/item">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]"><i class="pi pi-graduation-cap"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.level || 'LEVEL' }}</span></div>
              <button @click="removeItem('education', i)" :class="REMOVE_BTN"><i class="pi pi-trash"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Level</label><select v-model="e.level" :class="F"><option>Elementary</option><option>Secondary</option><option>Vocational</option><option>Bachelor</option><option>Masteral</option><option>Doctorate</option></select></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">School Name</label><input v-model="e.school" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Degree / Course</label><input v-model="e.degree" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">From (Year)</label><input v-model="e.periodFrom" :class="F" placeholder="Year" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">To (Year)</label><input v-model="e.periodTo" :class="F" placeholder="Year" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 4: ELIGIBILITY ══════════════════════════════════════ -->
      <section v-if="activeTab === 'eligibility'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Civil Service Eligibility</h3><AppButton size="sm" icon="pi-plus" @click="addItem('eligibility')">Add Eligibility Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.eligibility" :key="i" :class="SECTION" class="group/item">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]"><i class="pi pi-verified"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.name || 'NEW RECORD' }}</span></div>
              <button @click="removeItem('eligibility', i)" :class="REMOVE_BTN"><i class="pi pi-trash"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5">
                <label :class="LABEL">Eligibility Category</label>
                <select v-model="e.type" :class="F">
                  <option value="" disabled>Select category...</option>
                  <optgroup v-for="group in ELIGIBILITY_GROUPS" :key="group.label" :label="group.label">
                    <option v-for="opt in group.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Exam / License Title</label><input v-model="e.name" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Rating / Score</label><input v-model="e.rating" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date of Exam</label><input v-model="e.dateOfExam" type="date" :class="F" /></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Number</label><input v-model="e.licenseNumber" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">License Validity</label><input v-model="e.licenseValidity" type="date" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 5: EXPERIENCE ════════════════════════════════════════ -->
      <section v-if="activeTab === 'experience'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Work Experience</h3><AppButton size="sm" icon="pi-plus" @click="addItem('experience')">Add Service Record</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(e, i) in form.experience" :key="i" :class="SECTION">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]"><i class="pi pi-briefcase"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ e.position || 'POSITION' }}</span></div>
              <button @click="removeItem('experience', i)" :class="REMOVE_BTN"><i class="pi pi-trash"></i></button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Position Title</label><input v-model="e.position" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Agency / Company</label><input v-model="e.company" :class="F" /></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date From</label><input v-model="e.periodFrom" type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date To (leave blank if current)</label><input v-model="e.periodTo" type="date" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 6: TRAINING ═════════════════════════════════════════ -->
      <section v-if="activeTab === 'training'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Learning & Development</h3><AppButton size="sm" icon="pi-plus" @click="addItem('training')">Add Training</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(t, i) in form.training" :key="i" :class="SECTION">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]"><i class="pi pi-book"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ t.title || 'TRAINING' }}</span></div>
              <button @click="removeItem('training', i)" :class="REMOVE_BTN"><i class="pi pi-trash"></i></button>
            </div>
            <input v-model="t.title" :class="F" placeholder="Title of Training" class="mb-4" />
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Hours</label><input v-model="t.hours" type="number" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date From</label><input v-model="t.periodFrom" type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date To</label><input v-model="t.periodTo" type="date" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 7: VOLUNTARY ════════════════════════════════════════ -->
      <section v-if="activeTab === 'voluntary'" class="space-y-6 animate-fade-in">
        <div class="flex justify-between items-center"><h3 :class="H3" class="mb-0 text-base">Voluntary Work</h3><AppButton size="sm" icon="pi-plus" @click="addItem('voluntary')">Add Entry</AppButton></div>
        <transition-group name="list" tag="div" class="space-y-4">
          <div v-for="(v, i) in form.voluntaryWork" :key="i" :class="SECTION">
            <div class="flex justify-between items-start mb-5">
              <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]"><i class="pi pi-heart"></i></div><span class="text-xs font-black uppercase text-[var(--text-main)] tracking-widest">{{ v.organization || 'ORGANIZATION' }}</span></div>
              <button @click="removeItem('voluntary', i)" :class="REMOVE_BTN"><i class="pi pi-trash"></i></button>
            </div>
            <input v-model="v.organization" :class="F" placeholder="Organization" class="mb-4" />
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date From</label><input v-model="v.periodFrom" type="date" :class="F" /></div>
              <div class="flex flex-col gap-1.5"><label :class="LABEL">Date To</label><input v-model="v.periodTo" type="date" :class="F" /></div>
            </div>
          </div>
        </transition-group>
      </section>

      <!-- ══ TAB 8: OTHERS ═══════════════════════════════════════════ -->
      <section v-if="activeTab === 'others'" class="space-y-6 animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="l in othersLists" :key="l.id" :class="SECTION">
            <div class="flex justify-between items-center mb-6"><h3 :class="H3" class="mb-0">{{ l.label }}</h3><button @click="addItem(l.id)" :class="ADD_BTN"><i class="pi pi-plus text-[8px]"></i> Add Entry</button></div>
            <transition-group name="list" tag="div" class="space-y-3">
              <div v-for="(item, i) in form[l.field]" :key="i" class="flex gap-2 items-center">
                <input v-model="form[l.field][i]" :class="F" placeholder="Enter details..." />
                <button @click="removeItem(l.id, i)" :class="REMOVE_BTN"><i class="pi pi-trash text-sm"></i></button>
              </div>
            </transition-group>
            <div v-if="form[l.field].length === 0" class="py-10 text-center text-[var(--text-faint)] italic text-xs">No entries listed.</div>
          </div>
        </div>
      </section>

    </div>

    <!-- STICKY SAVE -->
    <div class="fixed bottom-8 right-8 z-40">
      <AppButton size="xl" icon="pi-save" @click="saveProfile" :loading="saving" class="shadow-2xl font-bold px-10">
        Save PDS Profile
      </AppButton>
    </div>

  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }

/* List Animations */
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>
