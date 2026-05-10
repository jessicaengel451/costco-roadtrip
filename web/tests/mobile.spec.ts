import { test, expect } from '@playwright/test'

// These run on every project (chromium + mobile-chrome + mobile-safari).
// Using .click() rather than .tap() so the suite works on non-touch browsers
// too — Playwright dispatches touch events automatically when hasTouch is set.

test.describe('responsive behavior', () => {
  test('no horizontal scrollbar at any viewport', async ({ page }) => {
    await page.goto('/')
    const scroll = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(scroll.width).toBeLessThanOrEqual(scroll.client + 1)
  })

  test('search input is reachable and usable', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Checklist View/i }).click()
    const search = page.getByPlaceholder('Search locations...')
    await search.scrollIntoViewIfNeeded()
    await expect(search).toBeVisible()
    await search.fill('seattle')
    const items = page.locator('.location-item')
    await expect(items.first()).toBeVisible()
  })

  test('checklist items toggle on click/tap', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Checklist View/i }).click()
    const item = page.locator('.location-item').first()
    await item.scrollIntoViewIfNeeded()
    await item.click()
    await expect(item).toHaveClass(/visited/)
  })

  test('share modal opens, copy button works', async ({ page, context, browserName }) => {
    // WebKit doesn't expose `clipboard-write` as a permission name. The Copy
    // button still works (writeText resolves), but we skip the explicit grant.
    if (browserName !== 'webkit') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    }
    await page.goto('/')
    await page.getByRole('button', { name: /Share Progress/i }).first().click()
    const dialog = page.getByRole('dialog', { name: /Share your progress/i })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Copy' }).first().click()
    await expect(dialog.getByRole('button', { name: 'Copied!' }).first()).toBeVisible()
    await page.locator('.modal').click({ position: { x: 5, y: 5 } })
    await expect(dialog).toBeHidden()
  })

  test('reddit share modal shows the three reddit panels', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Share on Reddit/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Reddit Comment Format')).toBeVisible()
    await expect(dialog.getByText('Reddit Post Format')).toBeVisible()
    await expect(dialog.getByText('One-Line Format')).toBeVisible()
  })
})
