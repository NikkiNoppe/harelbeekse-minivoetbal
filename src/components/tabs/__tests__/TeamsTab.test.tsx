import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import TeamsTab from '../TeamsTab'
import { useTeams } from '@/hooks/useTeams'

// Mock the useTeams hook
vi.mock('@/hooks/useTeams')

const mockUseTeams = useTeams as vi.MockedFunction<typeof useTeams>

describe('TeamsTab', () => {
  const mockTeams = [
    {
      team_id: 1,
      team_name: 'Test Team 1',
      contact_person: 'John Doe',
      contact_phone: '0123456789',
      contact_email: 'john@test.com',
      club_colors: 'Red-Blue',
    },
    {
      team_id: 2,
      team_name: 'Test Team 2',
      contact_person: null,
      contact_phone: null,
      contact_email: null,
      club_colors: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseTeams.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    expect(screen.getByText('Teams')).toBeInTheDocument()
    // Check for skeleton loading
    expect(screen.getByTestId('team-skeleton')).toBeInTheDocument()
  })

  it('renders teams correctly', async () => {
    mockUseTeams.mockReturnValue({
      data: mockTeams,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Team 1')).toBeInTheDocument()
      expect(screen.getByText('Test Team 2')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('0123456789')).toBeInTheDocument()
      expect(screen.getByText('john@test.com')).toBeInTheDocument()
      expect(screen.getByText('Red-Blue')).toBeInTheDocument()
    })
  })

  it('renders empty state when no teams', () => {
    mockUseTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    expect(screen.getByText('Geen teams gevonden')).toBeInTheDocument()
    expect(screen.getByText('Er zijn momenteel geen teams geregistreerd.')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const mockRefetch = vi.fn()
    mockUseTeams.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Test error' },
      refetch: mockRefetch,
    })

    render(<TeamsTab />)
    
    expect(screen.getByText('Fout bij laden')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Opnieuw proberen')).toBeInTheDocument()
  })

  it('shows contact info when available', async () => {
    mockUseTeams.mockReturnValue({
      data: [mockTeams[0]], // Team with contact info
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('0123456789')).toBeInTheDocument()
      expect(screen.getByText('john@test.com')).toBeInTheDocument()
    })
  })

  it('shows no contact info message when contact data is missing', async () => {
    mockUseTeams.mockReturnValue({
      data: [mockTeams[1]], // Team without contact info
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Geen contactgegevens beschikbaar')).toBeInTheDocument()
    })
  })

  it('displays club colors badge when available', async () => {
    mockUseTeams.mockReturnValue({
      data: [mockTeams[0]], // Team with club colors
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<TeamsTab />)
    
    await waitFor(() => {
      expect(screen.getByText('Red-Blue')).toBeInTheDocument()
    })
  })
}) 