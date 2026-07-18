export type Sex = 'male' | 'female'
export type Goal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'general_fitness'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'none' | 'dumbbells' | 'full_gym'
export type DietPref = 'omnivore' | 'vegetarian' | 'vegan'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type StressLevel = 'low' | 'moderate' | 'high'

export type MedicalCondition =
  | 'hypertension'
  | 'diabetes'
  | 'heart_condition'
  | 'asthma'
  | 'pregnancy'
  | 'other'

export type Injury = 'knee' | 'shoulder' | 'lower_back' | 'hip' | 'wrist_elbow' | 'ankle'

export interface LifestyleFlags {
  allOrNothing: boolean
  timeCrunched: boolean
  travelsOften: boolean
  eveningSnacker: boolean
  deskJob: boolean
  trainsAlone: boolean
}

export interface Profile {
  name: string
  age: number
  sex: Sex
  heightCm: number
  weightKg: number
  bodyFatPct?: number
  goal: Goal
  goalWeightKg?: number
  fitnessLevel: FitnessLevel
  medicalConditions: MedicalCondition[]
  injuries: Injury[]
  equipment: Equipment
  daysPerWeek: number
  minutesPerSession: number
  sleepHours: number
  stressLevel: StressLevel
  activityLevel: ActivityLevel
  dietPref: DietPref
  mealsPerDay: number
  lifestyle: LifestyleFlags
}

export interface MacroTargets {
  calories: number
  proteinG: number
  fatG: number
  carbsG: number
}

export interface NutritionPlan {
  maintenanceCalories: number
  targets: MacroTargets
  proteinPerKg: number
  hydrationMlPerDay: number
  notes: string[]
}

export interface ExercisePrescription {
  name: string
  sets: number
  reps: string
  rpe: string
  notes?: string
}

export interface WorkoutSession {
  name: string
  focus: string
  warmup: string[]
  exercises: ExercisePrescription[]
  mobilityFinisher: string[]
}

export interface CardioPrescription {
  sessionsPerWeek: number
  description: string
  stepsTarget: number
  hiitSessionsPerWeek: number
  hiitDescription: string
}

export interface WorkoutProgram {
  splitName: string
  sessions: WorkoutSession[]
  cardio: CardioPrescription
  progressionRules: string[]
  deloadRule: string
  cautions: string[]
}

export interface RoadmapPhase {
  name: string
  weeks: string
  focus: string
  trainingEmphasis: string
  nutritionEmphasis: string
  checkpoints: string[]
}

export interface Roadmap {
  etaWeeks: number | null
  weeklyRateKg: number
  summary: string
  phases: RoadmapPhase[]
  trackingProtocol: string[]
}

export interface WeighIn {
  date: string // ISO yyyy-mm-dd
  weightKg: number
}

export type ProgressStatus =
  | 'insufficient_data'
  | 'on_track'
  | 'slow'
  | 'stalled'
  | 'too_fast'

export interface ProgressAnalysis {
  status: ProgressStatus
  currentAvgKg: number | null
  previousAvgKg: number | null
  weeklyChangeKg: number | null
  targetWeeklyChangeKg: number
  recommendation: string[]
  dietBreakSuggested: boolean
}

export interface Directive {
  icon: string
  headline: string
  detail: string
}

export type EvidenceGrade = 'strong' | 'moderate' | 'emerging'

export interface SupplementRec {
  name: string
  grade: EvidenceGrade
  dose: string
  timing: string
  why: string
  caution?: string
}

export interface LoggedSet {
  weightKg: number | null
  reps: number | null
  done: boolean
}

export interface LoggedExercise {
  name: string
  targetReps: string
  sets: LoggedSet[]
}

export interface ActiveWorkout {
  sessionName: string
  startedAt: string // ISO datetime
  exercises: LoggedExercise[]
}

export interface CompletedWorkout {
  date: string // ISO yyyy-mm-dd
  sessionName: string
  durationMin: number
  exercises: LoggedExercise[]
  totalVolumeKg: number
  totalSets: number
}

export interface Habit {
  id: string
  title: string
  anchor: string
  why: string
}

export interface FrictionFinding {
  title: string
  detail: string
}

export interface HabitPlan {
  findings: FrictionFinding[]
  habits: Habit[]
  principles: string[]
}
