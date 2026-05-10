import { test, expect } from '@playwright/test'

test.describe('smoke', () => {
  test('page loads with header and stats', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Costco/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Costco Roadtrip/i)
    await expect(page.getByText('Total Locations')).toBeVisible()
    await expect(page.getByText('Visited').first()).toBeVisible()
  })

  test('can switch between map and checklist views', async ({ page }) => {
    await page.goto('/')
    // Map is default — leaflet attribution should be present.
    await expect(page.locator('.leaflet-container')).toBeVisible()

    await page.getByRole('button', { name: /Checklist View/i }).click()
    await expect(page.locator('.location-item').first()).toBeVisible()

    await page.getByRole('button', { name: /Map View/i }).click()
    await expect(page.locator('.leaflet-container')).toBeVisible()
  })

  test('marking a location visited persists across reloads via localStorage', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Checklist View/i }).click()

    const firstItem = page.locator('.location-item').first()
    await expect(firstItem).toBeVisible()
    const checkbox = firstItem.locator('input[type="checkbox"]')

    await checkbox.check()
    await expect(firstItem).toHaveClass(/visited/)

    await page.reload()
    await page.getByRole('button', { name: /Checklist View/i }).click()
    const firstItemAfter = page.locator('.location-item').first()
    await expect(firstItemAfter).toHaveClass(/visited/)
  })

  test('search filter narrows the checklist', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Checklist View/i }).click()
    await page.getByPlaceholder('Search locations...').fill('anchorage')
    const items = page.locator('.location-item')
    await expect(items.first()).toBeVisible()
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(20)
  })
})
