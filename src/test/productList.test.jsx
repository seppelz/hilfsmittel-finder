import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductList } from '../components/ProductList'

const sampleProducts = Array.from({ length: 3 }, (_, index) => ({
  id: `prod-${index + 1}`,
  bezeichnung: `Produkt ${index + 1}`,
}))

describe('ProductList', () => {
  it('renders pagination summary with range information', () => {
    render(
      <ProductList
        products={sampleProducts}
        selectedProducts={[]}
        pagination={{ page: 2, pageSize: 12, total: 30, onPageChange: () => {} }}
      />,
    )

    expect(
      screen.getByText((content) =>
        content.includes('Seite 2 von 3') && content.includes('13–24 von 30'),
      ),
    ).toBeInTheDocument()
  })
})
