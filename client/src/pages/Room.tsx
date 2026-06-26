import { useParams } from 'react-router-dom'
import { useGame } from '@/lib/store'
import { JoinGate } from '@/components/JoinGate'
import Player from './Player'
import Moderator from './Moderator'

export default function Room() {
  const { code } = useParams()
  const roomCode = (code || '').toUpperCase()
  const identity = useGame((s) => s.identity)

  const inThisRoom =
    identity.roomCode === roomCode &&
    (identity.role === 'moderator' || identity.role === 'player') &&
    !!identity.playerId

  if (!inThisRoom) return <JoinGate roomCode={roomCode} />
  if (identity.role === 'moderator') return <Moderator />
  return <Player />
}
