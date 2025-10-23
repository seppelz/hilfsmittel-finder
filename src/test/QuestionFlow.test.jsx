import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionFlow } from '../components/QuestionFlow'

describe('QuestionFlow', () => {
  it('preselects answers passed via initialAnswers', () => {
    render(
      <QuestionFlow
        insuranceType="gkv"
        initialAnswers={{ mobility_ability: 'limited_walking' }}
        onComplete={() => {}}
        onBack={() => {}}
      />,
    )

    const option = screen.getByRole('button', {
      name: 'Ich kann kurze Strecken gehen, brauche aber Unterstützung',
    })

    expect(option.className).toMatch(/border-primary/)
  })

  it('calls onAnswersChange when a selection is made', async () => {
    const user = userEvent.setup()
    const onAnswersChange = vi.fn()

    render(
      <QuestionFlow
        insuranceType="gkv"
        initialAnswers={{}}
        onAnswersChange={onAnswersChange}
        onComplete={() => {}}
        onBack={() => {}}
      />,
    )

    const option = screen.getByRole('button', {
      name: 'Ich kann kurze Strecken gehen, brauche aber Unterstützung',
    })
    await user.click(option)

    expect(onAnswersChange).toHaveBeenCalled()
    expect(onAnswersChange.mock.calls.at(-1)[0]).toMatchObject({ mobility_ability: 'limited_walking' })
  })
})
