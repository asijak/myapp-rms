import { ref } from 'vue'
import apiClient from '@/api/axios'

export function useJobs() {
  const jobs = ref([])
  const job = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const meta = ref({ results: 0 })

  const fetchJobs = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/v1/jobs', { params })
      jobs.value = response.data.data
      meta.value.results = response.data.results
    } catch (err) {
      error.value = err.response?.data?.message || 'Error fetching jobs'
    } finally {
      loading.value = false
    }
  }

  const fetchJobById = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/v1/jobs/${id}`)
      job.value = response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Job not found'
    } finally {
      loading.value = false
    }
  }

  return {
    jobs,
    job,
    loading,
    error,
    meta,
    fetchJobs,
    fetchJobById,
  }
}
