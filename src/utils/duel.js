export function duelOutcome(players) {
  const [first, second] = players
  const winner = comparePlayers(first, second)
  if (!winner) return { tied: true, title: '旗鼓相当，平局！' }
  return { tied: false, winner, title: `${winner.name} 获胜！` }
}

function comparePlayers(first, second) {
  if (first.matched !== second.matched) return first.matched > second.matched ? first : second
  if (first.score !== second.score) return first.score > second.score ? first : second
  if (first.finishedAt != null && second.finishedAt != null && first.finishedAt !== second.finishedAt) {
    return first.finishedAt < second.finishedAt ? first : second
  }
  return null
}
