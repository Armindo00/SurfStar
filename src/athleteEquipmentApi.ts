import { getSupabase } from './lib/supabase'
import type {
  AthleteBoard,
  AthleteFin,
  EquipmentEvaluation,
  EquipmentType,
  MentalState,
  SessionAthleteFeedback,
} from './types'

type BoardRow = {
  id: string
  athlete_id: string
  name: string
  length_cm: number | null
  width_inches: number | null
  thickness_inches: number | null
  volume_liters: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type FinRow = {
  id: string
  athlete_id: string
  name: string
  size: string | null
  template: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type EvaluationRow = {
  id: string
  coach_id: string
  athlete_id: string
  equipment_type: EquipmentType
  equipment_id: string
  speed: number
  control: number
  release: number
  notes: string | null
  created_at: string
}

type FeedbackRow = {
  id: string
  session_id: string
  athlete_id: string
  coach_id: string
  board_id: string | null
  fin_id: string | null
  mental_state: MentalState
  written_note: string | null
  submitted_at: string
}

function mapBoard(row: BoardRow): AthleteBoard {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    name: row.name,
    lengthCm: row.length_cm,
    widthInches: row.width_inches,
    thicknessInches: row.thickness_inches,
    volumeLiters: row.volume_liters,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapFin(row: FinRow): AthleteFin {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    name: row.name,
    size: row.size,
    template: row.template,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEvaluation(row: EvaluationRow): EquipmentEvaluation {
  return {
    id: row.id,
    coachId: row.coach_id,
    athleteId: row.athlete_id,
    equipmentType: row.equipment_type,
    equipmentId: row.equipment_id,
    speed: row.speed,
    control: row.control,
    release: row.release,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

function mapFeedback(row: FeedbackRow): SessionAthleteFeedback {
  return {
    id: row.id,
    sessionId: row.session_id,
    athleteId: row.athlete_id,
    coachId: row.coach_id,
    boardId: row.board_id,
    finId: row.fin_id,
    mentalState: row.mental_state,
    writtenNote: row.written_note,
    submittedAt: row.submitted_at,
  }
}

export async function cloudFetchAthleteBoards(athleteId: string): Promise<AthleteBoard[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('athlete_boards')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as BoardRow[]).map(mapBoard)
}

export async function cloudFetchAthleteFins(athleteId: string): Promise<AthleteFin[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('athlete_fins')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FinRow[]).map(mapFin)
}

export async function cloudFetchEquipmentEvaluations(athleteId: string): Promise<EquipmentEvaluation[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('equipment_evaluations')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as EvaluationRow[]).map(mapEvaluation)
}

export async function cloudFetchSessionFeedback(athleteId: string): Promise<SessionAthleteFeedback[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('session_athlete_feedback')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FeedbackRow[]).map(mapFeedback)
}

export async function cloudUpsertAthleteBoard(
  athleteId: string,
  board: Omit<AthleteBoard, 'athleteId' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<AthleteBoard> {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  const payload = {
    ...(board.id ? { id: board.id } : {}),
    athlete_id: athleteId,
    name: board.name.trim(),
    length_cm: board.lengthCm,
    width_inches: board.widthInches,
    thickness_inches: board.thicknessInches,
    volume_liters: board.volumeLiters,
    notes: board.notes?.trim() || null,
    updated_at: now,
  }
  const { data, error } = await supabase.from('athlete_boards').upsert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return mapBoard(data as BoardRow)
}

export async function cloudDeleteAthleteBoard(boardId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('athlete_boards').delete().eq('id', boardId)
  if (error) throw new Error(error.message)
}

export async function cloudUpsertAthleteFin(
  athleteId: string,
  fin: Omit<AthleteFin, 'athleteId' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<AthleteFin> {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  const payload = {
    ...(fin.id ? { id: fin.id } : {}),
    athlete_id: athleteId,
    name: fin.name.trim(),
    size: fin.size?.trim() || null,
    template: fin.template?.trim() || null,
    notes: fin.notes?.trim() || null,
    updated_at: now,
  }
  const { data, error } = await supabase.from('athlete_fins').upsert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return mapFin(data as FinRow)
}

export async function cloudDeleteAthleteFin(finId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('athlete_fins').delete().eq('id', finId)
  if (error) throw new Error(error.message)
}

export async function cloudSaveEquipmentEvaluation(
  coachId: string,
  athleteId: string,
  evaluation: {
    equipmentType: EquipmentType
    equipmentId: string
    speed: number
    control: number
    release: number
    notes: string | null
  },
): Promise<EquipmentEvaluation> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('equipment_evaluations')
    .insert({
      coach_id: coachId,
      athlete_id: athleteId,
      equipment_type: evaluation.equipmentType,
      equipment_id: evaluation.equipmentId,
      speed: evaluation.speed,
      control: evaluation.control,
      release: evaluation.release,
      notes: evaluation.notes?.trim() || null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapEvaluation(data as EvaluationRow)
}

export async function cloudSubmitSessionFeedback(input: {
  sessionId: string
  athleteId: string
  coachId: string
  boardId: string | null
  finId: string | null
  mentalState: MentalState
  writtenNote: string | null
}): Promise<SessionAthleteFeedback> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('session_athlete_feedback')
    .upsert(
      {
        session_id: input.sessionId,
        athlete_id: input.athleteId,
        coach_id: input.coachId,
        board_id: input.boardId,
        fin_id: input.finId,
        mental_state: input.mentalState,
        written_note: input.writtenNote?.trim() || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,athlete_id' },
    )
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapFeedback(data as FeedbackRow)
}

export async function cloudLoadAthleteEquipmentBundle(athleteId: string) {
  const [boards, fins, evaluations, sessionFeedback] = await Promise.all([
    cloudFetchAthleteBoards(athleteId),
    cloudFetchAthleteFins(athleteId),
    cloudFetchEquipmentEvaluations(athleteId),
    cloudFetchSessionFeedback(athleteId),
  ])
  return { boards, fins, evaluations, sessionFeedback }
}
