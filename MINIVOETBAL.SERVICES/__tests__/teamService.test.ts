import { describe, it, expect, vi, beforeEach } from 'vitest'
import { teamService } from '../core/teamService'
import { supabase } from '../../../MINIVOETBAL.SDK/client'

// Mock Supabase
vi.mock('../../MINIVOETBAL.SDK/client', () => ({
  supabase: {
    from: vi.fn()
  }
}))

const mockSupabase = supabase as vi.Mocked<typeof supabase>

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllTeams', () => {
    it('should fetch teams successfully', async () => {
      const mockTeams = [
        {
          team_id: 1,
          team_name: 'Test Team 1',
          contact_person: 'John Doe',
          contact_phone: '0123456789',
          contact_email: 'john@test.com',
          club_colors: 'Red-Blue',
        }
      ]

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTeams,
          error: null
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      })

      const result = await teamService.getAllTeams()

      expect(mockSupabase.from).toHaveBeenCalledWith('teams')
      expect(mockSelect).toHaveBeenCalledWith('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
      expect(result).toEqual(mockTeams)
    })

    it('should handle database errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      })

      await expect(teamService.getAllTeams()).rejects.toThrow('Database error')
    })

    it('should fallback to basic columns when contact columns do not exist', async () => {
      const mockTeams = [
        {
          team_id: 1,
          team_name: 'Test Team 1',
        }
      ]

      // First call fails with column error
      const mockSelectFirst = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'column \'contact_person\' does not exist on \'teams\'' }
        })
      })

      // Second call succeeds with basic columns
      const mockSelectSecond = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTeams,
          error: null
        })
      })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({
          select: mockSelectFirst
        })
        .mockReturnValueOnce({
          select: mockSelectSecond
        })

      const result = await teamService.getAllTeams()

      expect(result).toEqual([
        {
          team_id: 1,
          team_name: 'Test Team 1',
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        }
      ])
    })
  })

  describe('getTeamById', () => {
    it('should fetch single team successfully', async () => {
      const mockTeam = {
        team_id: 1,
        team_name: 'Test Team',
        contact_person: 'John Doe',
        contact_phone: '0123456789',
        contact_email: 'john@test.com',
        club_colors: 'Red-Blue',
      }

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTeam,
            error: null
          })
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      })

      const result = await teamService.getTeamById(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('teams')
      expect(result).toEqual(mockTeam)
    })

    it('should return null when team not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Team not found' }
          })
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      })

      const result = await teamService.getTeamById(999)

      expect(result).toBeNull()
    })
  })

  describe('createTeam', () => {
    it('should create team successfully', async () => {
      const newTeam = {
        team_name: 'New Team',
        contact_person: 'Jane Doe',
        contact_phone: '0987654321',
        contact_email: 'jane@test.com',
        club_colors: 'Green-Yellow',
      }

      const createdTeam = {
        team_id: 2,
        ...newTeam
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createdTeam,
            error: null
          })
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      const result = await teamService.createTeam(newTeam)

      expect(mockSupabase.from).toHaveBeenCalledWith('teams')
      expect(result).toEqual(createdTeam)
    })

    it('should handle creation errors', async () => {
      const newTeam = {
        team_name: 'New Team',
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Creation failed' }
          })
        })
      })

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      await expect(teamService.createTeam(newTeam)).rejects.toThrow('Creation failed')
    })
  })
}) 