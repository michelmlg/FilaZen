<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import {
  Loader2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingIcon,
  BriefcaseIcon,
  CheckIcon,
  PencilIcon,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const auth = useAuthStore()
const { post, get } = useApi()
const toast = useToast()
const router = useRouter()

// ─── Wizard state ────────────────
const currentStep = ref(1)
const totalSteps = 2
const loading = ref(false)
const error = ref('')
const slideDirection = ref<'left' | 'right'>('left')

// ─── Step 1: Organização + Usuário ────────────────
const tenantName = ref('')
const tenantSlug = ref('')
const slugAvailable = ref<boolean | null>(null)
const slugChecking = ref(false)
const slugEditing = ref(false)

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')

// ─── Step 2: Lead + Termos ────────────────
const industry = ref('')
const source = ref('')
const companySize = ref('')
const phone = ref('')
const acceptedTerms = ref(false)

// ─── Slug generation ────────────────
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

let slugTimeout: ReturnType<typeof setTimeout> | null = null

watch(tenantName, (val) => {
  if (!slugEditing.value) {
    tenantSlug.value = generateSlug(val)
  }
})

watch(tenantSlug, (val) => {
  slugAvailable.value = null
  if (slugTimeout) clearTimeout(slugTimeout)
  if (val.length >= 3) {
    slugChecking.value = true
    slugTimeout = setTimeout(async () => {
      try {
        const res = await get<{ available: boolean }>(`/tenants/check-slug/${val}`)
        slugAvailable.value = res.available
      } catch {
        slugAvailable.value = null
      } finally {
        slugChecking.value = false
      }
    }, 400)
  }
})

// ─── Password strength ────────────────
const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[a-z]/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  const s = passwordStrength.value
  if (s === 0) return ''
  if (s <= 2) return 'Fraca'
  if (s <= 3) return 'Média'
  if (s <= 4) return 'Forte'
  return 'Muito forte'
})

const strengthColor = computed(() => {
  const s = passwordStrength.value
  if (s <= 2) return 'bg-red-500'
  if (s <= 3) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const strengthPercent = computed(() => {
  return (passwordStrength.value / 5) * 100
})

// ─── Step validation ────────────────
const step1Valid = computed(() => {
  return (
    tenantName.value.length >= 2 &&
    tenantSlug.value.length >= 3 &&
    slugAvailable.value === true &&
    name.value.length >= 2 &&
    email.value.includes('@') &&
    password.value.length >= 8 &&
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value) &&
    password.value === passwordConfirm.value
  )
})

const step2Valid = computed(() => {
  return acceptedTerms.value
})

const passwordErrors = computed(() => {
  const errors: string[] = []
  if (password.value.length > 0) {
    if (password.value.length < 8) errors.push('Mínimo 8 caracteres')
    if (!/(?=.*[a-z])/.test(password.value)) errors.push('Letra minúscula')
    if (!/(?=.*[A-Z])/.test(password.value)) errors.push('Letra maiúscula')
    if (!/(?=.*\d)/.test(password.value)) errors.push('Número')
    if (passwordConfirm.value && password.value !== passwordConfirm.value) errors.push('Senhas não coincidem')
  }
  return errors
})

// ─── Navigation ────────────────
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    error.value = ''
    slideDirection.value = 'left'
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    error.value = ''
    slideDirection.value = 'right'
    currentStep.value--
  }
}

// ─── Submit ────────────────
const handleSubmit = async () => {
  if (!acceptedTerms.value) return

  loading.value = true
  error.value = ''

  try {
    await post('/auth/register', {
      tenantName: tenantName.value,
      tenantSlug: tenantSlug.value,
      name: name.value,
      email: email.value,
      password: password.value,
      industry: industry.value || undefined,
      source: source.value || undefined,
      companySize: companySize.value || undefined,
      phone: phone.value || undefined,
    })

    const result = await auth.login({
      email: email.value,
      password: password.value,
    })

    if (result === 'success') {
      toast.success('Organização criada!', 'Bem-vindo ao FilaZen!')
      router.push('/')
    } else {
      error.value = 'Registro concluído. Faça login para continuar.'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.'
  } finally {
    loading.value = false
  }
}

// ─── Enums ────────────────
const industries = [
  { value: 'varejo', label: 'Varejo / Comércio' },
  { value: 'saude', label: 'Saúde' },
  { value: 'tech', label: 'Tecnologia' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'educacao', label: 'Educação' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'outros', label: 'Outros' },
]

const sources = [
  { value: 'google', label: 'Google / Busca' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'evento', label: 'Evento / Feira' },
  { value: 'outros', label: 'Outro' },
]

const companySizes = [
  { value: 'solo', label: 'Sou só eu (individual)' },
  { value: '1-10', label: '1–10 membros' },
  { value: '11-50', label: '11–50 membros' },
  { value: '51-200', label: '51–200 membros' },
  { value: '200+', label: '200+ membros' },
]

// ─── Step definitions (icon-only) ────────────────
const steps = [
  { number: 1, icon: BuildingIcon },
  { number: 2, icon: BriefcaseIcon },
]
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">Criar sua organização</h2>
      <p class="text-sm text-muted-foreground">
        Configure seu espaço e comece a usar o FilaZen
      </p>
    </div>

    <!-- Progress steps (icon-only, no labels) -->
    <div class="flex items-center justify-center gap-3">
      <template v-for="step in steps" :key="step.number">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
          :class="
            currentStep > step.number
              ? 'border-primary bg-primary text-primary-foreground scale-95'
              : currentStep === step.number
                ? 'border-primary text-primary scale-105 shadow-md shadow-primary/20'
                : 'border-muted-foreground/25 text-muted-foreground/50'
          "
        >
          <CheckIcon v-if="currentStep > step.number" class="h-5 w-5" />
          <component :is="step.icon" v-else class="h-5 w-5" />
        </div>
        <div
          v-if="step.number < totalSteps"
          class="h-0.5 w-12 rounded-full transition-colors duration-300"
          :class="currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/15'"
        />
      </template>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Slide transition wrapper -->
    <Transition :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">

      <!-- Step 1: Organização + Usuário -->
      <form v-if="currentStep === 1" key="step-1" class="space-y-5" @submit.prevent="nextStep">

        <!-- Seção: Organização -->
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organização</p>

          <div class="space-y-2">
            <Label for="tenantName">Nome da organização</Label>
            <Input
              id="tenantName"
              v-model="tenantName"
              type="text"
              placeholder="Minha Organização"
              required
            />

            <!-- Slug click-to-edit -->
            <div class="flex items-center gap-1.5 text-xs min-h-[20px]">
              <template v-if="slugEditing">
                <Input
                  id="tenantSlug"
                  v-model="tenantSlug"
                  type="text"
                  placeholder="minha-organizacao"
                  class="h-7 text-xs"
                />
                <button type="button" class="text-primary hover:underline shrink-0" @click="slugEditing = false">OK</button>
              </template>
              <template v-else>
                <Loader2Icon v-if="slugChecking" class="animate-spin h-3 w-3 text-muted-foreground" />
                <template v-else-if="tenantSlug.length >= 3">
                  <span v-if="slugAvailable === true" class="text-emerald-500">✓</span>
                  <span v-else-if="slugAvailable === false" class="text-destructive">✗</span>
                </template>
                <span class="text-muted-foreground">
                  {{ tenantSlug ? `${tenantSlug}.filazen.com` : 'sua-organizacao.filazen.com' }}
                </span>
                <button
                  v-if="tenantSlug"
                  type="button"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                  @click="slugEditing = true"
                  title="Editar URL"
                >
                  <PencilIcon class="h-3 w-3" />
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Divisor visual -->
        <div class="h-px bg-border" />

        <!-- Seção: Administrador -->
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administrador</p>

          <div class="space-y-2">
            <Label for="name">Seu nome</Label>
            <Input
              id="name"
              v-model="name"
              type="text"
              required
              placeholder="João Silva"
              autocomplete="name"
            />
          </div>

          <div class="space-y-2">
            <Label for="registerEmail">Email</Label>
            <Input
              id="registerEmail"
              v-model="email"
              type="email"
              required
              placeholder="joao@organizacao.com"
              autocomplete="email"
            />
          </div>

          <div class="space-y-2">
            <Label for="registerPassword">Senha</Label>
            <Input
              id="registerPassword"
              v-model="password"
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            />

            <!-- Password strength meter -->
            <div v-if="password.length > 0" class="space-y-1.5">
              <div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300 ease-out"
                  :class="strengthColor"
                  :style="{ width: `${strengthPercent}%` }"
                />
              </div>
              <p class="text-xs text-muted-foreground">
                Força: <span :class="strengthColor.replace('bg-', 'text-')" class="font-medium">{{ strengthLabel }}</span>
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="passwordConfirm">Confirmar senha</Label>
            <Input
              id="passwordConfirm"
              v-model="passwordConfirm"
              type="password"
              required
              placeholder="Repita a senha"
              autocomplete="new-password"
            />
          </div>

          <!-- Password validation hints -->
          <div v-if="passwordErrors.length > 0" class="space-y-1">
            <p v-for="err in passwordErrors" :key="err" class="text-xs text-destructive flex items-center gap-1.5">
              <span class="h-1 w-1 rounded-full bg-destructive shrink-0" /> {{ err }}
            </p>
          </div>
        </div>

        <Button type="submit" :disabled="!step1Valid" class="w-full">
          Próximo
          <ArrowRightIcon class="ml-2 h-4 w-4" />
        </Button>
      </form>

      <!-- Step 2: Lead + Termos -->
      <form v-else-if="currentStep === 2" key="step-2" class="space-y-5" @submit.prevent="handleSubmit">
        <p class="text-sm text-muted-foreground">
          Informações opcionais que nos ajudam a personalizar sua experiência.
        </p>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="industry">Segmento de atuação</Label>
            <Select id="industry" v-model="industry">
              <SelectItem value="" disabled>Selecione...</SelectItem>
              <SelectItem v-for="opt in industries" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="source">Como nos conheceu?</Label>
            <Select id="source" v-model="source">
              <SelectItem value="" disabled>Selecione...</SelectItem>
              <SelectItem v-for="opt in sources" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="companySize">Tamanho da organização</Label>
            <Select id="companySize" v-model="companySize">
              <SelectItem value="" disabled>Selecione...</SelectItem>
              <SelectItem v-for="opt in companySizes" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              v-model="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              autocomplete="tel"
            />
          </div>
        </div>

        <!-- Termos de serviço -->
        <div class="h-px bg-border" />

        <div class="flex items-start gap-3">
          <Checkbox id="terms" v-model="acceptedTerms" class="mt-0.5" />
          <label for="terms" class="text-sm text-muted-foreground cursor-pointer leading-snug">
            Eu li e aceito os
            <a href="#" class="font-medium text-primary hover:text-primary/80 underline underline-offset-4" @click.prevent>
              Termos de Serviço
            </a>
            e a
            <a href="#" class="font-medium text-primary hover:text-primary/80 underline underline-offset-4" @click.prevent>
              Política de Privacidade
            </a>
          </label>
        </div>

        <div class="flex gap-3">
          <Button type="button" variant="outline" class="flex-1" @click="prevStep">
            <ArrowLeftIcon class="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button type="submit" :disabled="loading || !step2Valid" class="flex-1">
            <Loader2Icon v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ loading ? 'Criando...' : 'Criar organização' }}
          </Button>
        </div>
      </form>
    </Transition>

    <div class="text-center text-sm text-muted-foreground">
      Já tem uma conta?
      <router-link to="/login" class="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline">
        Faça login
      </router-link>
    </div>
  </div>
</template>

<style scoped>
/* Slide left (going forward) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide right (going back) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
