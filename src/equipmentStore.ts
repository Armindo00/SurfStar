import type {
  AthleteBoard,
  AthleteFin,
  EquipmentEvaluation,
  SessionAthleteFeedback,
} from './types'

const KEY = 'surfstar-equipment-v1'

type EquipmentPersisted = {
  boards: AthleteBoard[]
  fins: AthleteFin[]
  evaluations: EquipmentEvaluation[]
  sessionFeedback: SessionAthleteFeedback[]
}

function load(): EquipmentPersisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { boards: [], fins: [], evaluations: [], sessionFeedback: [] }
    }
    const parsed = JSON.parse(raw) as EquipmentPersisted
    return {
      boards: parsed.boards ?? [],
      fins: parsed.fins ?? [],
      evaluations: parsed.evaluations ?? [],
      sessionFeedback: parsed.sessionFeedback ?? [],
    }
  } catch {
    return { boards: [], fins: [], evaluations: [], sessionFeedback: [] }
  }
}

function save(data: EquipmentPersisted) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const equipmentStore = {
  getBoards(athleteId: string) {
    return load().boards.filter((b) => b.athleteId === athleteId)
  },
  getFins(athleteId: string) {
    return load().fins.filter((f) => f.athleteId === athleteId)
  },
  getEvaluations(athleteId: string) {
    return load().evaluations.filter((e) => e.athleteId === athleteId)
  },
  getSessionFeedback(athleteId: string) {
    return load().sessionFeedback.filter((f) => f.athleteId === athleteId)
  },
  saveBoard(board: AthleteBoard) {
    const data = load()
    const idx = data.boards.findIndex((b) => b.id === board.id)
    if (idx >= 0) data.boards[idx] = board
    else data.boards.unshift(board)
    save(data)
    return board
  },
  deleteBoard(boardId: string) {
    const data = load()
    data.boards = data.boards.filter((b) => b.id !== boardId)
    save(data)
  },
  saveFin(fin: AthleteFin) {
    const data = load()
    const idx = data.fins.findIndex((f) => f.id === fin.id)
    if (idx >= 0) data.fins[idx] = fin
    else data.fins.unshift(fin)
    save(data)
    return fin
  },
  deleteFin(finId: string) {
    const data = load()
    data.fins = data.fins.filter((f) => f.id !== finId)
    save(data)
  },
  saveEvaluation(evaluation: EquipmentEvaluation) {
    const data = load()
    data.evaluations.unshift(evaluation)
    save(data)
    return evaluation
  },
  saveSessionFeedback(feedback: SessionAthleteFeedback) {
    const data = load()
    const idx = data.sessionFeedback.findIndex(
      (f) => f.sessionId === feedback.sessionId && f.athleteId === feedback.athleteId,
    )
    if (idx >= 0) data.sessionFeedback[idx] = feedback
    else data.sessionFeedback.unshift(feedback)
    save(data)
    return feedback
  },
}
